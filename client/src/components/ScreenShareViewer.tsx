import React, { useState } from 'react'
import styled from 'styled-components'
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen'
import OpenInFullIcon from '@mui/icons-material/OpenInFull'
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'

import { useAppSelector } from '../hooks'
import store from '../stores'
import Video from './Video'

const Wrapper = styled.div`
  position: fixed;
  right: 18px;
  bottom: 92px;
  z-index: 10001;
  width: 360px;
  max-width: calc(100vw - 24px);
  max-height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
  background: rgba(15, 23, 42, 0.97);
  color: #f8fafc;
  border: 1px solid rgba(0, 235, 199, 0.35);
  border-radius: 14px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
  overflow: hidden;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);

  @media (max-width: 650px) {
    right: 12px;
    bottom: 84px;
    width: calc(100vw - 24px);
  }
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  color: #00ebc7;
`

const HeaderBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: #cbd5e1;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  width: 28px;
  height: 28px;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
  }
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  overflow-y: auto;
`

const Card = styled.div`
  border-radius: 10px;
  overflow: hidden;
  background: #000;
  border: 1px solid rgba(255, 255, 255, 0.08);
`

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 10px;
  background: rgba(255, 255, 255, 0.06);
  font-size: 12px;
  font-weight: 600;
  color: #e2e8f0;

  span {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
`

const StopBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: #dc2626;
  }
`

const VideoHolder = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;

  video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
`

const EmptyBadge = styled.div`
  padding: 10px;
  font-size: 12px;
  color: #94a3b8;
`

export default function ScreenShareViewer() {
  const [collapsed, setCollapsed] = useState(false)
  const myStream = useAppSelector((state) => state.computer.myStream)
  const myScope = useAppSelector((state) => state.computer.myScreenShareScope)
  const peerStreams = useAppSelector((state) => state.computer.peerStreams)
  const playerNameMap = useAppSelector((state) => state.user.playerNameMap)

  const remoteShares = Array.from(peerStreams.entries())
  const total = (myStream ? 1 : 0) + remoteShares.length
  if (total === 0) return null

  const stopMyShare = () => {
    store.getState().computer.shareScreenManager?.stopScreenShare()
  }

  return (
    <Wrapper>
      <Header>
        <Title>
          <span>🖥️ Compartilhamento de tela</span>
          <span>({total})</span>
        </Title>
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
      </Header>

      {!collapsed && (
        <List>
          {myStream && (
            <Card>
              <CardHeader>
                <span>
                  Sua tela
                  {myScope === 'room' ? ' · toda a sala' : ''}
                </span>
                <StopBtn onClick={stopMyShare} title="Parar compartilhamento">
                  <StopScreenShareIcon style={{ fontSize: 14 }} />
                  Parar
                </StopBtn>
              </CardHeader>
              <VideoHolder>
                <Video srcObject={myStream} autoPlay playsInline muted />
              </VideoHolder>
            </Card>
          )}

          {remoteShares.map(([id, { stream }]) => (
            <Card key={id}>
              <CardHeader>
                <span>{playerNameMap.get(id) || 'Colega'}</span>
              </CardHeader>
              <VideoHolder>
                <Video srcObject={stream} autoPlay playsInline controls />
              </VideoHolder>
            </Card>
          ))}
        </List>
      )}

      {collapsed && <EmptyBadge>{total} transmissão(ões) ativa(s).</EmptyBadge>}
    </Wrapper>
  )
}
