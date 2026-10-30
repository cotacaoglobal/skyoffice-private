import React, { useState } from 'react'
import styled from 'styled-components'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import LinearProgress from '@mui/material/LinearProgress'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'

import { CustomRoomTable } from './CustomRoomTable'
import { CreateRoomForm } from './CreateRoomForm'
import { useAppSelector } from '../hooks'

import phaserGame from '../PhaserGame'
import Bootstrap from '../scenes/Bootstrap'

const Backdrop = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  gap: 24px;
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
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 36px 44px 32px 44px;
  box-shadow: 
    0 20px 45px rgba(30, 58, 138, 0.15),
    0 4px 16px rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
  width: 440px;
  max-width: calc(100vw - 24px);

  @media (max-width: 768px) {
    padding: 26px 18px;
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
  gap: 16px;
  align-items: center;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;

  .tip {
    font-size: 18px;
    color: #2563eb;
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
    color: #2563eb;
  }

  h1 {
    grid-column: 1;
    grid-row: 1;
    justify-self: center;
    align-self: center;
  }
`

const Title = styled.h1`
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  text-align: center;
  margin: 0;
  letter-spacing: -0.3px;

  @media (max-width: 768px) {
    font-size: 16px;
  }
`

const Subtitle = styled.p`
  margin: 4px 0 0 0;
  font-size: 13px;
  color: #64748b;
  text-align: center;
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 20px 0 6px 0;
  align-items: center;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
`

const LogoWrapper = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 14px 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;

  img {
    height: 60px;
    object-fit: contain;

    @media (max-width: 768px) {
      height: 48px;
    }
  }
`

const PixelPrimaryButton = styled.button`
  width: 100%;
  padding: 13px 20px;
  background: #2563eb;
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
  transition: all 0.15s ease;
  outline: none;

  &:hover {
    background: #1d4ed8;
    box-shadow: 0 6px 18px rgba(37, 99, 235, 0.45);
  }

  &:active {
    transform: translateY(1px);
  }
`

const PixelSecondaryButton = styled.button`
  width: 100%;
  padding: 12px 18px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.15s ease;
  outline: none;

  &:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
    color: #0f172a;
  }

  &:active {
    transform: translateY(1px);
  }
`

const ProgressBarWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;

  h3 {
    color: #2563eb;
    font-size: 13px;
    font-weight: 600;
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
          style={{ background: '#fdeded', color: '#7d4747' }}
        >
          Tentando conectar ao servidor, por favor tente novamente!
        </Alert>
      </Snackbar>
      <Backdrop>
        <Wrapper>
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
              <Subtitle>Ambiente corporativo de alta colaboração</Subtitle>
              <Content>
                <LogoWrapper>
                  <img src="/assets/workoffice-logo.jpg" alt="WorkOffice" />
                </LogoWrapper>
                <PixelPrimaryButton type="button" onClick={handleConnect}>
                  <ArrowForwardIcon style={{ fontSize: 18 }} />
                  ENTRAR NO ESCRITÓRIO PRINCIPAL
                </PixelPrimaryButton>
                <PixelSecondaryButton
                  type="button"
                  onClick={() => (lobbyJoined ? setShowCustomRoom(true) : setShowSnackbar(true))}
                >
                  <MeetingRoomIcon style={{ fontSize: 18 }} />
                  CRIAR / BUSCAR SALAS PRIVADAS
                </PixelSecondaryButton>
              </Content>
            </>
          )}
        </Wrapper>
        {!lobbyJoined && (
          <ProgressBarWrapper>
            <h3> Conectando ao servidor...</h3>
            <ProgressBar color="primary" />
          </ProgressBarWrapper>
        )}
      </Backdrop>
    </>
  )
}
