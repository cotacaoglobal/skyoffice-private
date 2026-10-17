import React, { useState } from 'react'
import styled from 'styled-components'
import Fab from '@mui/material/Fab'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import ShareIcon from '@mui/icons-material/Share'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import CloseIcon from '@mui/icons-material/Close'
import LightbulbIcon from '@mui/icons-material/Lightbulb'
import ArrowRightIcon from '@mui/icons-material/ArrowRight'
import GitHubIcon from '@mui/icons-material/GitHub'
import TwitterIcon from '@mui/icons-material/Twitter'
import VideogameAssetIcon from '@mui/icons-material/VideogameAsset'
import VideogameAssetOffIcon from '@mui/icons-material/VideogameAssetOff'
import TuneIcon from '@mui/icons-material/Tune'

import { BackgroundMode } from '../../../types/BackgroundMode'
import { setShowJoystick, toggleBackgroundMode } from '../stores/UserStore'
import { useAppSelector, useAppDispatch } from '../hooks'
import { getAvatarString, getColorByString } from '../util'

const Backdrop = styled.div`
  position: fixed;
  display: flex;
  gap: 10px;
  bottom: 16px;
  right: 16px;
  align-items: flex-end;
  z-index: 1000;

  @media (max-width: 650px) {
    top: 12px;
    right: 12px;
    bottom: auto;
    gap: 6px;

    .MuiFab-root {
      width: 38px !important;
      height: 38px !important;
      min-height: 38px !important;
    }
  }

  .wrapper-group {
    display: flex;
    flex-direction: column;
    gap: 10px;

    @media (max-width: 650px) {
      gap: 6px;
    }
  }
`

const Wrapper = styled.div`
  position: relative;
  font-size: 16px;
  color: #eee;
  background: #222639;
  box-shadow: 0px 0px 5px #0000006f;
  border-radius: 16px;
  padding: 15px 35px 15px 15px;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: 650px) {
    max-width: 90vw;
    font-size: 13px;
    padding: 12px 24px 12px 12px;
  }

  .close {
    position: absolute;
    top: 15px;
    right: 15px;
  }

  .tip {
    margin-left: 12px;
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;

  @media (max-width: 650px) {
    gap: 6px;
  }
`

const CollapsibleButtons = styled.div<{ $collapsed: boolean }>`
  display: flex;
  gap: 10px;
  align-items: center;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  @media (max-width: 650px) {
    gap: 6px;
  }

  ${({ $collapsed }) =>
    $collapsed
      ? `
    opacity: 0;
    pointer-events: none;
    max-width: 0;
    overflow: hidden;
    transform: scale(0.85);
  `
      : `
    opacity: 1;
    pointer-events: auto;
    max-width: 320px;
    transform: scale(1);
  `}
`

const StyledFab = styled(Fab)<{ target?: string }>`
  &:hover {
    color: #1ea2df;
  }
`

const ToggleCollapseFab = styled(StyledFab)<{ $collapsed: boolean }>`
  && {
    background: ${({ $collapsed }) => ($collapsed ? '#1e1f2b' : '#27293d')};
    color: ${({ $collapsed }) => ($collapsed ? '#00ebc7' : '#f8fafc')};
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);

    &:hover {
      background: #33364d;
    }
  }
`

const Title = styled.h3`
  font-size: 24px;
  color: #eee;
  text-align: center;
`

const RoomName = styled.div`
  margin: 10px 20px;
  max-width: 460px;
  max-height: 150px;
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
  margin: 0 20px;
  max-width: 460px;
  max-height: 150px;
  overflow-wrap: anywhere;
  overflow-y: auto;
  font-size: 16px;
  color: #c2c2c2;
  display: flex;
  justify-content: center;
`

export default function HelperButtonGroup() {
  const [collapsed, setCollapsed] = useState(window.innerWidth <= 650)
  const [showControlGuide, setShowControlGuide] = useState(false)
  const [showRoomInfo, setShowRoomInfo] = useState(false)
  const showJoystick = useAppSelector((state) => state.user.showJoystick)
  const backgroundMode = useAppSelector((state) => state.user.backgroundMode)
  const roomJoined = useAppSelector((state) => state.room.roomJoined)
  const roomId = useAppSelector((state) => state.room.roomId)
  const roomName = useAppSelector((state) => state.room.roomName)
  const roomDescription = useAppSelector((state) => state.room.roomDescription)
  const dispatch = useAppDispatch()

  return (
    <Backdrop>
      <div className="wrapper-group">
        {showRoomInfo && (
          <Wrapper>
            <IconButton className="close" onClick={() => setShowRoomInfo(false)} size="small">
              <CloseIcon />
            </IconButton>
            <RoomName>
              <Avatar style={{ background: getColorByString(roomName) }}>
                {getAvatarString(roomName)}
              </Avatar>
              <h3>{roomName}</h3>
            </RoomName>
            <RoomDescription>
              <ArrowRightIcon /> ID: {roomId}
            </RoomDescription>
            <RoomDescription>
              <ArrowRightIcon /> Description: {roomDescription}
            </RoomDescription>
            <p className="tip">
              <LightbulbIcon />
              Shareable link coming up 😄
            </p>
          </Wrapper>
        )}
        {showControlGuide && (
          <Wrapper>
            <Title>Controles do Teclado</Title>
            <IconButton className="close" onClick={() => setShowControlGuide(false)} size="small">
              <CloseIcon />
            </IconButton>
            <ul>
              <li>
                <strong>W, A, S, D ou Setas</strong> para andar
              </li>
              <li>
                <strong>E</strong> para sentar na cadeira (olhando para ela)
              </li>
              <li>
                <strong>R</strong> no computador para compartilhar tela
              </li>
              <li>
                <strong>Enter</strong> para abrir o bate-papo
              </li>
              <li>
                <strong>ESC</strong> para fechar o bate-papo
              </li>
            </ul>
            <p className="tip">
              <LightbulbIcon />
              Sua câmera e microfone conectam ao se aproximar de colegas!
            </p>
          </Wrapper>
        )}
      </div>
      <ButtonGroup>
        <CollapsibleButtons $collapsed={collapsed}>
          {roomJoined && (
            <Tooltip title={showJoystick ? 'Ocultar joystick virtual' : 'Ativar joystick virtual'}>
              <StyledFab size="small" onClick={() => dispatch(setShowJoystick(!showJoystick))}>
                {showJoystick ? <VideogameAssetOffIcon /> : <VideogameAssetIcon />}
              </StyledFab>
            </Tooltip>
          )}
          {roomJoined && (
            <>
              <Tooltip title="Informações da Sala">
                <StyledFab
                  size="small"
                  onClick={() => {
                    setShowRoomInfo(!showRoomInfo)
                    setShowControlGuide(false)
                  }}
                >
                  <ShareIcon />
                </StyledFab>
              </Tooltip>
              <Tooltip title="Guia de Controles">
                <StyledFab
                  size="small"
                  onClick={() => {
                    setShowControlGuide(!showControlGuide)
                    setShowRoomInfo(false)
                  }}
                >
                  <HelpOutlineIcon />
                </StyledFab>
              </Tooltip>
            </>
          )}
          <Tooltip title="Alternar Modo Claro/Escuro">
            <StyledFab size="small" onClick={() => dispatch(toggleBackgroundMode())}>
              {backgroundMode === BackgroundMode.DAY ? <DarkModeIcon /> : <LightModeIcon />}
            </StyledFab>
          </Tooltip>
        </CollapsibleButtons>

        {/* Botão de Recolher / Expandir Menu do Topo */}
        <Tooltip title={collapsed ? 'Mostrar ferramentas' : 'Recolher ferramentas'}>
          <ToggleCollapseFab
            size="small"
            $collapsed={collapsed}
            onClick={() => {
              if (!collapsed) {
                setShowRoomInfo(false)
                setShowControlGuide(false)
              }
              setCollapsed(!collapsed)
            }}
            aria-label="Toggle Header Buttons"
          >
            {collapsed ? <TuneIcon /> : <CloseIcon fontSize="small" />}
          </ToggleCollapseFab>
        </Tooltip>
      </ButtonGroup>
    </Backdrop>
  )
}
