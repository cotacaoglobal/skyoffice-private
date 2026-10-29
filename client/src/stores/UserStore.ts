import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { sanitizeId } from '../util'
import { BackgroundMode } from '../../../types/BackgroundMode'

import phaserGame from '../PhaserGame'
import Bootstrap from '../scenes/Bootstrap'

export function getInitialBackgroundMode() {
  const currentHour = new Date().getHours()
  return currentHour > 6 && currentHour <= 18 ? BackgroundMode.DAY : BackgroundMode.NIGHT
}

export const userSlice = createSlice({
  name: 'user',
  initialState: {
    backgroundMode: getInitialBackgroundMode(),
    sessionId: '',
    videoConnected: false,
    loggedIn: false,
    playerNameMap: new Map<string, string>(),
    showJoystick: window.innerWidth < 650,
    sidebarOpen: window.innerWidth >= 650,
  },
  reducers: {
    toggleBackgroundMode: (state) => {
      let newMode: BackgroundMode
      if (state.backgroundMode === BackgroundMode.DAY) {
        newMode = BackgroundMode.NIGHT
      } else if (state.backgroundMode === BackgroundMode.NIGHT) {
        newMode = BackgroundMode.GREEN_HILLS
      } else {
        newMode = BackgroundMode.DAY
      }

      state.backgroundMode = newMode
      const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap
      bootstrap.changeBackgroundMode(newMode)
    },
    setSessionId: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload
    },
    setVideoConnected: (state, action: PayloadAction<boolean>) => {
      state.videoConnected = action.payload
    },
    setLoggedIn: (state, action: PayloadAction<boolean>) => {
      state.loggedIn = action.payload
    },
    setPlayerNameMap: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const next = new Map(state.playerNameMap)
      next.set(sanitizeId(action.payload.id), action.payload.name)
      state.playerNameMap = next
    },
    removePlayerNameMap: (state, action: PayloadAction<string>) => {
      const next = new Map(state.playerNameMap)
      next.delete(sanitizeId(action.payload))
      state.playerNameMap = next
    },
    setShowJoystick: (state, action: PayloadAction<boolean>) => {
      state.showJoystick = action.payload
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },
  },
})

export const {
  toggleBackgroundMode,
  setSessionId,
  setVideoConnected,
  setLoggedIn,
  setPlayerNameMap,
  removePlayerNameMap,
  setShowJoystick,
  setSidebarOpen,
} = userSlice.actions

export default userSlice.reducer
