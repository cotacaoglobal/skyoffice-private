import React, { useRef, useState, useEffect } from 'react'
import styled from 'styled-components'
import Box from '@mui/material/Box'
import Fab from '@mui/material/Fab'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import CloseIcon from '@mui/icons-material/Close'
import 'emoji-mart/css/emoji-mart.css'
import { Picker } from 'emoji-mart'

import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

import { getColorByString } from '../util'
import { useAppDispatch, useAppSelector } from '../hooks'
import { MessageType, setFocused, setShowChat } from '../stores/ChatStore'

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  height: 380px;
  width: 420px;
  max-height: 80vh;
  max-width: 90vw;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.65);
  will-change: transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  contain: layout paint;
`

const Wrapper = styled.div`
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
`

const FabWrapper = styled.div`
  position: fixed;
  bottom: 24px;
  left: 24px;
  z-index: 1000;
`

const ChatHeader = styled.div`
  position: relative;
  height: 38px;
  background: #171821;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: none;
  border-radius: 12px 12px 0px 0px;
  cursor: grab;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    cursor: grabbing;
  }

  h3 {
    color: #f8fafc;
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .close {
    position: absolute;
    top: 50%;
    right: 8px;
    transform: translateY(-50%);
    color: #94a3b8;
    &:hover {
      color: #fff;
    }
  }
`

const ChatBox = styled(Box)`
  height: 100%;
  width: 100%;
  overflow: auto;
  background: #2c2c2c;
  border: 1px solid #00000029;
`

const MessageWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  padding: 0px 2px;

  p {
    margin: 3px;
    text-shadow: 0.3px 0.3px black;
    font-size: 15px;
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

  :hover {
    background: #3a3a3a;
  }
`

const InputWrapper = styled.form`
  box-shadow: 10px 10px 10px #00000018;
  border: 1px solid #42eacb;
  border-radius: 0px 0px 10px 10px;
  display: flex;
  flex-direction: row;
  background: linear-gradient(180deg, #000000c1, #242424c0);
`

const InputTextField = styled(InputBase)`
  border-radius: 0px 0px 10px 10px;
  input {
    padding: 5px;
  }
`

const EmojiPickerWrapper = styled.div`
  position: absolute;
  bottom: 54px;
  right: 16px;
`

const dateFormatter = new Intl.DateTimeFormat('en', {
  timeStyle: 'short',
  dateStyle: 'short',
})

const Message = ({ chatMessage, messageType }) => {
  const [tooltipOpen, setTooltipOpen] = useState(false)

  return (
    <MessageWrapper
      onMouseEnter={() => {
        setTooltipOpen(true)
      }}
      onMouseLeave={() => {
        setTooltipOpen(false)
      }}
    >
      <Tooltip
        open={tooltipOpen}
        title={dateFormatter.format(chatMessage.createdAt)}
        placement="right"
        arrow
      >
        {messageType === MessageType.REGULAR_MESSAGE ? (
          <p
            style={{
              color: getColorByString(chatMessage.author),
            }}
          >
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

  // Posição padrão do chat (canto inferior esquerdo com margem de 20px da borda e 80px do fundo)
  const [pos, setPos] = useState({
    x: 20,
    y: Math.max(100, window.innerHeight - 460),
  })
  const isDragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const rAF = useRef<number | null>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    // Apenas botão esquerdo e ignorar cliques nos botões de fechar ou ícones
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('svg')) return

    isDragging.current = true
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current) return
      if (rAF.current !== null) {
        cancelAnimationFrame(rAF.current)
      }
      rAF.current = requestAnimationFrame(() => {
        setPos({
          x: Math.max(10, Math.min(window.innerWidth - 440, moveEvent.clientX - dragOffset.current.x)),
          y: Math.max(10, Math.min(window.innerHeight - 390, moveEvent.clientY - dragOffset.current.y)),
        })
      })
    }

    const handleMouseUp = () => {
      isDragging.current = false
      if (rAF.current !== null) {
        cancelAnimationFrame(rAF.current)
        rAF.current = null
      }
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
  const dispatch = useAppDispatch()
  const game = phaserGame.scene.keys.game as Game

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      // move focus back to the game
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
      game.network.addChatMessage(val)
      game.myPlayer.updateDialogBubble(val)
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
  }, [chatMessages, showChat])

  if (!showChat) {
    return (
      <FabWrapper>
        <Fab
          color="secondary"
          aria-label="showChat"
          onClick={() => {
            dispatch(setShowChat(true))
            dispatch(setFocused(true))
          }}
        >
          <ChatBubbleOutlineIcon />
        </Fab>
      </FabWrapper>
    )
  }

  return (
    <Backdrop style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}>
      <Wrapper>
        <ChatHeader onMouseDown={handleMouseDown}>
          <h3>💬 Chat do Escritório (arraste aqui)</h3>
          <IconButton
            aria-label="close dialog"
            className="close"
            onClick={() => dispatch(setShowChat(false))}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </ChatHeader>
        <ChatBox>
          {chatMessages.map(({ messageType, chatMessage }, index) => (
            <Message chatMessage={chatMessage} messageType={messageType} key={index} />
          ))}
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
            placeholder="Pressione Enter para conversar..."
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
