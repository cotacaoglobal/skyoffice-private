import bcrypt from 'bcrypt'
import { Room, Client, ServerError } from 'colyseus'
import { Dispatcher } from '@colyseus/command'
import { Player, OfficeState, Computer, Whiteboard } from './schema/OfficeState'
import { Message } from '../../types/Messages'
import { IRoomData } from '../../types/Rooms'
import { whiteboardRoomIds } from './schema/OfficeState'
import PlayerUpdateCommand from './commands/PlayerUpdateCommand'
import PlayerUpdateNameCommand from './commands/PlayerUpdateNameCommand'
import {
  ComputerAddUserCommand,
  ComputerRemoveUserCommand,
} from './commands/ComputerUpdateArrayCommand'
import {
  WhiteboardAddUserCommand,
  WhiteboardRemoveUserCommand,
} from './commands/WhiteboardUpdateArrayCommand'
import ChatMessageUpdateCommand from './commands/ChatMessageUpdateCommand'

import { IClaimedChair } from '../../types/IOfficeState'

export class SkyOffice extends Room<OfficeState> {
  private dispatcher = new Dispatcher(this)
  private name: string
  private description: string
  private password: string | null = null
  private claimedChairs = new Map<string, IClaimedChair>()

  async onCreate(options: IRoomData) {
    const { name, description, password, autoDispose } = options
    this.name = name
    this.description = description
    this.autoDispose = autoDispose

    let hasPassword = false
    if (password) {
      const salt = await bcrypt.genSalt(10)
      this.password = await bcrypt.hash(password, salt)
      hasPassword = true
    }
    const theme = options.theme || 'default'
    this.setMetadata({ name, description, hasPassword, theme })

    this.setState(new OfficeState())

    // HARD-CODED: Add 5 computers in a room
    for (let i = 0; i < 5; i++) {
      this.state.computers.set(String(i), new Computer())
    }

    // HARD-CODED: Add 3 whiteboards in a room
    for (let i = 0; i < 3; i++) {
      this.state.whiteboards.set(String(i), new Whiteboard())
    }

    // when a player connect to a computer, add to the computer connectedUser array
    this.onMessage(Message.CONNECT_TO_COMPUTER, (client, message: { computerId: string }) => {
      this.dispatcher.dispatch(new ComputerAddUserCommand(), {
        client,
        computerId: message.computerId,
      })
    })

    // when a player disconnect from a computer, remove from the computer connectedUser array
    this.onMessage(Message.DISCONNECT_FROM_COMPUTER, (client, message: { computerId: string }) => {
      this.dispatcher.dispatch(new ComputerRemoveUserCommand(), {
        client,
        computerId: message.computerId,
      })
    })

    // when a player stop sharing screen
    this.onMessage(Message.STOP_SCREEN_SHARE, (client, message: { computerId: string }) => {
      const computer = this.state.computers.get(message.computerId)
      computer.connectedUser.forEach((id) => {
        this.clients.forEach((cli) => {
          if (cli.sessionId === id && cli.sessionId !== client.sessionId) {
            cli.send(Message.STOP_SCREEN_SHARE, client.sessionId)
          }
        })
      })
    })

    // when a player connect to a whiteboard, add to the whiteboard connectedUser array
    this.onMessage(Message.CONNECT_TO_WHITEBOARD, (client, message: { whiteboardId: string }) => {
      this.dispatcher.dispatch(new WhiteboardAddUserCommand(), {
        client,
        whiteboardId: message.whiteboardId,
      })
    })

    // when a player disconnect from a whiteboard, remove from the whiteboard connectedUser array
    this.onMessage(
      Message.DISCONNECT_FROM_WHITEBOARD,
      (client, message: { whiteboardId: string }) => {
        this.dispatcher.dispatch(new WhiteboardRemoveUserCommand(), {
          client,
          whiteboardId: message.whiteboardId,
        })
      }
    )

    // when receiving updatePlayer message, call the PlayerUpdateCommand
    this.onMessage(
      Message.UPDATE_PLAYER,
      (client, message: { x: number; y: number; anim: string }) => {
        this.dispatcher.dispatch(new PlayerUpdateCommand(), {
          client,
          x: message.x,
          y: message.y,
          anim: message.anim,
        })
      }
    )

    // when receiving updatePlayerName message, call the PlayerUpdateNameCommand
    this.onMessage(Message.UPDATE_PLAYER_NAME, (client, message: { name: string }) => {
      // Remove any ghost players with the same name from previous abandoned sessions
      this.state.players.forEach((p, sId) => {
        if (sId !== client.sessionId && p.name && p.name.trim().toLowerCase() === message.name.trim().toLowerCase()) {
          console.log(`Removendo jogador fantasma com mesmo nome: ${p.name} (${sId})`)
          this.state.players.delete(sId)
        }
      })

      this.dispatcher.dispatch(new PlayerUpdateNameCommand(), {
        client,
        name: message.name,
      })
      for (const [cId, claim] of this.claimedChairs.entries()) {
        if (claim.ownerName === message.name) {
          claim.ownerSessionId = client.sessionId
          this.broadcast(Message.CLAIM_CHAIR, claim)
        }
      }
    })

    // when a player is ready to connect, call the PlayerReadyToConnectCommand
    this.onMessage(Message.READY_TO_CONNECT, (client) => {
      const player = this.state.players.get(client.sessionId)
      if (player) player.readyToConnect = true
    })

    // when a player is ready to connect, call the PlayerReadyToConnectCommand
    this.onMessage(Message.VIDEO_CONNECTED, (client) => {
      const player = this.state.players.get(client.sessionId)
      if (player) player.videoConnected = true
    })

    // when a player disconnect a stream, broadcast the signal to the other player connected to the stream
    this.onMessage(Message.DISCONNECT_STREAM, (client, message: { clientId: string }) => {
      this.clients.forEach((cli) => {
        if (cli.sessionId === message.clientId) {
          cli.send(Message.DISCONNECT_STREAM, client.sessionId)
        }
      })
    })

    // when a player send a chat message, update the message array and broadcast to all connected clients except the sender
    this.onMessage(
      Message.ADD_CHAT_MESSAGE,
      (client, message: { content: string; targetClientId?: string; targetName?: string }) => {
        const dmMatch = message.content?.match(/^\[DM::([^:]+)::([^\]]*)\]/)
        const targetId = message.targetClientId || dmMatch?.[1]

        if (targetId) {
          // Mensagem privada: envia exclusivamente para o destinatário especificado
          this.clients.forEach((cli) => {
            if (cli.sessionId === targetId) {
              cli.send(Message.ADD_CHAT_MESSAGE, {
                clientId: client.sessionId,
                content: message.content,
                targetClientId: targetId,
              })
            }
          })
          return
        }

        // Atualiza o histórico global de mensagens
        this.dispatcher.dispatch(new ChatMessageUpdateCommand(), {
          client,
          content: message.content,
        })

        // Transmite para todos no escritório, exceto o remetente
        this.broadcast(
          Message.ADD_CHAT_MESSAGE,
          { clientId: client.sessionId, content: message.content },
          { except: client }
        )
      }
    )
    // Reivindicar / Vincular mesa de trabalho
    this.onMessage(
      Message.CLAIM_CHAIR,
      (client, message: { chairId: string; name: string; avatar: string }) => {
        const existing = this.claimedChairs.get(message.chairId)
        if (existing && existing.ownerSessionId !== client.sessionId && existing.ownerName !== message.name) {
          return // Já vinculada a outro membro
        }

        // Se o membro já possuía outra mesa, desvincula a anterior
        for (const [cId, claim] of this.claimedChairs.entries()) {
          if (claim.ownerSessionId === client.sessionId || claim.ownerName === message.name) {
            this.claimedChairs.delete(cId)
            this.broadcast(Message.UNCLAIM_CHAIR, { chairId: cId })
          }
        }

        const claimData: IClaimedChair = {
          chairId: message.chairId,
          ownerSessionId: client.sessionId,
          ownerName: message.name,
          ownerAvatar: message.avatar || 'adam',
        }
        this.claimedChairs.set(message.chairId, claimData)
        this.broadcast(Message.CLAIM_CHAIR, claimData)
      }
    )

    // Desvincular / Liberar mesa de trabalho
    this.onMessage(Message.UNCLAIM_CHAIR, (client, message: { chairId: string }) => {
      const existing = this.claimedChairs.get(message.chairId)
      const player = this.state.players.get(client.sessionId)
      if (
        existing &&
        (existing.ownerSessionId === client.sessionId ||
          (player && existing.ownerName === player.name))
      ) {
        this.claimedChairs.delete(message.chairId)
        this.broadcast(Message.UNCLAIM_CHAIR, { chairId: message.chairId })
      }
    })
  }

  async onAuth(client: Client, options: { password: string | null }) {
    if (this.password) {
      const validPassword = await bcrypt.compare(options.password, this.password)
      if (!validPassword) {
        throw new ServerError(403, 'Password is incorrect!')
      }
    }
    return true
  }

  onJoin(client: Client, options: any) {
    this.state.players.set(client.sessionId, new Player())
    client.send(Message.SEND_ROOM_DATA, {
      id: this.roomId,
      name: this.name,
      description: this.description,
      theme: (this.metadata as any)?.theme || 'default',
    })

    // Sincroniza todas as mesas atualmente vinculadas para o novo cliente
    if (this.claimedChairs.size > 0) {
      client.send(Message.SYNC_CHAIRS, Array.from(this.claimedChairs.values()))
    }
  }

  onLeave(client: Client, consented: boolean) {
    if (this.state.players.has(client.sessionId)) {
      this.state.players.delete(client.sessionId)
    }
    this.state.computers.forEach((computer) => {
      if (computer.connectedUser.has(client.sessionId)) {
        computer.connectedUser.delete(client.sessionId)
      }
    })
    this.state.whiteboards.forEach((whiteboard) => {
      if (whiteboard.connectedUser.has(client.sessionId)) {
        whiteboard.connectedUser.delete(client.sessionId)
      }
    })
  }

  onDispose() {
    this.state.whiteboards.forEach((whiteboard) => {
      if (whiteboardRoomIds.has(whiteboard.roomId)) whiteboardRoomIds.delete(whiteboard.roomId)
    })

    console.log('room', this.roomId, 'disposing...')
    this.dispatcher.stop()
  }
}
