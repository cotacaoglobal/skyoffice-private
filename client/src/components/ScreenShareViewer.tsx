import React, { useState, useRef } from 'react'
import styled from 'styled-components'
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen'
import OpenInFullIcon from '@mui/icons-material/OpenInFull'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit'

import { useAppSelector } from '../hooks'
import Video from './Video'

const Wrapper = styled.div<{ $isFullscreen?: boolean }>`
  position: fixed;
  z-index: 10001;
  display: flex;
  flex-direction: column;
  background: rgba(15, 23, 42, 0.98);
  color: #f8fafc;
  border: 1px solid rgba(0, 235, 199, 0.35);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  transition: all 0.25s ease-in-out;

  ${({ $isFullscreen }) =>
    $isFullscreen
      ? `
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
    border: none;
  `
      : `
    right: 18px;
    bottom: 92px;
    width: 440px;
    max-width: calc(100vw - 24px);
    max-height: calc(100vh - 140px);
    border-radius: 14px;
    overflow: hidden;

    @media (max-width: 650px) {
      right: 12px;
      bottom: 84px;
      width: calc(100vw - 24px);
    }
  `}
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
`

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  color: #00ebc7;
`

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

const HeaderBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.06);
  color: #cbd5e1;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  width: 32px;
  height: 32px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: rgba(0, 235, 199, 0.2);
    color: #00ebc7;
    border-color: rgba(0, 235, 199, 0.4);
  }
`

const List = styled.div<{ $isFullscreen?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  overflow-y: auto;
  flex: 1;

  ${({ $isFullscreen }) =>
    $isFullscreen &&
    `
    height: calc(100vh - 54px);
    padding: 16px;
    align-items: center;
    justify-content: center;
  `}
`

const Card = styled.div<{ $isFullscreen?: boolean }>`
  border-radius: 10px;
  overflow: hidden;
  background: #000;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;

  ${({ $isFullscreen }) =>
    $isFullscreen &&
    `
    width: 100%;
    height: 100%;
    max-height: 100%;
  `}
`

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.06);
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
  flex-shrink: 0;

  span {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
`

const VideoHolder = styled.div<{ $isFullscreen?: boolean }>`
  position: relative;
  width: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ $isFullscreen }) =>
    $isFullscreen
      ? `
    flex: 1;
    height: 100%;
  `
      : `
    aspect-ratio: 16 / 9;
  `}

  video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
`

const EmptyBadge = styled.div`
  padding: 12px;
  font-size: 12px;
  color: #94a3b8;
`

export default function ScreenShareViewer() {
  const [collapsed, setCollapsed] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const peerStreams = useAppSelector((state) => state.computer.peerStreams)
  const playerNameMap = useAppSelector((state) => state.user.playerNameMap)

  // Apenas exibe o modal se houver transmissões de outros membros (remotos)
  const remoteShares = Array.from(peerStreams.entries())
  if (remoteShares.length === 0) return null

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true)
      setCollapsed(false)
      const el = wrapperRef.current
      if (el && typeof el.requestFullscreen === 'function') {
        el.requestFullscreen().catch(() => {})
      }
    } else {
      setIsFullscreen(false)
      if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
        document.exitFullscreen().catch(() => {})
      }
    }
  }

  return (
    <Wrapper ref={wrapperRef} $isFullscreen={isFullscreen}>
      <Header>
        <Title>
          <span>🖥️ Tela Compartilhada</span>
          <span>({remoteShares.length})</span>
        </Title>
        <HeaderActions>
          <HeaderBtn
            title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <FullscreenExitIcon style={{ fontSize: 20 }} />
            ) : (
              <FullscreenIcon style={{ fontSize: 20 }} />
            )}
          </HeaderBtn>

          {!isFullscreen && (
            <HeaderBtn
              title={collapsed ? 'Expandir' : 'Minimizar'}
              onClick={() => setCollapsed((value) => !value)}
            >
              {collapsed ? (
                <OpenInFullIcon style={{ fontSize: 16 }} />
              ) : (
                <CloseFullscreenIcon style={{ fontSize: 16 }} />
              )}
            </HeaderBtn>
          )}
        </HeaderActions>
      </Header>

      {!collapsed && (
        <List $isFullscreen={isFullscreen}>
          {remoteShares.map(([id, { stream }]) => (
            <Card key={id} $isFullscreen={isFullscreen}>
              <CardHeader>
                <span>{playerNameMap.get(id) || 'Colega de Trabalho'}</span>
              </CardHeader>
              <VideoHolder $isFullscreen={isFullscreen}>
                <Video srcObject={stream} autoPlay playsInline muted controls />
              </VideoHolder>
            </Card>
          ))}
        </List>
      )}

      {collapsed && !isFullscreen && (
        <EmptyBadge>{remoteShares.length} compartilhamento(s) ativo(s).</EmptyBadge>
      )}
    </Wrapper>
  )
}
