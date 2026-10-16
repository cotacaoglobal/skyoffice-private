import React, { useRef, useState, useEffect } from 'react'
import styled from 'styled-components'
import Box from '@mui/material/Box'
import Fab from '@mui/material/Fab'
import Badge from '@mui/material/Badge'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import CloseIcon from '@mui/icons-material/Close'
import LockIcon from '@mui/icons-material/Lock'
import PublicIcon from '@mui/icons-material/Public'
import 'emoji-mart/css/emoji-mart.css'
import { Picker } from 'emoji-mart'

import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

import { getColorByString } from '../util'
import { useAppDispatch, useAppSelector } from '../hooks'
import {
  MessageType,
  setFocused,
  setShowChat,
  setActiveTab,
  closePrivateTab,
  pushPrivateMessage,
} from '../stores/ChatStore'

const Backdrop = styled.div<{ $x: number; $y: number }>`
  position: fixed;
  top: ${({ $y }) => $y}px;
  left: ${({ $x }) => $x}px;
  height: 380px;
  width: 440px;
  max-height: calc(100vh - 40px);
  max-width: calc(100vw - 32px);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  overflow: hidden;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.65);

  @media (max-width: 650px) {
    top: 10px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    width: 95vw !important;
    max-width: 95vw !important;
    height: 60vh !important;
    max-height: 70vh !important;
    border-radius: 16px;
  }
`

const Wrapper = styled.div`
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
`

// Botão flutuante do chat no canto inferior esquerdo (tamanho e estilo padronizados)
const ChatToggleButton = styled(Fab)`
  && {
    position: fixed;
    bottom: 24px;
    left: 24px;
    width: 44px;
    height: 44px;
    min-height: 44px;
    background: #1e1f2b;
    color: #00ebc7;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 10000;
    pointer-events: auto;

    @media (max-width: 650px) {
      bottom: 12px;
      left: 10px;
      width: 38px;
      height: 38px;
      min-height: 38px;
    }

    &:hover {
      background: #282a3c;
    }
  }
`

const ChatHeader = styled.div`
  position: relative;
  height: 42px;
  background: #171821;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px 12px 0px 0px;
  user-select: none;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;

  &:active {
    cursor: grabbing;
  }

  .close {
    color: #94a3b8;
    &:hover {
      color: #fff;
    }
  }
`

const TabsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  max-width: calc(100% - 36px);
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`

const ChatTab = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 8px;
  background: ${({ $active }) => ($active ? 'rgba(0, 235, 199, 0.18)' : 'rgba(255, 255, 255, 0.04)')};
  color: ${({ $active }) => ($active ? '#00ebc7' : '#94a3b8')};
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.12s ease;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(0, 235, 199, 0.4)' : 'transparent')};

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
  }

  .close-tab {
    font-size: 14px;
    color: #64748b;
    margin-left: 2px;
    padding: 0 2px;
    border-radius: 4px;
    &:hover {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.15);
    }
  }

  .unread-badge {
    background: #ef4444;
    color: #ffffff;
    border-radius: 9999px;
    font-size: 10px;
    font-weight: bold;
    padding: 1px 5px;
  }
`

const ChatBox = styled(Box)`
  height: 100%;
  width: 100%;
  overflow: auto;
  background: #171821;
  border: 1px solid #00000029;
`

const MessageWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  padding: 2px 6px;

  p {
    margin: 3px;
    text-shadow: 0.3px 0.3px black;
    font-size: 14px;
    font-weight: bold;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  span {
    color: white;
    font-weight: normal;
  }

  .notification {
    color: grey;
    font-weight: normal;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.04);
  }
`

const PrivateMessageRow = styled.div<{ $isSelf: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${({ $isSelf }) => ($isSelf ? 'flex-end' : 'flex-start')};
  margin: 6px 12px;

  .bubble {
    background: ${({ $isSelf }) => ($isSelf ? '#00ebc7' : '#242736')};
    color: ${({ $isSelf }) => ($isSelf ? '#0f172a' : '#f8fafc')};
    font-size: 13px;
    font-weight: 500;
    padding: 8px 12px;
    border-radius: 12px;
    max-width: 80%;
    word-break: break-word;
    border: 1px solid ${({ $isSelf }) => ($isSelf ? 'transparent' : 'rgba(255, 255, 255, 0.08)')};
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  }

  .meta {
    display: flex;
    gap: 6px;
    align-items: center;
    font-size: 10px;
    color: #64748b;
    margin-top: 3px;
    padding: 0 2px;
  }
`

const InputWrapper = styled.form`
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0px 0px 10px 10px;
  display: flex;
  flex-direction: row;
  background: #14151e;
`

const InputTextField = styled(InputBase)`
  border-radius: 0px 0px 0px 10px;
  input {
    padding: 8px;
    color: #f8fafc;
    font-size: 13px;
  }
`

const EmojiPickerWrapper = styled.div`
  position: absolute;
  bottom: 50px;
  right: 10px;
  z-index: 10001;
`

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
})

function Message({ chatMessage, messageType }: any) {
  const [tooltipOpen, setTooltipOpen] = useState(false)

  return (
    <MessageWrapper
      onMouseEnter={() => setTooltipOpen(true)}
      onMouseLeave={() => setTooltipOpen(false)}
    >
      <Tooltip
        open={tooltipOpen}
        title={dateFormatter.format(chatMessage.createdAt)}
        placement="right"
        arrow
      >
        {messageType === MessageType.REGULAR_MESSAGE ? (
          <p style={{ color: getColorByString(chatMessage.author) }}>
            {chatMessage.author}: <span>{chatMessage.content}</span>
          </p>
        ) : (
          <p className="notification">
            {chatMessage.author} {chatMessage.content}
          </p>
        )}
      </Tooltip>
    </MessageWrapper>
  )
}

export default function Chat() {
  const [inputValue, setInputValue] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [readyToSubmit, setReadyToSubmit] = useState(false)

  // Controle de posição do chat arrastável
  const [pos, setPos] = useState({ x: 24, y: Math.max(100, window.innerHeight - 440) })
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0, initialX: 24, initialY: 100 })

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.close') || (e.target as HTMLElement).closest('.close-tab') || (e.target as HTMLElement).closest('.tab-item')) {
      return
    }
    isDraggingRef.current = true
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: pos.x,
      initialY: pos.y,
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return
      const dx = moveEvent.clientX - dragStartRef.current.x
      const dy = moveEvent.clientY - dragStartRef.current.y
      setPos({
        x: Math.max(8, Math.min(window.innerWidth - 450, dragStartRef.current.initialX + dx)),
        y: Math.max(8, Math.min(window.innerHeight - 400, dragStartRef.current.initialY + dy)),
      })
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatMessages = useAppSelector((state) => state.chat.chatMessages)
  const focused = useAppSelector((state) => state.chat.focused)
  const showChat = useAppSelector((state) => state.chat.showChat)
  const activeTab = useAppSelector((state) => state.chat.activeTab)
  const privateChats = useAppSelector((state) => state.chat.privateChats)
  const dispatch = useAppDispatch()
  const game = phaserGame.scene.keys.game as Game

  const activePrivateChat = activeTab !== 'global' ? privateChats[activeTab] : null

  // Contagem total de mensagens privadas não lidas
  const totalUnread = Object.values(privateChats).reduce(
    (acc, curr) => acc + (curr.unreadCount || 0),
    0
  )

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      inputRef.current?.blur()
      dispatch(setShowChat(false))
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!readyToSubmit) {
      setReadyToSubmit(true)
      return
    }
    inputRef.current?.blur()

    const val = inputValue.trim()
    setInputValue('')
    if (val) {
      if (activeTab === 'global') {
        // Envio público
        game.network.addChatMessage(val)
        game.myPlayer.updateDialogBubble(val)
      } else {
        // Envio privado exclusivo para o membro selecionado
        const targetId = activeTab
        const targetName = activePrivateChat?.playerName || 'Colega'
        game.network.addChatMessage(val, targetId, targetName)
        dispatch(
          pushPrivateMessage({
            partnerId: targetId,
            partnerName: targetName,
            author: 'Você',
            content: val,
            createdAt: Date.now(),
            isSelf: true,
          })
        )
      }
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (focused) {
      inputRef.current?.focus()
    }
  }, [focused])

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages, privateChats, activeTab, showChat])

  if (!showChat) {
    return (
      <Tooltip title="Abrir Chat" placement="right">
        <ChatToggleButton
          aria-label="showChat"
          onClick={() => {
            dispatch(setShowChat(true))
            dispatch(setFocused(true))
          }}
        >
          <Badge badgeContent={totalUnread} color="error">
            <ChatBubbleOutlineIcon />
          </Badge>
        </ChatToggleButton>
      </Tooltip>
    )
  }

  return (
    <Backdrop $x={pos.x} $y={pos.y}>
      <Wrapper>
        <ChatHeader onMouseDown={handleMouseDown}>
          <TabsContainer>
            {/* Aba Global */}
            <ChatTab
              $active={activeTab === 'global'}
              className="tab-item"
              onClick={() => dispatch(setActiveTab('global'))}
            >
              <PublicIcon style={{ fontSize: 14 }} />
              <span>Geral</span>
            </ChatTab>

            {/* Abas de Conversas Privadas */}
            {Object.values(privateChats).map((chat) => (
              <ChatTab
                key={chat.playerId}
                $active={activeTab === chat.playerId}
                className="tab-item"
                onClick={() => dispatch(setActiveTab(chat.playerId))}
              >
                <LockIcon style={{ fontSize: 13, color: '#f59e0b' }} />
                <span>{chat.playerName}</span>
                {chat.unreadCount > 0 && (
                  <span className="unread-badge">{chat.unreadCount}</span>
                )}
                <span
                  className="close-tab"
                  onClick={(e) => {
                    e.stopPropagation()
                    dispatch(closePrivateTab(chat.playerId))
                  }}
                  title="Fechar conversa"
                >
                  ×
                </span>
              </ChatTab>
            ))}
          </TabsContainer>

          <IconButton
            aria-label="close dialog"
            className="close"
            onClick={() => dispatch(setShowChat(false))}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </ChatHeader>

        <ChatBox>
          {activeTab === 'global' ? (
            /* Mensagens Públicas do Escritório */
            chatMessages.map(({ messageType, chatMessage }, index) => (
              <Message chatMessage={chatMessage} messageType={messageType} key={index} />
            ))
          ) : (
            /* Mensagens Privadas com o Membro Selecionado */
            activePrivateChat && activePrivateChat.messages.length > 0 ? (
              activePrivateChat.messages.map((pm, idx) => (
                <PrivateMessageRow key={idx} $isSelf={pm.isSelf}>
                  <div className="bubble">{pm.content}</div>
                  <div className="meta">
                    <span>{pm.author}</span>
                    <span>•</span>
                    <span>{dateFormatter.format(pm.createdAt)}</span>
                  </div>
                </PrivateMessageRow>
              ))
            ) : (
              <div
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '12px',
                }}
              >
                🔒 Conversa privada com <strong>{activePrivateChat?.playerName}</strong>.
                <br />
                As mensagens enviadas aqui são visíveis apenas entre vocês dois.
              </div>
            )
          )}
          <div ref={messagesEndRef} />

          {showEmojiPicker && (
            <EmojiPickerWrapper>
              <Picker
                theme="dark"
                showSkinTones={false}
                showPreview={false}
                onSelect={(emoji) => {
                  setInputValue(inputValue + emoji.native)
                  setShowEmojiPicker(!showEmojiPicker)
                  dispatch(setFocused(true))
                }}
                exclude={['recent', 'flags']}
              />
            </EmojiPickerWrapper>
          )}
        </ChatBox>

        <InputWrapper onSubmit={handleSubmit}>
          <InputTextField
            inputRef={inputRef}
            autoFocus={focused}
            fullWidth
            placeholder={
              activeTab === 'global'
                ? 'Pressione Enter para conversar com o escritório...'
                : `Mensagem privada para ${activePrivateChat?.playerName || 'Colega'}...`
            }
            value={inputValue}
            onKeyDown={handleKeyDown}
            onChange={handleChange}
            onFocus={() => {
              if (!focused) {
                dispatch(setFocused(true))
                setReadyToSubmit(true)
              }
            }}
            onBlur={() => {
              dispatch(setFocused(false))
              setReadyToSubmit(false)
            }}
          />
          <IconButton aria-label="emoji" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            <InsertEmoticonIcon />
          </IconButton>
        </InputWrapper>
      </Wrapper>
    </Backdrop>
  )
}
