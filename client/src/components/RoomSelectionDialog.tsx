import React, { useState } from 'react'
import logo from '../images/logo.png'
import styled from 'styled-components'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import LinearProgress from '@mui/material/LinearProgress'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

import { CustomRoomTable } from './CustomRoomTable'
import { CreateRoomForm } from './CreateRoomForm'
import { useAppSelector } from '../hooks'

import phaserGame from '../PhaserGame'
import Bootstrap from '../scenes/Bootstrap'

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

const Backdrop = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  gap: 30px;
  align-items: center;

  @media (max-width: 768px) {
    gap: 16px;
    width: calc(100vw - 20px) !important;
    max-width: calc(100vw - 20px) !important;
    box-sizing: border-box;
  }
`

const Wrapper = styled.div`
  position: relative;
  background: #091326;
  border: 4px solid #083344;
  border-radius: 20px;
  padding: 40px 48px 36px 48px;
  box-shadow: 
    0 0 0 2px #020b17,
    0 20px 50px rgba(0, 0, 0, 0.85),
    0 0 30px rgba(0, 235, 199, 0.22),
    inset 0 0 0 2px #0d4a5e;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 28px 16px;
    width: calc(100vw - 20px) !important;
    max-width: calc(100vw - 20px) !important;
    box-sizing: border-box;
    max-height: 88vh;
    overflow-y: auto;
  }
`

const CustomRoomWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;

  .tip {
    font-size: 18px;
    color: #00f5d4;
  }
`

const TitleWrapper = styled.div`
  display: grid;
  width: 100%;

  .back-button {
    grid-column: 1;
    grid-row: 1;
    justify-self: start;
    align-self: center;
    color: #00f5d4;
  }

  h1 {
    grid-column: 1;
    grid-row: 1;
    justify-self: center;
    align-self: center;
  }
`

const Title = styled.h1`
  font-family: 'Silkscreen', 'Press Start 2P', monospace, sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 0 #000000, 0 0 10px rgba(0, 235, 199, 0.3);
  text-align: center;
  margin: 0;
  letter-spacing: 0.3px;

  @media (max-width: 768px) {
    font-size: 15px;
  }
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin: 22px 0 6px 0;
  align-items: center;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
`

const LogoWrapper = styled.div`
  background: #061e2f;
  border: 3px solid #00f5d4;
  border-radius: 16px;
  padding: 12px 24px;
  box-shadow: 
    0 0 16px rgba(0, 245, 212, 0.35),
    inset 0 0 0 2px #020b17;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    height: 105px;
    image-rendering: pixelated;

    @media (max-width: 768px) {
      height: 85px;
    }
  }
`

const PixelPrimaryButton = styled.button`
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
  font-size: 13px;
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

const PixelSecondaryButton = styled.button`
  width: 100%;
  padding: 12px 18px;
  background: #0a1c36;
  border: 2px solid #0284c7;
  border-bottom: 4px solid #034870;
  border-radius: 14px;
  color: #38bdf8;
  font-family: 'Silkscreen', 'Press Start 2P', monospace, sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.15s ease;
  outline: none;

  &:hover {
    background: #0d274d;
    border-color: #00f5d4;
    color: #00f5d4;
    box-shadow: 0 0 14px rgba(0, 245, 212, 0.35);
  }

  &:active {
    transform: translateY(2px);
    border-bottom: 2px solid #034870;
  }
`

const ProgressBarWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;

  h3 {
    font-family: 'Silkscreen', monospace, sans-serif;
    color: #00f5d4;
    font-size: 13px;
    text-shadow: 0 2px 0 #000;
  }
`

const ProgressBar = styled(LinearProgress)`
  width: 360px;
  border-radius: 4px;

  @media (max-width: 768px) {
    width: calc(100vw - 40px) !important;
    max-width: 360px;
  }
`

export default function RoomSelectionDialog() {
  const [showCustomRoom, setShowCustomRoom] = useState(false)
  const [showCreateRoomForm, setShowCreateRoomForm] = useState(false)
  const [showSnackbar, setShowSnackbar] = useState(false)
  const lobbyJoined = useAppSelector((state) => state.room.lobbyJoined)

  const handleConnect = () => {
    if (lobbyJoined) {
      const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap
      bootstrap.network
        .joinOrCreatePublic()
        .then(() => bootstrap.launchGame())
        .catch((error) => console.error(error))
    } else {
      setShowSnackbar(true)
    }
  }

  return (
    <>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={() => {
          setShowSnackbar(false)
        }}
      >
        <Alert
          severity="error"
          variant="outlined"
          // overwrites the dark theme on render
          style={{ background: '#fdeded', color: '#7d4747' }}
        >
          Tentando conectar ao servidor, por favor tente novamente!
        </Alert>
      </Snackbar>
      <Backdrop>
        <Wrapper>
          <PixelCorner $position="tl" />
          <PixelCorner $position="tr" />
          <PixelCorner $position="bl" />
          <PixelCorner $position="br" />
          {showCreateRoomForm ? (
            <CustomRoomWrapper>
              <TitleWrapper>
                <IconButton className="back-button" onClick={() => setShowCreateRoomForm(false)}>
                  <ArrowBackIcon />
                </IconButton>
                <Title>Criar Sala Privada</Title>
              </TitleWrapper>
              <CreateRoomForm />
            </CustomRoomWrapper>
          ) : showCustomRoom ? (
            <CustomRoomWrapper>
              <TitleWrapper>
                <IconButton className="back-button" onClick={() => setShowCustomRoom(false)}>
                  <ArrowBackIcon />
                </IconButton>
                <Title>
                  Salas Personalizadas
                  <Tooltip
                    title="Atualizado em tempo real, sem precisar recarregar!"
                    placement="top"
                  >
                    <IconButton>
                      <HelpOutlineIcon className="tip" />
                    </IconButton>
                  </Tooltip>
                </Title>
              </TitleWrapper>
              <CustomRoomTable />
              <PixelPrimaryButton
                type="button"
                onClick={() => setShowCreateRoomForm(true)}
              >
                + CRIAR NOVA SALA
              </PixelPrimaryButton>
            </CustomRoomWrapper>
          ) : (
            <>
              <Title>Bem-vindo ao Escritório Virtual</Title>
              <Content>
                <LogoWrapper>
                  <img src={logo} alt="logo" />
                </LogoWrapper>
                <PixelPrimaryButton type="button" onClick={handleConnect}>
                  ➔ ENTRAR NO ESCRITÓRIO PRINCIPAL
                </PixelPrimaryButton>
                <PixelSecondaryButton
                  type="button"
                  onClick={() => (lobbyJoined ? setShowCustomRoom(true) : setShowSnackbar(true))}
                >
                  CRIAR / BUSCAR SALAS PRIVADAS
                </PixelSecondaryButton>
              </Content>
            </>
          )}
        </Wrapper>
        {!lobbyJoined && (
          <ProgressBarWrapper>
            <h3> Conectando ao servidor...</h3>
            <ProgressBar color="secondary" />
          </ProgressBarWrapper>
        )}
      </Backdrop>
    </>
  )
}
