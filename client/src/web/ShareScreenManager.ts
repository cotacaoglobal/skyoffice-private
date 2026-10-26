import Peer from 'peerjs'
import store from '../stores'
import {
  setMyStream,
  addVideoStream,
  removeVideoStream,
  setScreenShareScope,
} from '../stores/ComputerStore'
import type { ScreenShareScope } from '../stores/ComputerStore'
import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'
import { phaserEvents, Event } from '../events/EventCenter'
import { sanitizeId } from '../util'

const RETRY_DELAY_MS = 4000
const JOIN_CALL_DELAY_MS = 1500

export default class ShareScreenManager {
  readonly userId: string
  myStream?: MediaStream
  scope: ScreenShareScope | null = null

  private myPeer: Peer
  private outgoing = new Map<string, Peer.MediaConnection>()
  private incoming = new Map<string, Peer.MediaConnection>()
  private retryTimers = new Map<string, ReturnType<typeof setTimeout>>()

  constructor(userId: string) {
    this.userId = userId
    const sanatizedId = this.makeId(userId)
    this.myPeer = new Peer(sanatizedId)

    this.myPeer.on('error', (err: any) => {
      console.warn('ShareScreenWebRTC', err?.type || '', err?.message || err)
    })

    this.myPeer.on('call', (call) => this.handleIncomingCall(call))

    phaserEvents.on(Event.PLAYER_JOINED, this.handlePlayerJoined, this)
    phaserEvents.on(Event.PLAYER_LEFT, this.handlePlayerLeft, this)
  }

  onOpen() {
    if (this.myPeer.destroyed) return
    if (this.myPeer.disconnected) {
      this.myPeer.reconnect()
    }
  }

  destroy() {
    if (this.myPeer.destroyed) return
    this.stopScreenShare(false)
    phaserEvents.off(Event.PLAYER_JOINED, this.handlePlayerJoined, this)
    phaserEvents.off(Event.PLAYER_LEFT, this.handlePlayerLeft, this)
    this.incoming.forEach((call) => {
      try {
        call.close()
      } catch (e) {}
    })
    this.incoming.clear()
    try {
      this.myPeer.destroy()
    } catch (e) {}
  }

  // PeerJS throws invalid_id error if it contains some characters such as that colyseus generates.
  // https://peerjs.com/docs.html#peer-id
  // Also for screen sharing ID add a `-ss` at the end.
  private makeId(id: string) {
    return `${id.replace(/[^0-9a-z]/gi, 'G')}-ss`
  }

  private dispatchScope(scope: ScreenShareScope | null) {
    store.dispatch(setScreenShareScope(scope))
  }

  startScreenShare(): Promise<void> {
    // Compartilhamento restrito aos membros do mesmo computador.
    return this.startCapture('computer')
  }

  startRoomShare(): Promise<void> {
    // Compartilhamento para todos os membros presentes na sala.
    return this.startCapture('room')
  }

  private async startCapture(scope: ScreenShareScope) {
    if (this.myStream) return

    const mediaDevices = navigator.mediaDevices
    if (!mediaDevices || typeof mediaDevices.getDisplayMedia !== 'function') {
      window.alert(
        'O compartilhamento de tela exige uma conexão segura (HTTPS) ou localhost, e um navegador compatível.'
      )
      return
    }

    try {
      let stream: MediaStream
      try {
        stream = await (mediaDevices as any).getDisplayMedia({
          video: true,
          audio: true,
        })
      } catch (audioErr: any) {
        // Alguns navegadores/plataformas não permitem capturar áudio da tela.
        // Nesses casos tentamos novamente apenas com o vídeo.
        if (audioErr?.name === 'NotAllowedError' || audioErr?.name === 'AbortError') {
          throw audioErr
        }
        stream = await (mediaDevices as any).getDisplayMedia({ video: true })
      }

      // Detect when user clicks "Stop sharing" outside of our UI.
      // https://stackoverflow.com/a/25179198
      const track = stream.getVideoTracks()[0]
      if (track) {
        track.onended = () => {
          this.stopScreenShare()
        }
      }

      this.myStream = stream
      this.scope = scope
      store.dispatch(setMyStream(stream))
      this.dispatchScope(scope)

      if (scope === 'computer') {
        const game = phaserGame.scene.keys.game as Game
        const computerId = store.getState().computer.computerId
        const computerItem = computerId ? game?.computerMap?.get(computerId) : undefined
        computerItem?.currentUsers.forEach((userId) => this.callPeer(userId, 'computer'))
      } else {
        this.callAllRoomMembers()
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      console.warn('Erro ao iniciar compartilhamento de tela:', err)
      const message =
        err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
          ? 'Permissão para compartilhar a tela foi negada.'
          : `Não foi possível compartilhar a tela: ${err?.message || 'erro desconhecido'}`
      window.alert(message)
    }
  }

  private callAllRoomMembers() {
    const game = phaserGame.scene.keys.game as Game
    const players = game?.network?.room?.state?.players
    if (!players) return

    players.forEach((_player, id) => {
      if (id !== this.userId) this.callPeer(id, 'room')
    })
  }

  private callPeer(userId: string, scope: ScreenShareScope, isRetry = false) {
    if (!this.myStream || userId === this.userId) return

    const sanatizedId = this.makeId(userId)
    if (this.outgoing.has(sanatizedId)) return

    const call = this.myPeer.call(sanatizedId, this.myStream, {
      metadata: { scope },
    })
    this.outgoing.set(sanatizedId, call)

    call.on('close', () => {
      if (this.outgoing.get(sanatizedId) === call) {
        this.outgoing.delete(sanatizedId)
      }
    })

    call.on('error', (err) => {
      console.warn('Erro ao enviar compartilhamento de tela para', userId, err)
      if (this.outgoing.get(sanatizedId) === call) {
        this.outgoing.delete(sanatizedId)
      }
    })

    if (!isRetry) {
      this.clearRetry(sanatizedId)
      const timer = setTimeout(() => {
        this.retryTimers.delete(sanatizedId)
        if (!this.myStream || this.outgoing.get(sanatizedId) !== call) return

        const pc = (call as any).peerConnection as RTCPeerConnection | undefined
        const state = pc?.connectionState || pc?.iceConnectionState
        if (state === 'connected' || state === 'completed') return

        this.outgoing.delete(sanatizedId)
        try {
          call.close()
        } catch (e) {}
        this.callPeer(userId, scope, true)
      }, RETRY_DELAY_MS)
      this.retryTimers.set(sanatizedId, timer)
    }
  }

  private clearRetry(sanatizedId: string) {
    const timer = this.retryTimers.get(sanatizedId)
    if (timer) {
      clearTimeout(timer)
      this.retryTimers.delete(sanatizedId)
    }
  }

  private handlePlayerJoined(_player: any, id: string) {
    if (!this.myStream || this.scope !== 'room' || id === this.userId) return

    setTimeout(() => {
      if (this.myStream && this.scope === 'room') {
        this.callPeer(id, 'room')
      }
    }, JOIN_CALL_DELAY_MS)
  }

  private handlePlayerLeft(id: string) {
    if (!id) return
    const sanatizedId = this.makeId(id)
    this.clearRetry(sanatizedId)

    const call = this.outgoing.get(sanatizedId)
    if (call) {
      this.outgoing.delete(sanatizedId)
      try {
        call.close()
      } catch (e) {}
    }
  }

  private handleIncomingCall(call: Peer.MediaConnection) {
    call.answer()

    const scope: ScreenShareScope = call.metadata?.scope === 'room' ? 'room' : 'computer'
    const existing = this.incoming.get(call.peer)
    if (existing && existing !== call) {
      try {
        existing.close()
      } catch (e) {}
    }
    this.incoming.set(call.peer, call)

    call.on('stream', (userVideoStream) => {
      store.dispatch(
        addVideoStream({
          id: call.peer,
          call,
          stream: userVideoStream,
          scope,
        })
      )
    })

    call.on('close', () => {
      if (this.incoming.get(call.peer) === call) {
        this.incoming.delete(call.peer)
      }
      store.dispatch(removeVideoStream(call.peer))
    })

    call.on('error', (err) => {
      console.warn('Erro na chamada de compartilhamento recebida:', err)
      if (this.incoming.get(call.peer) === call) {
        this.incoming.delete(call.peer)
      }
      store.dispatch(removeVideoStream(call.peer))
    })
  }

  onUserJoined(userId: string) {
    if (!this.myStream || userId === this.userId) return
    this.callPeer(userId, this.scope || 'computer')
  }

  onUserLeft(userId: string) {
    if (userId === this.userId) return
    const sanatizedId = this.makeId(userId)

    // Quando o compartilhamento é para a sala inteira, sair do computador
    // não deve interromper o recebimento dos membros.
    if (this.scope !== 'room') {
      this.clearRetry(sanatizedId)
      const call = this.outgoing.get(sanatizedId)
      if (call) {
        this.outgoing.delete(sanatizedId)
        try {
          call.close()
        } catch (e) {}
      }
    }

    // O usuário que saiu do computador pode continuar compartilhando com a
    // sala inteira. Nesse caso mantemos o stream recebido.
    const incoming = this.incoming.get(sanatizedId)
    const existing = store.getState().computer.peerStreams.get(sanitizeId(sanatizedId))
    const isRoomShare = incoming?.metadata?.scope === 'room' || existing?.scope === 'room'
    if (isRoomShare) return

    if (incoming) {
      this.incoming.delete(sanatizedId)
      try {
        incoming.close()
      } catch (e) {}
    }

    store.dispatch(removeVideoStream(sanatizedId))
  }

  // Chamado quando o servidor avisa que alguém parou de compartilhar com a sala.
  onRoomShareStopped(userId: string) {
    const sanatizedId = this.makeId(userId)
    this.clearRetry(sanatizedId)

    const call = this.incoming.get(sanatizedId)
    if (call) {
      this.incoming.delete(sanatizedId)
      try {
        call.close()
      } catch (e) {}
    }

    store.dispatch(removeVideoStream(sanatizedId))
  }

  stopScreenShare(shouldDispatch = true) {
    const scope = this.scope

    this.myStream?.getTracks().forEach((track) => track.stop())
    this.myStream = undefined
    this.scope = null

    this.retryTimers.forEach((timer) => clearTimeout(timer))
    this.retryTimers.clear()

    this.outgoing.forEach((call) => {
      try {
        call.close()
      } catch (e) {}
    })
    this.outgoing.clear()

    if (shouldDispatch) {
      store.dispatch(setMyStream(null))
      this.dispatchScope(null)

      // Manually let all other existing users know screen sharing is stopped
      if (scope === 'computer') {
        const game = phaserGame.scene.keys.game as Game
        const computerId = store.getState().computer.computerId
        if (computerId) {
          game?.network?.onStopScreenShare(computerId)
        }
      } else if (scope === 'room') {
        const game = phaserGame.scene.keys.game as Game
        game?.network?.onStopRoomScreenShare()
      }
    }
  }
}
