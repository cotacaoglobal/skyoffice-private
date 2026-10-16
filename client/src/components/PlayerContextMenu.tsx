import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import ChatIcon from '@mui/icons-material/Chat'
import CloseIcon from '@mui/icons-material/Close'
import PersonIcon from '@mui/icons-material/Person'
import { phaserEvents } from '../events/EventCenter'
import { useAppDispatch } from '../hooks'
import { openPrivateChat } from '../stores/ChatStore'

interface ContextMenuData {
  playerId: string
  playerName: string
  x: number
  y: number
}

const MenuOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 100000;
  pointer-events: auto;
`

const MenuContainer = styled.div<{ $x: number; $y: number }>`
  position: fixed;
  top: ${({ $y }) => $y}px;
  left: ${({ $x }) => $x}px;
  background: #171821;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
  padding: 6px;
  min-width: 220px;
  z-index: 100001;
  animation: fadeIn 0.12s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 4px;

  .avatar-icon {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #00ebc7;
    color: #171821;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .name {
    font-size: 13px;
    font-weight: 700;
    color: #f8fafc;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const MenuItem = styled.button`
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  padding: 8px 10px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: all 0.12s ease;

  &:hover {
    background: rgba(0, 235, 199, 0.15);
    color: #00ebc7;
  }

  &:active {
    transform: scale(0.98);
  }
`

export default function PlayerContextMenu() {
  const dispatch = useAppDispatch()
  const [menu, setMenu] = useState<ContextMenuData | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleContextMenu = (data: {
      playerId: string
      playerName: string
      clientX: number
      clientY: number
    }) => {
      // Ajusta para não vazar das bordas da tela
      const x = Math.min(data.clientX, window.innerWidth - 240)
      const y = Math.min(data.clientY, window.innerHeight - 150)
      setMenu({
        playerId: data.playerId,
        playerName: data.playerName,
        x,
        y,
      })
    }

    phaserEvents.on('PLAYER_CONTEXT_MENU', handleContextMenu)
    return () => {
      phaserEvents.off('PLAYER_CONTEXT_MENU', handleContextMenu)
    }
  }, [])

  if (!menu) return null

  const handleStartPrivateChat = () => {
    dispatch(
      openPrivateChat({
        playerId: menu.playerId,
        playerName: menu.playerName,
      })
    )
    setMenu(null)
  }

  return (
    <MenuOverlay onClick={() => setMenu(null)} onContextMenu={(e) => { e.preventDefault(); setMenu(null) }}>
      <MenuContainer
        ref={menuRef}
        $x={menu.x}
        $y={menu.y}
        onClick={(e) => e.stopPropagation()}
      >
        <Header>
          <div className="avatar-icon">
            <PersonIcon style={{ fontSize: 16 }} />
          </div>
          <div className="name">{menu.playerName}</div>
        </Header>
        <MenuItem onClick={handleStartPrivateChat}>
          <ChatIcon style={{ fontSize: 18, color: '#00ebc7' }} />
          <span>Conversar no Privado</span>
        </MenuItem>
      </MenuContainer>
    </MenuOverlay>
  )
}
