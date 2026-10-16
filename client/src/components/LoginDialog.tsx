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
import { useAppSelector, useAppDispatch } from '../hooks'
import { setLoggedIn } from '../stores/UserStore'
import { getAvatarString, getColorByString } from '../util'

import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

const Wrapper = styled.form`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #222639;
  border-radius: 16px;
  padding: 36px 60px;
  box-shadow: 0px 0px 5px #0000006f;
`

const Title = styled.p`
  margin: 5px;
  font-size: 20px;
  color: #c2c2c2;
  text-align: center;
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
    font-size: 24px;
    color: #eee;
  }
`

const RoomDescription = styled.div`
  max-width: 500px;
  max-height: 150px;
  overflow-wrap: anywhere;
  overflow-y: auto;
  font-size: 16px;
  color: #c2c2c2;
  display: flex;
  justify-content: center;
`

const SubTitle = styled.h3`
  width: 160px;
  font-size: 16px;
  color: #eee;
  text-align: center;
`

const Content = styled.div`
  display: flex;
  margin: 36px 0;
`

const Left = styled.div`
  margin-right: 48px;

  --swiper-navigation-size: 24px;

  .swiper {
    width: 160px;
    height: 220px;
    border-radius: 8px;
    overflow: hidden;
  }

  .swiper-slide {
    width: 160px;
    height: 220px;
    background: #dbdbe0;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .swiper-slide img {
    display: block;
    width: 95px;
    height: 136px;
    object-fit: contain;
  }
`

const Right = styled.div`
  width: 300px;
`

const Bottom = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`

const Warning = styled.div`
  margin-top: 30px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 3px;
`

const avatars = [
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
  const roomName = useAppSelector((state) => state.room.roomName)
  const roomDescription = useAppSelector((state) => state.room.roomDescription)
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
      } catch (err) {
        console.warn('Erro ao salvar preferências no localStorage', err)
      }

      game.registerKeys()
      game.myPlayer.setPlayerName(name)
      game.myPlayer.setPlayerTexture(chosenAvatar)
      game.network.readyToConnect()

      // Tenta abrir câmera e microfone automaticamente ao entrar se ainda não estiver conectado
      if (!videoConnected && game.network.webRTC) {
        game.network.webRTC.getUserMedia(false)
      }

      dispatch(setLoggedIn(true))
    }
  }

  return (
    <Wrapper onSubmit={handleSubmit}>
      <Title>Entrando na Sala</Title>
      <RoomName>
        <Avatar style={{ background: getColorByString(roomName) }}>
          {getAvatarString(roomName)}
        </Avatar>
        <h3>{roomName}</h3>
      </RoomName>
      <RoomDescription>
        <ArrowRightIcon /> {roomDescription}
      </RoomDescription>
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
        <Button variant="contained" color="secondary" size="large" type="submit">
          Entrar no Escritório
        </Button>
      </Bottom>
    </Wrapper>
  )
}
