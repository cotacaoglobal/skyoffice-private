import React, { useState } from 'react'
import styled from 'styled-components'
import Tooltip from '@mui/material/Tooltip'
import Fab from '@mui/material/Fab'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import CircleIcon from '@mui/icons-material/Circle'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import EditIcon from '@mui/icons-material/Edit'
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks'
import LogoutIcon from '@mui/icons-material/Logout'

import { useAppSelector, useAppDispatch } from '../hooks'
import { setLoggedIn, setSidebarOpen } from '../stores/UserStore'
import { setRoomJoined } from '../stores/RoomStore'
import { openPrivateChat } from '../stores/ChatStore'
import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

// Import de avatares conhecidos
import Adam from '../images/login/Adam_login.png'
import Ash from '../images/login/Ash_login.png'
import Lucy from '../images/login/Lucy_login.png'
import Nancy from '../images/login/Nancy_login.png'

const avatarMap: Record<string, string> = {
  adam: Adam,
  ash: Ash,
  lucy: Lucy,
  nancy: Nancy,
}

const ToggleButton = styled(Fab)`
  && {
    position: fixed;
    top: 20px;
    left: 20px;
    background: #1e1f2b;
    color: #00ebc7;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 10000;
    pointer-events: auto;

    @media (max-width: 650px) {
      top: 12px;
      left: 12px;
      width: 38px;
      height: 38px;
      min-height: 38px;
    }

    &:hover {
      background: #282a3c;
    }
  }
`

const SidebarContainer = styled.div<{ $x: number; $y: number; $showChat?: boolean }>`
  position: fixed;
  top: ${({ $y }) => $y}px;
  left: ${({ $x }) => $x}px;
  width: 320px;
  max-height: calc(100vh - 32px);
  background: #171821;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1001;
  color: #e2e8f0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;

  @media (max-width: 650px) {
    top: 10px !important;
    left: 10px !important;
    right: 10px !important;
    transform: none !important;
    width: calc(100vw - 20px) !important;
    max-width: calc(100vw - 20px) !important;
    max-height: ${({ $showChat }) => ($showChat ? '42vh' : 'calc(100vh - 85px)')} !important;
    box-sizing: border-box;
  }
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  user-select: none;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }

  h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .close-btn {
    cursor: pointer;
    color: #94a3b8;
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border-radius: 6px;
    transition: all 0.2s;

    &:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.08);
    }
  }
`

const SearchBarWrapper = styled.div`
  padding: 12px 16px;
  position: relative;

  .search-icon {
    position: absolute;
    left: 28px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 18px;
    color: #64748b;
  }

  input {
    width: 100%;
    background: #212330;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    padding: 8px 12px 8px 36px;
    font-size: 13px;
    color: #f1f5f9;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s;

    &::placeholder {
      color: #64748b;
    }

    &:focus {
      border-color: #00ebc7;
    }
  }
`

const BadgeRow = styled.div`
  display: flex;
  gap: 8px;
  padding: 0 16px 12px 16px;
`

const Badge = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 6px;
  background: #212330;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 600;
  color: #cbd5e1;

  .circle {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    background: ${({ $color }) => $color};
    color: #fff;
    font-size: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }
`

const ContentScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
`

const SectionCard = styled.div`
  background: #1c1d29;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  .left {
    display: flex;
    align-items: center;
    gap: 8px;

    .title {
      font-size: 13px;
      font-weight: 700;
      color: #f8fafc;
    }

    .count {
      background: #2a2c3d;
      color: #94a3b8;
      font-size: 10px;
      font-weight: bold;
      padding: 1px 6px;
      border-radius: 10px;
    }
  }

  .tag {
    font-size: 10px;
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
  }
`

const MemberItem = styled.div<{ $isSelf?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${({ $isSelf }) => ($isSelf ? 'rgba(0, 235, 199, 0.08)' : '#232536')};
  border: 1px solid ${({ $isSelf }) => ($isSelf ? 'rgba(0, 235, 199, 0.25)' : 'rgba(255, 255, 255, 0.04)')};
  border-radius: 10px;
  padding: 8px 10px;
  transition: transform 0.15s, background 0.15s;

  &:hover {
    background: #292c3f;
    transform: translateY(-1px);
  }

  .avatar-box {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: #171821;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      image-rendering: pixelated;
    }
  }

  .info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;

    .name-row {
      display: flex;
      align-items: center;
      gap: 6px;

      .name {
        font-size: 13px;
        font-weight: 600;
        color: #f1f5f9;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .badge-self {
        font-size: 9px;
        background: #00ebc7;
        color: #0d1117;
        font-weight: bold;
        padding: 0 4px;
        border-radius: 3px;
      }
    }

    .status-text {
      font-size: 11px;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .status-indicator {
    display: flex;
    align-items: center;
    flex-shrink: 0;

    .online-dot {
      color: #22c55e;
      font-size: 10px;
    }
  }
`

const FooterContainer = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 14px 16px;
  background: #14151e;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;

  .label {
    font-size: 11px;
    color: #94a3b8;
    margin-right: 4px;
    font-weight: 600;
  }
`

const StatusButton = styled.button<{ $active: boolean; $color: string }>`
  background: ${({ $active, $color }) => ($active ? `${$color}22` : '#212330')};
  border: 1px solid ${({ $active, $color }) => ($active ? $color : 'rgba(255, 255, 255, 0.06)')};
  color: ${({ $active, $color }) => ($active ? $color : '#94a3b8')};
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: ${({ $color }) => $color};
    color: #fff;
  }
`

const LeaveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #dc26261f;
  border: 1px solid #dc262666;
  color: #f87171;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #dc2626;
    color: #ffffff;
    border-color: #dc2626;
  }
`

export default function MembersSidebar() {
  const dispatch = useAppDispatch()
  const sidebarOpen = useAppSelector((state) => state.user.sidebarOpen)
  const showChat = useAppSelector((state) => state.chat.showChat)
  const [searchTerm, setSearchTerm] = useState('')
  const [myStatus, setMyStatus] = useState<'online' | 'busy' | 'away'>('online')

  const [pos, setPos] = useState({ x: 16, y: 16 })
  const isDragging = React.useRef(false)
  const dragOffset = React.useRef({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('.close-btn') || target.closest('button') || target.closest('input')) return

    isDragging.current = true
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current) return
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 320, moveEvent.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 80, moveEvent.clientY - dragOffset.current.y)),
      })
    }

    const handleMouseUp = () => {
      isDragging.current = false
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const playerNameMap = useAppSelector((state) => state.user.playerNameMap)
  const roomName = useAppSelector((state) => state.room.roomName)

  const handleLeaveOffice = async () => {
    try {
      const game = phaserGame?.scene?.keys?.game as Game
      if (game?.network?.webRTC) {
        // Desconecta tracks de mídia
        game.network.webRTC.getUserMedia(false)
      }
      // Desconecta do Supabase se desejar logout completo
      try {
        localStorage.removeItem('skyoffice_auto_login')
      } catch (e) {}
      const { supabase } = await import('../supabaseClient')
      await supabase.auth.signOut()

      // Redireciona para o login/seleção de sala
      dispatch(setLoggedIn(false))
      dispatch(setRoomJoined(false))
      window.location.reload()
    } catch (e) {
      try {
        localStorage.removeItem('skyoffice_auto_login')
      } catch (err) {}
      window.location.reload()
    }
  }

  // Acessa o jogador atual na cena do jogo
  let myPlayerName = 'Você'
  let myPlayerTexture = 'adam'
  try {
    const game = phaserGame?.scene?.keys?.game as Game
    if (game?.myPlayer?.playerName?.text) {
      myPlayerName = game.myPlayer.playerName.text
    }
    if (game?.myPlayer?.playerTexture) {
      myPlayerTexture = game.myPlayer.playerTexture.toLowerCase()
    }
  } catch (err) {
    console.warn('Game player not ready yet', err)
  }

  // Monta lista de colegas conectados com segurança
  const otherMembers: Array<{ id: string; name: string; avatar: string }> = []
  if (playerNameMap) {
    try {
      const entries = playerNameMap.entries ? Array.from(playerNameMap.entries()) : []
      entries.forEach(([id, name]) => {
        const strName = typeof name === 'string' ? name : (name ? String(name) : 'Colega')
        otherMembers.push({
          id,
          name: strName,
          avatar: 'adam',
        })
      })
    } catch (e) {
      console.warn('Error reading playerNameMap', e)
    }
  }

  // Lista combinada com você em primeiro lugar
  const allMembers = [
    {
      id: 'me',
      name: String(myPlayerName || 'Você'),
      avatar: myPlayerTexture,
      isSelf: true,
      status: 'No escritório • Online',
      icon: <CircleIcon style={{ color: '#22c55e', fontSize: 10 }} />,
    },
    ...otherMembers.map((m, idx) => ({
      id: m.id,
      name: String(m.name || 'Colega'),
      avatar: m.avatar,
      isSelf: false,
      status: idx % 2 === 0 ? 'Focado no projeto' : 'Em reunião / Ativo',
      icon: idx % 2 === 0 ? <EditIcon style={{ fontSize: 13, color: '#38bdf8' }} /> : <LibraryBooksIcon style={{ fontSize: 13, color: '#a78bfa' }} />,
    })),
  ]

  const search = String(searchTerm || '').toLowerCase()
  const filteredMembers = allMembers.filter((m) =>
    String(m.name || '').toLowerCase().includes(search)
  )

  if (!sidebarOpen) {
    return (
      <Tooltip title="Ver Membros no Escritório" placement="right">
        <ToggleButton size="medium" onClick={() => dispatch(setSidebarOpen(true))}>
          <PeopleAltIcon />
        </ToggleButton>
      </Tooltip>
    )
  }

  return (
    <SidebarContainer $x={pos.x} $y={pos.y} $showChat={showChat}>
      <Header onMouseDown={handleMouseDown}>
        <h2>
          <PeopleAltIcon style={{ color: '#00ebc7', fontSize: 18 }} />
          Escritório ({allMembers.length})
        </h2>
        <button className="close-btn" onClick={() => dispatch(setSidebarOpen(false))}>
          <CloseIcon style={{ fontSize: 18 }} />
        </button>
      </Header>

        <SearchBarWrapper>
          <SearchIcon className="search-icon" />
          <input
            type="text"
            placeholder="Buscar colega no escritório..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBarWrapper>

        <BadgeRow>
          <Badge $color="#f97316">
            <span className="circle">P</span>
            <span>Principal</span>
          </Badge>
          <Badge $color="#3b82f6">
            <span className="circle">R</span>
            <span>Reunião</span>
          </Badge>
        </BadgeRow>

        <ContentScroll>
          <SectionCard>
            <SectionHeader>
              <div className="left">
                <span className="title">{roomName || 'Escritório Geral'}</span>
                <span className="count">{filteredMembers.length}</span>
              </div>
              <span className="tag">~/equipe</span>
            </SectionHeader>

            {filteredMembers.map((member) => (
              <MemberItem
                key={member.id}
                $isSelf={member.isSelf}
                style={{ cursor: member.isSelf ? 'default' : 'pointer' }}
                onClick={() => {
                  if (!member.isSelf) {
                    dispatch(openPrivateChat({ playerId: member.id, playerName: member.name }))
                  }
                }}
                title={member.isSelf ? 'Você' : `Clique para conversar no privado com ${member.name}`}
              >
                <div className="avatar-box">
                  <img
                    src={avatarMap[member.avatar] || Adam}
                    alt={member.name}
                  />
                </div>
                <div className="info">
                  <div className="name-row">
                    <span className="name">{member.name}</span>
                    {member.isSelf && <span className="badge-self">VOCÊ</span>}
                  </div>
                  <span className="status-text">{member.status}</span>
                </div>
                <div className="status-indicator">
                  <CircleIcon
                    style={{
                      color:
                        member.isSelf
                          ? myStatus === 'online'
                            ? '#22c55e'
                            : myStatus === 'busy'
                            ? '#ef4444'
                            : '#f59e0b'
                          : '#22c55e',
                      fontSize: 10,
                    }}
                  />
                </div>
              </MemberItem>
            ))}
          </SectionCard>
        </ContentScroll>

        <FooterContainer>
          <StatusRow>
            <span className="label">Meu Status:</span>
            <StatusButton
              $active={myStatus === 'online'}
              $color="#22c55e"
              onClick={() => setMyStatus('online')}
            >
              ● Disponível
            </StatusButton>
            <StatusButton
              $active={myStatus === 'busy'}
              $color="#ef4444"
              onClick={() => setMyStatus('busy')}
            >
              ● Ocupado
            </StatusButton>
            <StatusButton
              $active={myStatus === 'away'}
              $color="#f59e0b"
              onClick={() => setMyStatus('away')}
            >
              ● Ausente
            </StatusButton>
          </StatusRow>

          <LeaveButton onClick={handleLeaveOffice}>
            <LogoutIcon style={{ fontSize: 16 }} />
            Sair do Escritório
          </LeaveButton>
        </FooterContainer>
      </SidebarContainer>
  )
}
