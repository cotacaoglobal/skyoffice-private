import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { IChatMessage } from '../../../types/IOfficeState'

export enum MessageType {
  PLAYER_JOINED,
  PLAYER_LEFT,
  REGULAR_MESSAGE,
}

export interface IPrivateChatMessage {
  author: string
  content: string
  createdAt: number
  isSelf: boolean
}

export interface IPrivateChat {
  playerId: string
  playerName: string
  unreadCount: number
  messages: IPrivateChatMessage[]
}

interface ChatState {
  chatMessages: Array<{ messageType: MessageType; chatMessage: IChatMessage }>
  privateChats: Record<string, IPrivateChat>
  activeTab: string // 'global' | playerId
  focused: boolean
  showChat: boolean
}

const initialState: ChatState = {
  chatMessages: new Array<{ messageType: MessageType; chatMessage: IChatMessage }>(),
  privateChats: {},
  activeTab: 'global',
  focused: false,
  showChat: typeof window !== 'undefined' ? window.innerWidth >= 650 : true,
}

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    pushChatMessage: (state, action: PayloadAction<IChatMessage>) => {
      state.chatMessages.push({
        messageType: MessageType.REGULAR_MESSAGE,
        chatMessage: action.payload,
      })
    },
    pushPlayerJoinedMessage: (state, action: PayloadAction<string>) => {
      state.chatMessages.push({
        messageType: MessageType.PLAYER_JOINED,
        chatMessage: {
          createdAt: new Date().getTime(),
          author: action.payload,
          content: 'joined the lobby',
        } as IChatMessage,
      })
    },
    pushPlayerLeftMessage: (state, action: PayloadAction<string>) => {
      state.chatMessages.push({
        messageType: MessageType.PLAYER_LEFT,
        chatMessage: {
          createdAt: new Date().getTime(),
          author: action.payload,
          content: 'left the lobby',
        } as IChatMessage,
      })
    },
    setFocused: (state, action: PayloadAction<boolean>) => {
      const game = (window as any).game?.scene?.keys?.game
      if (game) {
        action.payload ? game.disableKeys() : game.enableKeys()
      }
      state.focused = action.payload
    },
    setShowChat: (state, action: PayloadAction<boolean>) => {
      state.showChat = action.payload
    },
    openPrivateChat: (state, action: PayloadAction<{ playerId: string; playerName: string }>) => {
      const { playerId, playerName } = action.payload
      if (!state.privateChats[playerId]) {
        state.privateChats[playerId] = {
          playerId,
          playerName: playerName || 'Colega',
          unreadCount: 0,
          messages: [],
        }
      } else {
        if (playerName) state.privateChats[playerId].playerName = playerName
      }
      state.privateChats[playerId].unreadCount = 0
      state.activeTab = playerId
      state.showChat = true
      state.focused = true
    },
    closePrivateTab: (state, action: PayloadAction<string>) => {
      const playerId = action.payload
      delete state.privateChats[playerId]
      if (state.activeTab === playerId) {
        state.activeTab = 'global'
      }
    },
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload
      if (state.privateChats[action.payload]) {
        state.privateChats[action.payload].unreadCount = 0
      }
    },
    pushPrivateMessage: (
      state,
      action: PayloadAction<{
        partnerId: string
        partnerName: string
        author: string
        content: string
        createdAt: number
        isSelf: boolean
      }>
    ) => {
      const { partnerId, partnerName, author, content, createdAt, isSelf } = action.payload
      if (!state.privateChats[partnerId]) {
        state.privateChats[partnerId] = {
          playerId: partnerId,
          playerName: partnerName || 'Colega',
          unreadCount: 0,
          messages: [],
        }
      }
      state.privateChats[partnerId].messages.push({
        author,
        content,
        createdAt,
        isSelf,
      })
      if (state.activeTab !== partnerId) {
        state.privateChats[partnerId].unreadCount += 1
      }
    },
  },
})

export const {
  pushChatMessage,
  pushPlayerJoinedMessage,
  pushPlayerLeftMessage,
  setFocused,
  setShowChat,
  openPrivateChat,
  closePrivateTab,
  setActiveTab,
  pushPrivateMessage,
} = chatSlice.actions

export default chatSlice.reducer
