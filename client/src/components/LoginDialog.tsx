import React, { useState } from 'react'
import styled from 'styled-components'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import ArrowRightIcon from '@mui/icons-material/ArrowRight'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper'
import 'swiper/css'
import 'swiper/css/navigation'

import Adam from '../images/login/Adam_login.png'
import Ash from '../images/login/Ash_login.png'
import Lucy from '../images/login/Lucy_login.png'
import Nancy from '../images/login/Nancy_login.png'
import Felipe from '../images/login/Felipe_login.png'
import { useAppSelector, useAppDispatch } from '../hooks'
import { setLoggedIn } from '../stores/UserStore'
import { getAvatarString, getColorByString } from '../util'

import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

const PixelCorner = styled.div<{ $position: 'tl' | 'tr' | 'bl' | 'br' }>`
  position: absolute;
  width: 14px;
  height: 14px;
  background: #00f5d4;
  border: 2px solid #020b17;
  box-shadow: 
    0 0 8px #00f5d4,
    inset -2px -2px 0 #0f766e,
    inset 2px 2px 0 #ffffff;
  z-index: 10;

  ${({ $position }) =>
    $position === 'tl' &&
    `
    top: -4px;
    left: -4px;
    border-radius: 3px 0 0 0;
  `}

  ${({ $position }) =>
    $position === 'tr' &&
    `
    top: -4px;
    right: -4px;
    border-radius: 0 3px 0 0;
  `}

  ${({ $position }) =>
    $position === 'bl' &&
    `
    bottom: -4px;
    left: -4px;
    border-radius: 0 0 0 3px;
  `}

  ${({ $position }) =>
    $position === 'br' &&
    `
    bottom: -4px;
    right: -4px;
    border-radius: 0 0 3px 0;
  `}
`

const Wrapper = styled.form`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #091326;
  border: 4px solid #083344;
  border-radius: 20px;
  padding: 36px 50px;
  box-shadow: 
    0 0 0 2px #020b17,
    0 20px 50px rgba(0, 0, 0, 0.85),
    0 0 30px rgba(0, 235, 199, 0.22),
    inset 0 0 0 2px #0d4a5e;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 24px 14px;
    width: calc(100vw - 20px) !important;
    max-width: calc(100vw - 20px) !important;
    box-sizing: border-box;
    max-height: 92vh;
    overflow-y: auto;
  }
`

const Title = styled.p`
  margin: 5px;
  font-family: 'Silkscreen', monospace, sans-serif;
  font-size: 16px;
  color: #00f5d4;
  text-shadow: 0 2px 0 #000;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 14px;
    margin: 2px 0 6px 0;
  }
`

const RoomName = styled.div`
  max-width: 500px;
  max-height: 120px;
  overflow-wrap: anywhere;
  overflow-y: auto;
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;

  h3 {
    font-family: 'Silkscreen', monospace, sans-serif;
    font-size: 20px;
    color: #ffffff;
    text-shadow: 0 2px 0 #000;
    margin: 0;
  }

  @media (max-width: 768px) {
    max-width: 100%;
    h3 {
      font-size: 17px;
    }
  }
`

const RoomDescription = styled.div`
  max-width: 500px;
  max-height: 150px;
  overflow-wrap: anywhere;
  overflow-y: auto;
  font-size: 14px;
  color: #94a3b8;
  display: flex;
  justify-content: center;
  text-align: center;

  @media (max-width: 768px) {
    max-width: 100%;
    font-size: 13px;
    margin-top: 4px;
  }
`

const SubTitle = styled.h3`
  width: 100%;
  font-family: 'Silkscreen', monospace, sans-serif;
  font-size: 13px;
  color: #94a3b8;
  text-align: center;
  margin: 0 0 8px 0;

  @media (max-width: 768px) {
    font-size: 12px;
    margin-bottom: 6px;
  }
`

const Content = styled.div`
  display: flex;
  margin: 36px 0;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    flex-direction: column !important;
    align-items: center;
    margin: 14px 0;
    gap: 14px;
    width: 100%;
    box-sizing: border-box;
  }
`

const Left = styled.div`
  margin-right: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: 768px) {
    margin-right: 0;
    width: 100%;
  }

  --swiper-navigation-size: 24px;

  .swiper {
    width: 160px;
    height: 220px;
    border-radius: 8px;
    overflow: hidden;

    @media (max-width: 768px) {
      width: 130px;
      height: 155px;
    }
  }

  .swiper-slide {
    width: 160px;
    height: 220px;
    background: #dbdbe0;
    display: flex;
    justify-content: center;
    align-items: center;

    @media (max-width: 768px) {
      width: 130px;
      height: 155px;
    }
  }

  .swiper-slide img {
    display: block;
    width: 95px;
    height: 136px;
    object-fit: contain;

    @media (max-width: 768px) {
      width: 70px;
      height: 100px;
    }
  }
`

const Right = styled.div`
  width: 300px;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
`

const Bottom = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
`

const PixelSubmitButton = styled.button`
  width: 100%;
  padding: 14px 20px;
  background: linear-gradient(180deg, #00f5d4 0%, #00c9ab 100%);
  border: 2px solid #002b24;
  border-top: 2px solid #a7f3d0;
  border-left: 2px solid #a7f3d0;
  border-bottom: 5px solid #036b5c;
  border-right: 5px solid #036b5c;
  border-radius: 14px;
  color: #01221b;
  font-family: 'Silkscreen', 'Press Start 2P', monospace, sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 6px 16px rgba(0, 245, 212, 0.35);
  transition: all 0.1s ease;
  outline: none;

  &:hover {
    background: linear-gradient(180deg, #38ef7d 0%, #00f5d4 100%);
    box-shadow: 0 8px 22px rgba(0, 245, 212, 0.55);
  }

  &:active {
    transform: translateY(3px);
    border-bottom: 2px solid #036b5c;
    border-right: 2px solid #036b5c;
  }
`

const Warning = styled.div`
  margin-top: 30px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;

  @media (max-width: 768px) {
    margin-top: 10px;
    font-size: 12px;

    .MuiAlert-message {
      font-size: 12px;
    }
  }
`

const avatars = [
  { name: 'felipe', img: Felipe },
  { name: 'adam', img: Adam },
  { name: 'ash', img: Ash },
  { name: 'lucy', img: Lucy },
  { name: 'nancy', img: Nancy },
]

// shuffle the avatars array
for (let i = avatars.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1))
  ;[avatars[i], avatars[j]] = [avatars[j], avatars[i]]
}

export default function LoginDialog() {
  // Lê valores salvos previamente ou inicia com padrões
  const savedName = localStorage.getItem('skyoffice_user_name') || ''
  const savedAvatar = localStorage.getItem('skyoffice_user_avatar') || ''

  let initialAvatarIndex = 0
  if (savedAvatar) {
    const foundIdx = avatars.findIndex((a) => a.name.toLowerCase() === savedAvatar.toLowerCase())
    if (foundIdx !== -1) initialAvatarIndex = foundIdx
  }

  const [name, setName] = useState<string>(savedName)
  const [avatarIndex, setAvatarIndex] = useState<number>(initialAvatarIndex)
  const [nameFieldEmpty, setNameFieldEmpty] = useState<boolean>(false)
  const dispatch = useAppDispatch()
  const videoConnected = useAppSelector((state) => state.user.videoConnected)
  const roomJoined = useAppSelector((state) => state.room.roomJoined)
  const rawRoomName = useAppSelector((state) => state.room.roomName)
  const roomName = rawRoomName === 'Public Lobby' || !rawRoomName ? 'Pink Aplly' : rawRoomName
  const game = phaserGame.scene.keys.game as Game

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (name === '') {
      setNameFieldEmpty(true)
    } else if (roomJoined) {
      const chosenAvatar = avatars[avatarIndex]?.name || 'adam'
      console.log('Join! Name:', name, 'Avatar:', chosenAvatar)

      // Persiste as preferências no navegador
      try {
        localStorage.setItem('skyoffice_user_name', name.trim())
        localStorage.setItem('skyoffice_user_avatar', chosenAvatar)
        localStorage.setItem('skyoffice_auto_login', 'true')
      } catch (err) {
        console.warn('Erro ao salvar preferências no localStorage', err)
      }

      game.registerKeys()
      game.myPlayer.setPlayerName(name)
      game.myPlayer.setPlayerTexture(chosenAvatar)
      game.network.readyToConnect()

      dispatch(setLoggedIn(true))
    }
  }

  return (
    <Wrapper onSubmit={handleSubmit}>
      <PixelCorner $position="tl" />
      <PixelCorner $position="tr" />
      <PixelCorner $position="bl" />
      <PixelCorner $position="br" />
      <Title>Entrando na Sala</Title>
      <RoomName>
        <Avatar style={{ background: getColorByString(roomName) }}>
          {getAvatarString(roomName)}
        </Avatar>
        <h3>{roomName}</h3>
      </RoomName>
      <Content>
        <Left>
          <SubTitle>Escolha seu avatar</SubTitle>
          <Swiper
            modules={[Navigation]}
            navigation
            initialSlide={initialAvatarIndex}
            spaceBetween={0}
            slidesPerView={1}
            onSlideChange={(swiper) => {
              setAvatarIndex(swiper.activeIndex)
            }}
          >
            {avatars.map((avatar) => (
              <SwiperSlide key={avatar.name}>
                <img src={avatar.img} alt={avatar.name} />
              </SwiperSlide>
            ))}
          </Swiper>
        </Left>
        <Right>
          <TextField
            autoFocus
            fullWidth
            label="Seu Nome ou Apelido"
            variant="outlined"
            color="secondary"
            value={name}
            error={nameFieldEmpty}
            helperText={nameFieldEmpty && 'Por favor, digite seu nome'}
            onChange={(e) => {
              setName(e.target.value)
            }}
          />
          {!videoConnected && (
            <Warning>
              <Alert variant="outlined" severity="warning">
                <AlertTitle>Atenção</AlertTitle>
                Câmera/microfone desconectados - <strong>conecte para a melhor experiência!</strong>
              </Alert>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  game.network.webRTC?.getUserMedia()
                }}
              >
                Ativar Câmera e Microfone
              </Button>
            </Warning>
          )}

          {videoConnected && (
            <Warning>
              <Alert variant="outlined">Câmera conectada com sucesso!</Alert>
            </Warning>
          )}
        </Right>
      </Content>
      <Bottom>
        <PixelSubmitButton type="submit">
          ➔ ENTRAR NO ESCRITÓRIO
        </PixelSubmitButton>
      </Bottom>
    </Wrapper>
  )
}
