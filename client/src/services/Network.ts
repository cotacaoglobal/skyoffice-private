import { Client, Room } from 'colyseus.js'
import { IComputer, IOfficeState, IPlayer, IWhiteboard, IClaimedChair } from '../../../types/IOfficeState'
import { Message } from '../../../types/Messages'
import { IRoomData, RoomType } from '../../../types/Rooms'
import { ItemType } from '../../../types/Items'
import WebRTC from '../web/WebRTC'
import { phaserEvents, Event } from '../events/EventCenter'
import store from '../stores'
import { setSessionId, setPlayerNameMap, removePlayerNameMap } from '../stores/UserStore'
import {
  setLobbyJoined,
  setJoinedRoomData,
  setAvailableRooms,
  addAvailableRooms,
  removeAvailableRooms,
} from '../stores/RoomStore'
import {
  pushChatMessage,
  pushPlayerJoinedMessage,
  pushPlayerLeftMessage,
  pushPrivateMessage,
} from '../stores/ChatStore'
import { setWhiteboardUrls } from '../stores/WhiteboardStore'
import { initShareScreenManager } from '../stores/ComputerStore'
import { MeetingStorage } from './MeetingStorage'

export default class Network {
  private client: Client
  room?: Room<IOfficeState>
  private lobby!: Room
  webRTC?: WebRTC

  mySessionId!: string

  // Players that were already in the room when we joined but whose PLAYER_JOINED
  // event fired before the Game scene was ready to listen. Flushed by flushPendingPlayers().
  private pendingPlayers: Array<{ player: IPlayer; key: string }> = []
  private gameSceneReady = false
  // Tracks which player IDs have already had PLAYER_JOINED emitted to avoid duplicates
  private emittedJoinIds = new Set<string>()

  constructor() {
    const protocol = window.location.protocol.replace('http', 'ws')
    const port = window.location.port
    const endpoint =
      import.meta.env.VITE_SERVER_URL ||
      (port === '2567' || port === '5173' || port === '3000'
        ? `${protocol}//${window.location.hostname}:2567`
        : `${protocol}//${window.location.host}/colyseus`)
    this.client = new Client(endpoint)
    this.joinLobbyRoom().then(() => {
      store.dispatch(setLobbyJoined(true))
    })

    phaserEvents.on(Event.MY_PLAYER_NAME_CHANGE, this.updatePlayerName, this)
    phaserEvents.on(Event.MY_PLAYER_TEXTURE_CHANGE, this.updatePlayer, this)
    phaserEvents.on(Event.PLAYER_DISCONNECTED, this.playerStreamDisconnect, this)
  }

  /**
   * method to join Colyseus' built-in LobbyRoom, which automatically notifies
   * connected clients whenever rooms with "realtime listing" have updates
   */
  async joinLobbyRoom() {
    this.lobby = await this.client.joinOrCreate(RoomType.LOBBY)

    this.lobby.onMessage('rooms', (rooms) => {
      store.dispatch(setAvailableRooms(rooms))
    })

    this.lobby.onMessage('+', ([roomId, room]) => {
      store.dispatch(addAvailableRooms({ roomId, room }))
    })

    this.lobby.onMessage('-', (roomId) => {
      store.dispatch(removeAvailableRooms(roomId))
    })
  }

  // method to join the public lobby
  async joinOrCreatePublic() {
    this.room = await this.client.joinOrCreate(RoomType.PUBLIC)
    this.initialize()
  }

  // method to join a custom room
  async joinCustomById(roomId: string, password: string | null) {
    this.room = await this.client.joinById(roomId, { password })
    this.initialize()
  }

  // method to create a custom room
  async createCustom(roomData: IRoomData) {
    const { name, description, password, autoDispose } = roomData
    this.room = await this.client.create(RoomType.CUSTOM, {
      name,
      description,
      password,
      autoDispose,
    })
    this.initialize()
  }

  // set up all network listeners before the game starts
  initialize() {
    if (!this.room) return

    this.lobby.leave()
    this.mySessionId = this.room.sessionId
    store.dispatch(setSessionId(this.room.sessionId))
    store.dispatch(initShareScreenManager(this.room.sessionId))
    MeetingStorage.setRoomBridge({
      publish: (meeting) => {
        try {
          this.room?.send(Message.PUBLISH_MEETING, meeting)
        } catch (e) {}
      },
      remove: (id) => {
        try {
          this.room?.send(Message.DELETE_MEETING, { id })
        } catch (e) {}
      },
      updateOfficeSettings: (settings) => {
        try {
          this.room?.send(Message.UPDATE_OFFICE_SETTINGS, settings)
        } catch (e) {}
      },
    })
    // Sincroniza atas compartilhadas e configurações de IA imediatamente ao entrar na sala
    MeetingStorage.fetchSharedMeetings().catch(() => {})
    MeetingStorage.getApiKeyAsync().catch(() => {})
    this.webRTC = new WebRTC(this.mySessionId, this)

    const cleanLeave = () => {
      try {
        store.getState().computer.shareScreenManager?.destroy()
      } catch (e) {}
      try {
        this.room?.leave()
      } catch (e) {}
    }
    window.addEventListener('beforeunload', cleanLeave)
    window.addEventListener('pagehide', cleanLeave)

    this.room.onLeave((code) => {
      console.log('Saiu da sala Colyseus com código:', code)
    })
    this.room.onError((code, message) => {
      console.warn('Erro na sala Colyseus:', code, message)
    })

    // new instance added to the players MapSchema
    this.room.state.players.onAdd = (player: IPlayer, key: string) => {
      if (key === this.mySessionId) return

      // If the player already has a name they were in the room before we joined.
      // The Game scene may not be listening yet, so queue the event and flush later.
      if (player.name && player.name !== '') {
        store.dispatch(setPlayerNameMap({ id: key, name: player.name }))
        this.emittedJoinIds.add(key)
        if (this.gameSceneReady) {
          phaserEvents.emit(Event.PLAYER_JOINED, player, key)
        } else {
          this.pendingPlayers.push({ player, key })
        }
      }

      // track changes on every child object inside the players MapSchema
      player.onChange = (changes) => {
        changes.forEach((change) => {
          const { field, value } = change
          phaserEvents.emit(Event.PLAYER_UPDATED, field, value, key)

          // when a new player finished setting up their name for the first time
          if (field === 'name' && value !== '') {
            // Only emit PLAYER_JOINED if we haven't already done so via onAdd
            if (!this.emittedJoinIds.has(key)) {
              this.emittedJoinIds.add(key)
              if (this.gameSceneReady) {
                phaserEvents.emit(Event.PLAYER_JOINED, player, key)
              } else {
                this.pendingPlayers.push({ player, key })
              }
            }
            store.dispatch(setPlayerNameMap({ id: key, name: value }))
            store.dispatch(pushPlayerJoinedMessage(value))
          }
        })
      }
    }

    // an instance removed from the players MapSchema
    this.room.state.players.onRemove = (player: IPlayer, key: string) => {
      this.emittedJoinIds.delete(key)
      this.pendingPlayers = this.pendingPlayers.filter((p) => p.key !== key)
      phaserEvents.emit(Event.PLAYER_LEFT, key)
      this.webRTC?.deleteVideoStream(key)
      this.webRTC?.deleteOnCalledVideoStream(key)
      store.getState().computer.shareScreenManager?.onRoomShareStopped(key)
      store.dispatch(pushPlayerLeftMessage(player?.name || 'Colega'))
      store.dispatch(removePlayerNameMap(key))
    }

    // new instance added to the computers MapSchema
    this.room.state.computers.onAdd = (computer: IComputer, key: string) => {
      // track changes on every child object's connectedUser
      computer.connectedUser.onAdd = (item, index) => {
        phaserEvents.emit(Event.ITEM_USER_ADDED, item, key, ItemType.COMPUTER)
      }
      computer.connectedUser.onRemove = (item, index) => {
        phaserEvents.emit(Event.ITEM_USER_REMOVED, item, key, ItemType.COMPUTER)
      }
    }

    // new instance added to the whiteboards MapSchema
    this.room.state.whiteboards.onAdd = (whiteboard: IWhiteboard, key: string) => {
      store.dispatch(
        setWhiteboardUrls({
          whiteboardId: key,
          roomId: whiteboard.roomId,
        })
      )
      // track changes on every child object's connectedUser
      whiteboard.connectedUser.onAdd = (item, index) => {
        phaserEvents.emit(Event.ITEM_USER_ADDED, item, key, ItemType.WHITEBOARD)
      }
      whiteboard.connectedUser.onRemove = (item, index) => {
        phaserEvents.emit(Event.ITEM_USER_REMOVED, item, key, ItemType.WHITEBOARD)
      }
    }

    // new instance added to the chatMessages ArraySchema
    this.room.state.chatMessages.onAdd = (item, index) => {
      // Ignora mensagens privadas no chat público do escritório
      if (item.content?.startsWith('[DM::')) return
      store.dispatch(pushChatMessage(item))
    }

    // when the server sends room data
    this.room.onMessage(Message.SEND_ROOM_DATA, (content) => {
      store.dispatch(setJoinedRoomData(content))
    })

    // when a user sends a message
    this.room.onMessage(
      Message.ADD_CHAT_MESSAGE,
      ({ clientId, content, targetClientId }: { clientId: string; content: string; targetClientId?: string }) => {
        // Verifica se é mensagem privada (DM)
        const dmMatch = content?.match(/^\[DM::([^:]+)::([^\]]*)\]\s*(.*)$/)
        if (dmMatch || targetClientId) {
          const targetId = targetClientId || dmMatch?.[1]
          const actualContent = dmMatch ? dmMatch[3] : content
          const mySessionId = this.room?.sessionId

          if (mySessionId === targetId || mySessionId === clientId) {
            const gameInstance = (window as any).game?.scene?.keys?.game
            const senderPlayer = gameInstance?.otherPlayerMap?.get(clientId)
            const senderName =
              senderPlayer?.playerName?.text ||
              store.getState().user.playerNameMap.get(clientId) ||
              (dmMatch ? dmMatch[2] : 'Colega')

            store.dispatch(
              pushPrivateMessage({
                partnerId: clientId,
                partnerName: senderName,
                author: senderName,
                content: actualContent,
                createdAt: Date.now(),
                isSelf: false,
              })
            )
          }
          return
        }

        phaserEvents.emit(Event.UPDATE_DIALOG_BUBBLE, clientId, content)
      }
    )

    // when a peer disconnects with myPeer
    this.room.onMessage(Message.DISCONNECT_STREAM, (clientId: string) => {
      this.webRTC?.deleteOnCalledVideoStream(clientId)
      this.webRTC?.deleteVideoStream(clientId)
      phaserEvents.emit('PLAYER_STREAM_DISCONNECTED', clientId)
    })

    // when a computer user stops sharing screen
    this.room.onMessage(Message.STOP_SCREEN_SHARE, (clientId: string) => {
      const computerState = store.getState().computer
      computerState.shareScreenManager?.onUserLeft(clientId)
    })

    // when a room member stops sharing their screen with everyone
    this.room.onMessage(Message.STOP_ROOM_SCREEN_SHARE, (clientId: string) => {
      store.getState().computer.shareScreenManager?.onRoomShareStopped(clientId)
    })

    // novas atas/atualizações geradas por qualquer membro da sala
    this.room.onMessage(Message.MEETING_PUBLISHED, (meeting) => {
      MeetingStorage.applyRemoteMeeting(meeting)
    })

    // atas removidas por outro membro da sala
    this.room.onMessage(Message.MEETING_DELETED, (payload) => {
      const id = typeof payload === 'string' ? payload : payload?.id
      if (id) MeetingStorage.applyRemoteDeletion(id)
    })

    // configurações da IA (chave do Gemini) atualizadas por outro membro
    this.room.onMessage(Message.OFFICE_SETTINGS_UPDATED, (settings: { geminiApiKey?: string }) => {
      if (settings?.geminiApiKey) {
        MeetingStorage.applyRemoteApiKey(settings.geminiApiKey)
      }
    })

    // Sincronização de mesas de trabalho reivindicadas
    this.room.onMessage(Message.CLAIM_CHAIR, (data: IClaimedChair) => {
      phaserEvents.emit('CHAIR_CLAIMED', data)
    })

    this.room.onMessage(Message.UNCLAIM_CHAIR, (data: { chairId: string }) => {
      phaserEvents.emit('CHAIR_UNCLAIMED', data)
    })

    this.room.onMessage(Message.SYNC_CHAIRS, (data: IClaimedChair[]) => {
      phaserEvents.emit('CHAIRS_SYNCED', data)
    })
  }

  /**
   * Called by the Game scene once its listeners are registered.
   * Replays any PLAYER_JOINED events that fired before the scene was ready.
   */
  flushPendingPlayers() {
    this.gameSceneReady = true
    this.pendingPlayers.forEach(({ player, key }) => {
      phaserEvents.emit(Event.PLAYER_JOINED, player, key)
    })
    this.pendingPlayers = []
  }

  // method to register event listener and call back function when a item user added
  onChatMessageAdded(callback: (playerId: string, content: string) => void, context?: any) {
    phaserEvents.on(Event.UPDATE_DIALOG_BUBBLE, callback, context)
  }

  // method to register event listener and call back function when a item user added
  onItemUserAdded(
    callback: (playerId: string, key: string, itemType: ItemType) => void,
    context?: any
  ) {
    phaserEvents.on(Event.ITEM_USER_ADDED, callback, context)
  }

  // method to register event listener and call back function when a item user removed
  onItemUserRemoved(
    callback: (playerId: string, key: string, itemType: ItemType) => void,
    context?: any
  ) {
    phaserEvents.on(Event.ITEM_USER_REMOVED, callback, context)
  }

  // method to register event listener and call back function when a player joined
  onPlayerJoined(callback: (Player: IPlayer, key: string) => void, context?: any) {
    phaserEvents.on(Event.PLAYER_JOINED, callback, context)
  }

  // method to register event listener and call back function when a player left
  onPlayerLeft(callback: (key: string) => void, context?: any) {
    phaserEvents.on(Event.PLAYER_LEFT, callback, context)
  }

  // method to register event listener and call back function when myPlayer is ready to connect
  onMyPlayerReady(callback: (key: string) => void, context?: any) {
    phaserEvents.on(Event.MY_PLAYER_READY, callback, context)
  }

  // method to register event listener and call back function when my video is connected
  onMyPlayerVideoConnected(callback: (key: string) => void, context?: any) {
    phaserEvents.on(Event.MY_PLAYER_VIDEO_CONNECTED, callback, context)
  }

  // method to register event listener and call back function when a player updated
  onPlayerUpdated(
    callback: (field: string, value: number | string, key: string) => void,
    context?: any
  ) {
    phaserEvents.on(Event.PLAYER_UPDATED, callback, context)
  }

  // method to send player updates to Colyseus server
  updatePlayer(currentX: number, currentY: number, currentAnim: string) {
    this.room?.send(Message.UPDATE_PLAYER, { x: currentX, y: currentY, anim: currentAnim })
  }

  // method to send player name to Colyseus server
  updatePlayerName(currentName: string) {
    this.room?.send(Message.UPDATE_PLAYER_NAME, { name: currentName })
  }

  // method to send ready-to-connect signal to Colyseus server
  readyToConnect() {
    this.room?.send(Message.READY_TO_CONNECT)
    phaserEvents.emit(Event.MY_PLAYER_READY)
  }

  // method to send ready-to-connect signal to Colyseus server
  videoConnected() {
    this.room?.send(Message.VIDEO_CONNECTED)
    phaserEvents.emit(Event.MY_PLAYER_VIDEO_CONNECTED)
  }

  // method to send stream-disconnection signal to Colyseus server
  playerStreamDisconnect(id: string) {
    this.room?.send(Message.DISCONNECT_STREAM, { clientId: id })
    this.webRTC?.deleteVideoStream(id)
    this.webRTC?.deleteOnCalledVideoStream(id)
  }

  connectToComputer(id: string) {
    this.room?.send(Message.CONNECT_TO_COMPUTER, { computerId: id })
  }

  disconnectFromComputer(id: string) {
    this.room?.send(Message.DISCONNECT_FROM_COMPUTER, { computerId: id })
  }

  connectToWhiteboard(id: string) {
    this.room?.send(Message.CONNECT_TO_WHITEBOARD, { whiteboardId: id })
  }

  disconnectFromWhiteboard(id: string) {
    this.room?.send(Message.DISCONNECT_FROM_WHITEBOARD, { whiteboardId: id })
  }

  onStopScreenShare(id: string) {
    this.room?.send(Message.STOP_SCREEN_SHARE, { computerId: id })
  }

  onStopRoomScreenShare() {
    this.room?.send(Message.STOP_ROOM_SCREEN_SHARE)
  }

  addChatMessage(content: string, targetClientId?: string, targetName?: string) {
    if (targetClientId) {
      this.room?.send(Message.ADD_CHAT_MESSAGE, {
        content: `[DM::${targetClientId}::${targetName || ''}] ${content}`,
        targetClientId: targetClientId,
      })
    } else {
      this.room?.send(Message.ADD_CHAT_MESSAGE, { content: content })
    }
  }

  claimChair(chairId: string, name: string, avatar: string) {
    this.room?.send(Message.CLAIM_CHAIR, { chairId, name, avatar })
  }

  unclaimChair(chairId: string) {
    this.room?.send(Message.UNCLAIM_CHAIR, { chairId })
  }
}
