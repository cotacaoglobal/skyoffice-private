import React, { useState } from 'react'
import styled from 'styled-components'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

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

const Wrapper = styled.form`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 32px 44px;
  box-shadow: 
    0 20px 45px rgba(30, 58, 138, 0.15),
    0 4px 16px rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
  color: #0f172a;
  z-index: 1000;

  @media (max-width: 768px) {
    padding: 24px 16px;
    width: calc(100vw - 20px) !important;
    max-width: calc(100vw - 20px) !important;
    box-sizing: border-box;
    max-height: 92vh;
    overflow-y: auto;
  }
`

const TopLogoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;

  img {
    height: 75px;
    max-width: 280px;
    object-fit: contain;

    @media (max-width: 768px) {
      height: 60px;
    }
  }
`

const Title = styled.p`
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: #2563eb;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  @media (max-width: 768px) {
    font-size: 12px;
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
  margin-top: 4px;

  h3 {
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
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
  color: #64748b;
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
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  text-align: center;
  margin: 0 0 10px 0;

  @media (max-width: 768px) {
    font-size: 12px;
    margin-bottom: 6px;
  }
`

const Content = styled.div`
  display: flex;
  margin: 28px 0;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    flex-direction: column !important;
    align-items: center;
    margin: 16px 0;
    gap: 16px;
    width: 100%;
    box-sizing: border-box;
  }
`

const Left = styled.div`
  margin-right: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: 768px) {
    margin-right: 0;
    width: 100%;
  }

  --swiper-navigation-size: 24px;
  --swiper-theme-color: #2563eb;

  .swiper {
    width: 160px;
    height: 220px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e2e8f0;

    @media (max-width: 768px) {
      width: 130px;
      height: 155px;
    }
  }

  .swiper-slide {
    width: 160px;
    height: 220px;
    background: #f8fafc;
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

const SubmitButton = styled.button`
  width: 100%;
  padding: 14px 24px;
  background: #2563eb;
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
  transition: all 0.2s ease;
  outline: none;

  &:hover {
    background: #1d4ed8;
    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(1px);
  }
`

const Warning = styled.div`
  margin-top: 24px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
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
      <TopLogoWrapper>
        <img src="/assets/workoffice-logo.jpg" alt="WorkOffice" />
      </TopLogoWrapper>
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
            color="primary"
            value={name}
            error={nameFieldEmpty}
            helperText={nameFieldEmpty && 'Por favor, digite seu nome'}
            onChange={(e) => {
              setName(e.target.value)
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: '#f8fafc',
                '&:hover fieldset': {
                  borderColor: '#2563eb',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#2563eb',
                },
              },
            }}
          />
          {!videoConnected && (
            <Warning>
              <Alert 
                variant="outlined" 
                severity="warning"
                sx={{
                  borderRadius: '12px',
                  backgroundColor: '#fffbeb',
                  borderColor: '#fde68a',
                  color: '#92400e',
                  '& .MuiAlert-icon': {
                    color: '#d97706',
                  },
                }}
              >
                <AlertTitle sx={{ fontWeight: 700 }}>Atenção</AlertTitle>
                Câmera/microfone desconectados - <strong>conecte para a melhor experiência!</strong>
              </Alert>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  game.network.webRTC?.getUserMedia()
                }}
                sx={{
                  borderRadius: '10px',
                  borderColor: '#2563eb',
                  color: '#2563eb',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#1d4ed8',
                    backgroundColor: 'rgba(37, 99, 235, 0.05)',
                  },
                }}
              >
                Ativar Câmera e Microfone
              </Button>
            </Warning>
          )}

          {videoConnected && (
            <Warning>
              <Alert 
                variant="outlined"
                severity="success"
                sx={{
                  borderRadius: '12px',
                  backgroundColor: '#f0fdf4',
                  borderColor: '#bbf7d0',
                  color: '#166534',
                }}
              >
                Câmera conectada com sucesso!
              </Alert>
            </Warning>
          )}
        </Right>
      </Content>
      <Bottom>
        <SubmitButton type="submit">
          <span>ENTRAR NO ESCRITÓRIO</span>
          <ArrowForwardIcon sx={{ fontSize: 18 }} />
        </SubmitButton>
      </Bottom>
    </Wrapper>
  )
}
