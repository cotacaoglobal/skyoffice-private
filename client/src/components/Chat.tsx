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
  bottom: 24px;
  left: 355px;
  height: 380px;
  width: 420px;
  max-height: calc(100vh - 100px);
  max-width: calc(100vw - 380px);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);

  @media (max-width: 800px) {
    left: 16px;
    width: calc(100vw - 32px);
    max-width: calc(100vw - 32px);
  }
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
  left: 355px;
  z-index: 1000;

  @media (max-width: 800px) {
    left: 24px;
  }
`

const ChatHeader = styled.div`
  position: relative;
  height: 38px;
  background: #171821;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: none;
  border-radius: 12px 12px 0px 0px;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;

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
    <Backdrop>
      <Wrapper>
        <ChatHeader>
          <h3>💬 Chat do Escritório</h3>
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
