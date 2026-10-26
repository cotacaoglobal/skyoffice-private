import Peer from 'peerjs'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import ShareScreenManager from '../web/ShareScreenManager'
import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'
import { sanitizeId } from '../util'

export type ScreenShareScope = 'room' | 'computer'

interface PeerStream {
  stream: MediaStream
  call: Peer.MediaConnection
  scope: ScreenShareScope
}

interface ComputerState {
  computerDialogOpen: boolean
  computerId: null | string
  myStream: null | MediaStream
  myScreenShareScope: null | ScreenShareScope
  peerStreams: Map<string, PeerStream>
  shareScreenManager: null | ShareScreenManager
}

const initialState: ComputerState = {
  computerDialogOpen: false,
  computerId: null,
  myStream: null,
  myScreenShareScope: null,
  peerStreams: new Map(),
  shareScreenManager: null,
}

export const computerSlice = createSlice({
  name: 'computer',
  initialState,
  reducers: {
    initShareScreenManager: (state, action: PayloadAction<string>) => {
      const sessionId = action.payload
      if (state.shareScreenManager?.userId === sessionId) return

      state.shareScreenManager?.destroy()
      state.shareScreenManager = new ShareScreenManager(sessionId)
      state.myStream = null
      state.myScreenShareScope = null
      state.peerStreams.clear()
    },
    openComputerDialog: (
      state,
      action: PayloadAction<{ computerId: string; myUserId: string }>
    ) => {
      if (
        !state.shareScreenManager ||
        state.shareScreenManager.userId !== action.payload.myUserId
      ) {
        state.shareScreenManager?.destroy()
        state.shareScreenManager = new ShareScreenManager(action.payload.myUserId)
      }
      const game = phaserGame.scene.keys.game as Game
      game.disableKeys()
      state.shareScreenManager.onOpen()
      state.computerDialogOpen = true
      state.computerId = action.payload.computerId
    },
    closeComputerDialog: (state) => {
      // Tell server the computer dialog is closed.
      const game = phaserGame.scene.keys.game as Game
      game.enableKeys()
      if (state.computerId) {
        game.network.disconnectFromComputer(state.computerId)
      }

      // Fecha apenas as chamadas restritas ao computador. Compartilhamentos
      // para a sala inteira continuam ativos ao sair do computador.
      const callsToClose: Peer.MediaConnection[] = []
      for (const [id, { call, scope }] of Array.from(state.peerStreams.entries())) {
        if (scope !== 'room') {
          callsToClose.push(call)
          state.peerStreams.delete(id)
        }
      }
      // call.close() dispara o handler de 'close', que faz dispatch. Adiamos
      // para não despachar ações de dentro do reducer.
      if (callsToClose.length > 0) {
        setTimeout(() => {
          callsToClose.forEach((call) => {
            try {
              call.close()
            } catch (e) {}
          })
        }, 0)
      }

      if (state.myScreenShareScope === 'computer') {
        state.shareScreenManager?.stopScreenShare(false)
        state.myStream = null
        state.myScreenShareScope = null
      }

      state.computerDialogOpen = false
      state.computerId = null
    },
    setMyStream: (state, action: PayloadAction<null | MediaStream>) => {
      state.myStream = action.payload
    },
    setScreenShareScope: (state, action: PayloadAction<null | ScreenShareScope>) => {
      state.myScreenShareScope = action.payload
    },
    addVideoStream: (
      state,
      action: PayloadAction<{
        id: string
        call: Peer.MediaConnection
        stream: MediaStream
        scope?: ScreenShareScope
      }>
    ) => {
      state.peerStreams.set(sanitizeId(action.payload.id), {
        call: action.payload.call,
        stream: action.payload.stream,
        scope: action.payload.scope || 'computer',
      })
    },
    removeVideoStream: (state, action: PayloadAction<string>) => {
      state.peerStreams.delete(sanitizeId(action.payload))
    },
  },
})

export const {
  initShareScreenManager,
  closeComputerDialog,
  openComputerDialog,
  setMyStream,
  setScreenShareScope,
  addVideoStream,
  removeVideoStream,
} = computerSlice.actions

export default computerSlice.reducer
