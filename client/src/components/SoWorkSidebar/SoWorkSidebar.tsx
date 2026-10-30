import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import Tooltip from '@mui/material/Tooltip'
import Avatar from '@mui/material/Avatar'

// Ícones SoWork
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import HomeIcon from '@mui/icons-material/Home'
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import FolderCopyOutlinedIcon from '@mui/icons-material/FolderCopyOutlined'
import FolderCopyRoundedIcon from '@mui/icons-material/FolderCopyRounded'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded'
import CircleIcon from '@mui/icons-material/Circle'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import HeadphonesRoundedIcon from '@mui/icons-material/HeadphonesRounded'
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded'
import ExitToAppRoundedIcon from '@mui/icons-material/ExitToAppRounded'
import CheckroomRoundedIcon from '@mui/icons-material/CheckroomRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import TagRoundedIcon from '@mui/icons-material/TagRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import InsertEmoticonRoundedIcon from '@mui/icons-material/InsertEmoticonRounded'
import VideoCallRoundedIcon from '@mui/icons-material/VideoCallRounded'

import { useAppSelector, useAppDispatch } from '../../hooks'
import { setLoggedIn } from '../../stores/UserStore'
import { setRoomJoined } from '../../stores/RoomStore'
import { openPrivateChat, setActiveTab, setFocused } from '../../stores/ChatStore'
import { phaserEvents } from '../../events/EventCenter'
import phaserGame from '../../PhaserGame'
import Game from '../../scenes/Game'

// Avatares
import Adam from '../../images/login/Adam_login.png'
import Ash from '../../images/login/Ash_login.png'
import Lucy from '../../images/login/Lucy_login.png'
import Nancy from '../../images/login/Nancy_login.png'

const avatarMap: Record<string, string> = {
  adam: Adam,
  ash: Ash,
  lucy: Lucy,
  nancy: Nancy,
}

export type SidebarTab = 'home' | 'chat' | 'calendar' | 'meetings' | 'departments' | null

// Container Global do Dock + Painel
const SidebarWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  display: flex;
  z-index: 9999;
  pointer-events: none;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  & > * {
    pointer-events: auto;
  }
`

// 1. DOCK VERTICAL FIXO (Estilo SoWork ~64px)
const VerticalDock = styled.div`
  width: 64px;
  height: 100%;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  box-sizing: border-box;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.04);
  z-index: 10002;
  user-select: none;

  @media (max-width: 650px) {
    width: 52px;
    padding: 10px 0;
  }
`

const DockTop = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
`

const LogoBadge = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 800;
  font-size: 18px;
  box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);
  margin-bottom: 8px;
  cursor: pointer;
`

const NavButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
`

const NavIconButton = styled.button<{ $active?: boolean }>`
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: none;
  background: ${({ $active }) => ($active ? '#5865F2' : 'transparent')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#64748b')};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.18s ease-in-out;
  position: relative;

  &:hover {
    background: ${({ $active }) => ($active ? '#4752c4' : '#f1f5f9')};
    color: ${({ $active }) => ($active ? '#ffffff' : '#1e293b')};
    transform: translateY(-1px);
  }

  svg {
    font-size: 24px;
  }

  ${({ $active }) =>
    $active &&
    `
    box-shadow: 0 4px 12px rgba(88, 101, 242, 0.35);
  `}
`

const DockBottom = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
`

const AvatarButton = styled.div<{ $statusColor?: string }>`
  position: relative;
  cursor: pointer;
  margin-top: 4px;
  padding: 2px;
  border-radius: 50%;
  transition: transform 0.15s ease;

  &:hover {
    transform: scale(1.08);
  }

  .status-dot {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background-color: ${({ $statusColor }) => $statusColor || '#22c55e'};
    border: 2px solid #ffffff;
  }
`

// 2. PAINEL EXPANSÍVEL LATERAL (FLYOUT DRAWER ~340px)
const FlyoutPanel = styled.div<{ $open: boolean }>`
  width: 340px;
  height: 100%;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  box-shadow: 8px 0 24px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  transform: ${({ $open }) => ($open ? 'translateX(0)' : 'translateX(-100%)')};
  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
  z-index: 10001;

  @media (max-width: 650px) {
    width: calc(100vw - 52px);
  }
`

const PanelHeader = styled.div`
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f1f5f9;

  .title-group {
    display: flex;
    align-items: center;
    gap: 8px;

    h2 {
      margin: 0;
      font-size: 17px;
      font-weight: 700;
      color: #0f172a;
    }
  }

  .close-icon-btn {
    border: none;
    background: transparent;
    color: #94a3b8;
    cursor: pointer;
    padding: 6px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: #f1f5f9;
      color: #334155;
    }
  }
`

const PanelBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
`

// CARDS E ESTILOS INSPIRADOS NO SOWORK
const InviteCard = styled.div`
  background: linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  .headline {
    font-size: 13px;
    font-weight: 600;
    color: #0369a1;
  }

  .avatar-cluster {
    display: flex;
    align-items: center;
    margin-left: 6px;

    img {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid #ffffff;
      margin-left: -6px;
      background: #ffffff;
    }
  }

  button {
    background: #5865f2;
    color: #ffffff;
    border: none;
    border-radius: 10px;
    padding: 8px 14px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: background 0.15s ease;

    &:hover {
      background: #4752c4;
    }
  }
`

const SectionBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  .sec-title {
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`

const CollaborationCard = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .left {
    display: flex;
    flex-direction: column;
    gap: 2px;
    .badge {
      font-size: 11px;
      font-weight: 700;
      color: #3b82f6;
    }
    .time {
      font-size: 12px;
      color: #475569;
    }
  }

  .count {
    font-size: 11px;
    color: #64748b;
    background: #e2e8f0;
    padding: 2px 8px;
    border-radius: 9999px;
  }
`

const MeetingLiveCard = styled.div`
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  color: #94a3b8;
  font-size: 12px;
`

const MemberRow = styled.div<{ $isSelf?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: #f1f5f9;
  }

  .left {
    display: flex;
    align-items: center;
    gap: 10px;

    .avatar-wrapper {
      position: relative;
      width: 34px;
      height: 34px;

      img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }

      .dot {
        position: absolute;
        bottom: -1px;
        right: -1px;
        width: 9px;
        height: 9px;
        border-radius: 50%;
        border: 2px solid #ffffff;
      }
    }

    .meta {
      display: flex;
      flex-direction: column;
      .name {
        font-size: 13px;
        font-weight: 600;
        color: #1e293b;
      }
      .status-text {
        font-size: 11px;
        color: #64748b;
      }
    }
  }

  .action-badge {
    font-size: 10px;
    font-weight: 700;
    color: #64748b;
    background: #f1f5f9;
    padding: 2px 6px;
    border-radius: 6px;
  }
`

// POPOVER DO USUÁRIO (Estilo SoWork Imagem 5)
const UserProfileModal = styled.div`
  position: fixed;
  bottom: 16px;
  left: 74px;
  width: 310px;
  background: #1e2029;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45);
  color: #f8fafc;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  z-index: 10005;
  user-select: none;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;

      img {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 2px solid #5865f2;
      }

      .details {
        display: flex;
        flex-direction: column;
        .name {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
        }
        .status {
          font-size: 11px;
          color: #22c55e;
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }
    }

    .close-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      &:hover {
        color: #ffffff;
      }
    }
  }

  .status-selector {
    display: flex;
    gap: 6px;
    button {
      flex: 1;
      padding: 6px 4px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.04);
      color: #cbd5e1;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: all 0.12s ease;

      &.active {
        background: rgba(34, 197, 94, 0.2);
        border-color: #22c55e;
        color: #4ade80;
      }
      &.busy.active {
        background: rgba(239, 68, 68, 0.2);
        border-color: #ef4444;
        color: #f87171;
      }
      &.away.active {
        background: rgba(245, 158, 11, 0.2);
        border-color: #f59e0b;
        color: #fbbf24;
      }
    }
  }

  .quick-status-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 10px;

    .item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 8px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      color: #e2e8f0;

      &:hover {
        background: rgba(255, 255, 255, 0.06);
      }

      .left {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .duration {
        font-size: 10px;
        color: #f59e0b;
      }
    }
  }

  .bottom-actions {
    display: flex;
    flex-direction: column;
    gap: 4px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 10px;

    button {
      background: transparent;
      border: none;
      color: #94a3b8;
      padding: 6px 8px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      border-radius: 6px;
      text-align: left;

      &:hover {
        background: rgba(255, 255, 255, 0.06);
        color: #ffffff;
      }

      &.logout {
        color: #f87171;
        &:hover {
          background: rgba(239, 68, 68, 0.15);
        }
      }
    }
  }
`

interface SoWorkSidebarProps {
  onOpenMeetingHistory?: () => void
  onOpenDepartments?: () => void
}

export const SoWorkSidebar: React.FC<SoWorkSidebarProps> = ({
  onOpenMeetingHistory,
  onOpenDepartments,
}) => {
  const dispatch = useAppDispatch()
  const roomName = useAppSelector((state) => state.room.roomName)

  // Estado da aba selecionada no Dock
  const [activeTab, setDockTab] = useState<SidebarTab>('home')
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true)
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false)

  // Status do usuário
  const [userStatus, setUserStatus] = useState<'active' | 'busy' | 'away'>('active')
  const [customStatus, setCustomStatus] = useState<string>('Disponível')

  // Membros do escritório
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [myPlayerInfo, setMyPlayerInfo] = useState<{ name: string; avatar: string }>({
    name: localStorage.getItem('skyoffice_user_name') || 'Wanderson Silva',
    avatar: localStorage.getItem('skyoffice_user_avatar') || 'adam',
  })
  const [otherPlayers, setOtherPlayers] = useState<Array<{ id: string; name: string; avatar: string }>>([])

  // Chat integrado
  const chatMessages = useAppSelector((state) => state.chat.chatMessages)
  const [chatInput, setChatInput] = useState<string>('')

  // Atualização em tempo real de jogadores
  useEffect(() => {
    const updatePlayers = () => {
      const game = phaserGame?.scene?.keys?.game as Game
      if (!game) return

      if (game.myPlayer) {
        setMyPlayerInfo({
          name: game.myPlayer.playerName?.text || myPlayerInfo.name,
          avatar: (game.myPlayer as any).avatarTexture || myPlayerInfo.avatar,
        })
      }

      const list: Array<{ id: string; name: string; avatar: string }> = []
      try {
        const gameOtherPlayers = (game as any).otherPlayerMap
        if (gameOtherPlayers) {
          gameOtherPlayers.forEach((other: any, id: string) => {
            list.push({
              id,
              name: other.playerName?.text || 'Colega',
              avatar: other.playerTexture?.toLowerCase() || 'adam',
            })
          })
        }
      } catch (e) {
        console.warn('Error reading other players', e)
      }
      setOtherPlayers(list)
    }

    const interval = setInterval(updatePlayers, 1500)
    updatePlayers()
    return () => clearInterval(interval)
  }, [])

  // Gerenciador de cliques no Dock
  const handleTabClick = (tab: SidebarTab) => {
    if (tab === 'meetings') {
      phaserEvents.emit('OPEN_MEETING_HISTORY')
      onOpenMeetingHistory?.()
      return
    }
    if (tab === 'departments') {
      phaserEvents.emit('OPEN_DEPARTMENTS')
      onOpenDepartments?.()
      return
    }

    if (activeTab === tab && isPanelOpen) {
      setIsPanelOpen(false)
    } else {
      setDockTab(tab)
      setIsPanelOpen(true)
    }
  }

  // Envio de mensagem rápida no painel de Chat do SoWork
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const game = phaserGame?.scene?.keys?.game as Game
    if (game && game.network) {
      game.network.addChatMessage(chatInput.trim())
    }
    setChatInput('')
  }

  // Status Color
  const getStatusColor = () => {
    if (userStatus === 'active') return '#22c55e'
    if (userStatus === 'busy') return '#ef4444'
    return '#f59e0b'
  }

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('skyoffice_auto_login')
    import('../../supabaseClient')
      .then(({ supabase }) => supabase.auth.signOut())
      .catch((err) => console.warn(err))

    dispatch(setLoggedIn(false))
    dispatch(setRoomJoined(false))
    window.location.reload()
  }

  return (
    <SidebarWrapper>
      {/* 1. DOCK VERTICAL FIXO */}
      <VerticalDock>
        <DockTop>
          <Tooltip title="Agência Br Escritório" placement="right">
            <LogoBadge onClick={() => handleTabClick('home')}>BR</LogoBadge>
          </Tooltip>

          <NavButtonGroup>
            <Tooltip title="Equipes & Reuniões" placement="right">
              <NavIconButton
                $active={isPanelOpen && activeTab === 'home'}
                onClick={() => handleTabClick('home')}
              >
                {isPanelOpen && activeTab === 'home' ? <HomeIcon /> : <HomeOutlinedIcon />}
              </NavIconButton>
            </Tooltip>

            <Tooltip title="Chat & Mensagens" placement="right">
              <NavIconButton
                $active={isPanelOpen && activeTab === 'chat'}
                onClick={() => handleTabClick('chat')}
              >
                {isPanelOpen && activeTab === 'chat' ? (
                  <ChatBubbleRoundedIcon />
                ) : (
                  <ChatBubbleOutlineRoundedIcon />
                )}
              </NavIconButton>
            </Tooltip>

            <Tooltip title="Calendário & Agenda" placement="right">
              <NavIconButton
                $active={isPanelOpen && activeTab === 'calendar'}
                onClick={() => handleTabClick('calendar')}
              >
                {isPanelOpen && activeTab === 'calendar' ? (
                  <CalendarMonthRoundedIcon />
                ) : (
                  <CalendarMonthOutlinedIcon />
                )}
              </NavIconButton>
            </Tooltip>

            <Tooltip title="Central de Reuniões & Atas IA" placement="right">
              <NavIconButton
                $active={false}
                onClick={() => handleTabClick('meetings')}
              >
                <FolderCopyOutlinedIcon />
              </NavIconButton>
            </Tooltip>

            <Tooltip title="Departamentos & Salas Corporativas" placement="right">
              <NavIconButton
                $active={false}
                onClick={() => handleTabClick('departments')}
              >
                <BusinessOutlinedIcon />
              </NavIconButton>
            </Tooltip>
          </NavButtonGroup>
        </DockTop>

        <DockBottom>
          <Tooltip title="Ajuda & Atalhos" placement="right">
            <NavIconButton onClick={() => handleTabClick('home')}>
              <HelpOutlineRoundedIcon />
            </NavIconButton>
          </Tooltip>

          <Tooltip title="Perfil & Status" placement="right">
            <AvatarButton
              $statusColor={getStatusColor()}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <Avatar
                src={avatarMap[myPlayerInfo.avatar] || Adam}
                style={{ width: 38, height: 38, border: '1px solid #cbd5e1' }}
              />
              <div className="status-dot" />
            </AvatarButton>
          </Tooltip>
        </DockBottom>
      </VerticalDock>

      {/* 2. PAINEL EXPANSÍVEL LATERAL */}
      <FlyoutPanel $open={isPanelOpen}>
        {/* CONTEÚDO: HOME / EQUIPES (IMAGEM 1) */}
        {activeTab === 'home' && (
          <>
            <PanelHeader>
              <div className="title-group">
                <h2>{roomName || 'Agência Br'}</h2>
              </div>
              <button className="close-icon-btn" onClick={() => setIsPanelOpen(false)}>
                <CloseRoundedIcon fontSize="small" />
              </button>
            </PanelHeader>

            <PanelBody>
              {/* Card de Convidar Colegas */}
              <InviteCard>
                <div className="headline">SoWork é melhor com colegas de equipe!</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="avatar-cluster">
                    <img src={Adam} alt="Colaborador 1" />
                    <img src={Lucy} alt="Colaborador 2" />
                    <img src={Ash} alt="Colaborador 3" />
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href)
                      alert('Link do escritório copiado para a área de transferência!')
                    }}
                  >
                    <PersonAddAlt1RoundedIcon style={{ fontSize: 16 }} />
                    Convidar equipe
                  </button>
                </div>
              </InviteCard>

              {/* Horas de Colaboração */}
              <SectionBox>
                <div className="sec-title">Horas de Colaboração</div>
                <CollaborationCard>
                  <div className="left">
                    <span className="badge">Escritório Agência Br</span>
                    <span className="time">Expediente ativo hoje</span>
                  </div>
                  <span className="count">{1 + otherPlayers.length} presentes</span>
                </CollaborationCard>
              </SectionBox>

              {/* Reuniões em Andamento */}
              <SectionBox>
                <div className="sec-title">Reuniões</div>
                <MeetingLiveCard>
                  Nenhuma reunião em andamento neste andar
                </MeetingLiveCard>
              </SectionBox>

              {/* Membros Online */}
              <SectionBox>
                <div className="sec-title">Online ({1 + otherPlayers.length})</div>

                {/* Usuário logado */}
                <MemberRow $isSelf={true}>
                  <div className="left">
                    <div className="avatar-wrapper">
                      <img src={avatarMap[myPlayerInfo.avatar] || Adam} alt="Eu" />
                      <div className="dot" style={{ backgroundColor: getStatusColor() }} />
                    </div>
                    <div className="meta">
                      <span className="name">{myPlayerInfo.name}</span>
                      <span className="status-text">{customStatus}</span>
                    </div>
                  </div>
                  <span className="action-badge">VOCÊ</span>
                </MemberRow>

                {/* Outros colegas */}
                {otherPlayers.map((player) => (
                  <MemberRow
                    key={player.id}
                    onClick={() => {
                      dispatch(openPrivateChat({ playerId: player.id, playerName: player.name }))
                      setDockTab('chat')
                    }}
                    title={`Conversar com ${player.name}`}
                  >
                    <div className="left">
                      <div className="avatar-wrapper">
                        <img src={avatarMap[player.avatar] || Adam} alt={player.name} />
                        <div className="dot" style={{ backgroundColor: '#22c55e' }} />
                      </div>
                      <div className="meta">
                        <span className="name">{player.name}</span>
                        <span className="status-text">No escritório</span>
                      </div>
                    </div>
                    <span className="action-badge">DM</span>
                  </MemberRow>
                ))}
              </SectionBox>
            </PanelBody>
          </>
        )}

        {/* CONTEÚDO: CHAT & MENSAGENS (IMAGEM 2) */}
        {activeTab === 'chat' && (
          <>
            <PanelHeader>
              <div className="title-group">
                <ChatBubbleRoundedIcon style={{ color: '#5865F2', fontSize: 20 }} />
                <h2>Chat Corporativo</h2>
              </div>
              <button className="close-icon-btn" onClick={() => setIsPanelOpen(false)}>
                <CloseRoundedIcon fontSize="small" />
              </button>
            </PanelHeader>

            <PanelBody style={{ padding: '0px', display: 'flex', flexDirection: 'column' }}>
              {/* Canais rápidos */}
              <div
                style={{
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: '#5865F2',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onClick={() => dispatch(setActiveTab('global'))}
                >
                  # geral
                </div>
              </div>

              {/* Mensagens do chat */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {chatMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', marginTop: '40px' }}>
                    Nenhuma mensagem recente. Seja o primeiro a falar!
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                          {msg.chatMessage?.author || 'Colega'}
                        </span>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                          {new Date(msg.chatMessage?.createdAt || Date.now()).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div
                        style={{
                          background: '#f1f5f9',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          color: '#334155',
                          wordBreak: 'break-word',
                        }}
                      >
                        {msg.chatMessage?.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Barra de input do Chat */}
              <form
                onSubmit={handleSendChatMessage}
                style={{
                  padding: '12px',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#ffffff',
                }}
              >
                <input
                  type="text"
                  placeholder="Mensagem para #geral..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onFocus={() => dispatch(setFocused(true))}
                  onBlur={() => dispatch(setFocused(false))}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    fontSize: '13px',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: '#5865F2',
                    border: 'none',
                    borderRadius: '8px',
                    width: '36px',
                    height: '36px',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <SendRoundedIcon style={{ fontSize: 16 }} />
                </button>
              </form>
            </PanelBody>
          </>
        )}

        {/* CONTEÚDO: CALENDÁRIO (IMAGEM 3) */}
        {activeTab === 'calendar' && (
          <>
            <PanelHeader>
              <div className="title-group">
                <CalendarMonthRoundedIcon style={{ color: '#5865F2', fontSize: 20 }} />
                <h2>Calendário</h2>
              </div>
              <button className="close-icon-btn" onClick={() => setIsPanelOpen(false)}>
                <CloseRoundedIcon fontSize="small" />
              </button>
            </PanelHeader>

            <PanelBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                  Vincular Calendário
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#475569' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <CalendarMonthRoundedIcon style={{ color: '#5865F2', fontSize: 20 }} />
                    <span>Vincule seu Calendário para visualizar e agendar reuniões no escritório.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <CheckCircleRoundedIcon style={{ color: '#5865F2', fontSize: 20 }} />
                    <span>Receba Notificações & Lembretes automáticos direto na sua mesa.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                  <button
                    onClick={() => alert('Integração com Google Calendar será sincronizada com sua conta!')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#334155',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ color: '#ea4335', fontWeight: 'bold' }}>G</span> Vincular Google Calendar
                  </button>

                  <button
                    onClick={() => alert('Integração com Outlook Calendar iniciada!')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#334155',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ color: '#0078d4', fontWeight: 'bold' }}>O</span> Conectar Calendário Outlook
                  </button>
                </div>
              </div>
            </PanelBody>
          </>
        )}
      </FlyoutPanel>

      {/* 3. POPOVER DE PERFIL E STATUS (IMAGEM 5) */}
      {showProfileMenu && (
        <UserProfileModal>
          <div className="header">
            <div className="user-info">
              <img src={avatarMap[myPlayerInfo.avatar] || Adam} alt="Perfil" />
              <div className="details">
                <span className="name">{myPlayerInfo.name}</span>
                <span className="status">
                  <CircleIcon style={{ fontSize: 9 }} />
                  {customStatus}
                </span>
              </div>
            </div>
            <button className="close-btn" onClick={() => setShowProfileMenu(false)}>
              <CloseRoundedIcon fontSize="small" />
            </button>
          </div>

          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
            Definir sua disponibilidade
          </div>
          <div className="status-selector">
            <button
              className={userStatus === 'active' ? 'active' : ''}
              onClick={() => {
                setUserStatus('active')
                setCustomStatus('Ativo')
              }}
            >
              <CircleIcon style={{ fontSize: 9, color: '#22c55e' }} />
              Ativo
            </button>
            <button
              className={`busy ${userStatus === 'busy' ? 'active' : ''}`}
              onClick={() => {
                setUserStatus('busy')
                setCustomStatus('Ocupado')
              }}
            >
              <HeadphonesRoundedIcon style={{ fontSize: 13, color: '#ef4444' }} />
              Ocupado
            </button>
            <button
              className={`away ${userStatus === 'away' ? 'active' : ''}`}
              onClick={() => {
                setUserStatus('away')
                setCustomStatus('Ausente')
              }}
            >
              <AccessTimeFilledRoundedIcon style={{ fontSize: 13, color: '#f59e0b' }} />
              Ausente
            </button>
          </div>

          <div className="quick-status-list">
            <div
              className="item"
              onClick={() => {
                setCustomStatus('Comida & Afazeres')
                setUserStatus('away')
              }}
            >
              <div className="left">
                <span>🍔 Comida & Afazeres</span>
              </div>
              <span className="duration">1 hora</span>
            </div>

            <div
              className="item"
              onClick={() => {
                setCustomStatus('Já Volto')
                setUserStatus('away')
              }}
            >
              <div className="left">
                <span>🏃 Já Volto</span>
              </div>
              <span className="duration">15 min</span>
            </div>

            <div
              className="item"
              onClick={() => {
                setCustomStatus('Trabalho Concentrado')
                setUserStatus('busy')
              }}
            >
              <div className="left">
                <span>💻 Trabalho Concentrado</span>
              </div>
              <span className="duration">2 horas</span>
            </div>
          </div>

          <div className="bottom-actions">
            <button
              onClick={() => {
                setShowProfileMenu(false)
                alert('Aproxime-se do espelho ou clique no guarda-roupa para trocar o avatar!')
              }}
            >
              <CheckroomRoundedIcon style={{ fontSize: 16 }} />
              Guarda-Roupa & Avatar
            </button>
            <button className="logout" onClick={handleLogout}>
              <ExitToAppRoundedIcon style={{ fontSize: 16 }} />
              Sair do Escritório
            </button>
          </div>
        </UserProfileModal>
      )}
    </SidebarWrapper>
  )
}

export default SoWorkSidebar

