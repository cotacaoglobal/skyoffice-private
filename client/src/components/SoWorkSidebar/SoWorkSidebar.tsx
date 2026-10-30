import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import Tooltip from '@mui/material/Tooltip'
import Avatar from '@mui/material/Avatar'

// Ícones WorkOffice
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
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded'
import CircleIcon from '@mui/icons-material/Circle'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import HeadphonesRoundedIcon from '@mui/icons-material/HeadphonesRounded'
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded'
import ExitToAppRoundedIcon from '@mui/icons-material/ExitToAppRounded'
import CheckroomRoundedIcon from '@mui/icons-material/CheckroomRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded'
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined'
import DynamicFeedOutlinedIcon from '@mui/icons-material/DynamicFeedOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined'
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded'
import TagRoundedIcon from '@mui/icons-material/TagRounded'
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded'
import InsertEmoticonRoundedIcon from '@mui/icons-material/InsertEmoticonRounded'
import AlternateEmailRoundedIcon from '@mui/icons-material/AlternateEmailRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'

import { useAppSelector, useAppDispatch } from '../../hooks'
import { setLoggedIn } from '../../stores/UserStore'
import { setRoomJoined } from '../../stores/RoomStore'
import { openPrivateChat, setActiveTab, setFocused, pushPrivateMessage } from '../../stores/ChatStore'
import { phaserEvents } from '../../events/EventCenter'
import phaserGame from '../../PhaserGame'
import Game from '../../scenes/Game'

// Avatares
import Adam from '../../images/login/Adam_login.png'
import Ash from '../../images/login/Ash_login.png'
import Lucy from '../../images/login/Lucy_login.png'
import Nancy from '../../images/login/Nancy_login.png'


// SVGs Oficiais para Google Calendar e Outlook
const GoogleCalendarIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#ffffff" />
    <path d="M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4Z" fill="#4285F4"/>
    <path d="M19 20H5V9H19V20Z" fill="#FFFFFF"/>
    <path d="M18 2H16V5H18V2Z" fill="#1967D2"/>
    <path d="M8 2H6V5H8V2Z" fill="#1967D2"/>
    <path d="M4.5 4H19.5V8H4.5V4Z" fill="#EA4335" />
    <path d="M19 8H20.5V20C20.5 20.8 19.8 21.5 19 21.5H18V8H19Z" fill="#34A853" />
    <path d="M3.5 20C3.5 20.8 4.2 21.5 5 21.5H19V20H5V9H3.5V20Z" fill="#FBBC04" />
    <text x="12" y="17.5" textAnchor="middle" fontSize="9.5" fontWeight="900" fill="#1A73E8" fontFamily="Arial, sans-serif">31</text>
  </svg>
)

const OutlookCalendarIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#ffffff"/>
    <path d="M14 6L21 8.5V17.5L14 20V6Z" fill="#0078D4"/>
    <path d="M14 9H20V15H14V9Z" fill="#0078D4"/>
    <path d="M20 15L14 18V15H20Z" fill="#004C87"/>
    <path d="M20 18L14 15V18H20Z" fill="#106EBE"/>
    <path d="M3 7H14V19H3V7Z" fill="#0078D4"/>
    <circle cx="8.5" cy="13" r="3.5" fill="#004C87"/>
    <circle cx="8.5" cy="13" r="2" fill="#FFFFFF"/>
    <path d="M8.5 11C7.4 11 6.5 11.9 6.5 13C6.5 14.1 7.4 15 8.5 15C9.6 15 10.5 14.1 10.5 13C10.5 11.9 9.6 11 8.5 11ZM8.5 14C7.9 14 7.5 13.6 7.5 13C7.5 12.4 7.9 12 8.5 12C9.1 12 9.5 12.4 9.5 13C9.5 13.6 9.1 14 8.5 14Z" fill="#0078D4"/>
  </svg>
)

const avatarMap: Record<string, string> = {
  adam: Adam,
  ash: Ash,
  lucy: Lucy,
  nancy: Nancy,
}

export type SidebarTab = 'home' | 'chat' | 'calendar' | 'meetings' | 'departments' | null

// Container Global do Dock + Painel
const SidebarWrapper = styled.div<{ $hasOpenPanel?: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  display: flex;
  z-index: ${({ $hasOpenPanel }) => ($hasOpenPanel ? 10005 : 9999)};
  pointer-events: none;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  & > * {
    pointer-events: auto;
  }
`

// 1. DOCK VERTICAL FIXO (~64px)
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

// Ícone "W" isolado no Dock vertical
const LogoBadge = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.15);
  border: 1px solid #e2e8f0;
  margin-bottom: 8px;
  cursor: pointer;
  overflow: hidden;
  padding: 3px;
  box-sizing: border-box;
  transition: transform 0.15s ease;

  &:hover {
    transform: scale(1.05);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
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

// 2. PAINEL EXPANSÍVEL LATERAL (Normal ~340px / Tela Cheia ~calc(100vw - 64px) quando Chat)
const FlyoutPanel = styled.div<{ $open: boolean; $fullScreen?: boolean }>`
  width: ${({ $fullScreen }) => ($fullScreen ? 'calc(100vw - 64px)' : '340px')};
  height: 100%;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  box-shadow: 8px 0 24px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  transform: ${({ $open }) => ($open ? 'translateX(0)' : 'translateX(-100%)')};
  transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);
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
  min-height: 48px;

  .title-group {
    display: flex;
    align-items: center;
    gap: 12px;
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

// CARDS DA ABA HOME
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

// POPOVER DO USUÁRIO
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

// 3. ESTRUTURA COMPLETA DE TELA CHEIA PARA O CHAT (IMAGEM 1 & 2)
const FullChatContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  background: #ffffff;
  overflow: hidden;
`

const ChatSidebarNav = styled.div<{ $hideOnMobile?: boolean }>`
  width: 260px;
  min-width: 260px;
  height: 100%;
  background: #fafbfc;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  @media (max-width: 768px) {
    width: 100%;
    min-width: 100%;
    border-right: none;
    display: ${({ $hideOnMobile }) => ($hideOnMobile ? 'none' : 'flex')};
  }
`

const ChatNavHeader = styled.div`
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f1f5f9;

  .brand {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
  }

  .mobile-close-btn {
    display: none;
    border: none;
    background: transparent;
    color: #64748b;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;

    @media (max-width: 768px) {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
  }
`

const ChatNavSearch = styled.div`
  padding: 8px 16px;
  input {
    width: 100%;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 12px;
    outline: none;
    box-sizing: border-box;
    &:focus {
      border-color: #5865f2;
    }
  }
`

const ChatNavSection = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  .group-title {
    font-size: 11px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 4px 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    color: #475569;
    transition: all 0.12s ease;

    &:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    &.active {
      background: #5865f2;
      color: #ffffff;
      font-weight: 600;

      svg {
        color: #ffffff !important;
      }
    }

    .avatar-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      object-fit: cover;
    }

    .badge-unread {
      margin-left: auto;
      background: #ef4444;
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 9999px;
    }
  }
`

const ChatMainArea = styled.div<{ $hideOnMobile?: boolean }>`
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;

  @media (max-width: 768px) {
    width: 100%;
    min-width: 0;
    display: ${({ $hideOnMobile }) => ($hideOnMobile ? 'none' : 'flex')};
  }
`

const ChatTopBar = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  min-height: 52px;
  box-sizing: border-box;

  .recipient-box {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    overflow: hidden;

    .mobile-back-btn {
      display: none;
      align-items: center;
      gap: 4px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      color: #2563eb;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 10px;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;

      &:hover {
        background: #dbeafe;
      }

      @media (max-width: 768px) {
        display: flex;
      }
    }

    .title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 8px;

    button {
      background: transparent;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: #f1f5f9;
        color: #0f172a;
      }
    }
  }
`

const ChatMessagesList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  background: #ffffff;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
`

const MessageBubbleRow = styled.div<{ $isSelf?: boolean }>`
  display: flex;
  gap: 12px;
  align-items: flex-start;

  .user-pic {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    background: #e2e8f0;
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 80%;

    .name-time {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;

      .time {
        font-size: 11px;
        font-weight: normal;
        color: #94a3b8;
      }
    }

    .bubble-text {
      font-size: 14px;
      color: #334155;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }
  }
`


const EmojiPickerCard = styled.div`
  position: absolute;
  bottom: 75px;
  left: 20px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  z-index: 10005;
  width: 240px;

  button {
    background: transparent;
    border: none;
    font-size: 20px;
    cursor: pointer;
    padding: 6px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.1s;

    &:hover {
      background: #f1f5f9;
      transform: scale(1.15);
    }
  }
`

const MentionPickerCard = styled.div`
  position: absolute;
  bottom: 75px;
  left: 50px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
  padding: 6px 0;
  display: flex;
  flex-direction: column;
  z-index: 10005;
  width: 210px;
  max-height: 200px;
  overflow-y: auto;

  .header {
    font-size: 11px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    padding: 4px 12px 6px 12px;
    border-bottom: 1px solid #f1f5f9;
  }

  .item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 500;
    color: #334155;
    cursor: pointer;
    transition: background 0.1s;

    &:hover {
      background: #eff6ff;
      color: #2563eb;
    }
  }
`

const AttachMenuCard = styled.div`
  position: absolute;
  bottom: 75px;
  left: 10px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
  padding: 6px 0;
  display: flex;
  flex-direction: column;
  z-index: 10005;
  width: 200px;

  .menu-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 14px;
    font-size: 13px;
    font-weight: 500;
    color: #334155;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    width: 100%;

    &:hover {
      background: #eff6ff;
      color: #2563eb;
    }
  }
`

const ChatFooterEditor = styled.div`
  position: relative;
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
  background: #ffffff;

  .editor-card {
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #ffffff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);

    &:focus-within {
      border-color: #5865f2;
      box-shadow: 0 0 0 2px rgba(88, 101, 242, 0.2);
    }

    textarea {
      border: none;
      outline: none;
      resize: none;
      padding: 12px 16px;
      font-size: 14px;
      font-family: inherit;
      color: #0f172a;
      min-height: 52px;
      line-height: 1.4;

      &::placeholder {
        color: #94a3b8;
      }
    }

    .toolbar {
      padding: 6px 12px;
      background: #fafbfc;
      border-top: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .tools-left {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #64748b;

        button {
          background: transparent;
          border: none;
          color: inherit;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;

          &:hover {
            color: #0f172a;
            background: #e2e8f0;
          }
        }
      }

      .send-btn {
        background: #5865f2;
        color: #ffffff;
        border: none;
        border-radius: 8px;
        padding: 6px 14px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: background 0.15s ease;

        &:hover {
          background: #4752c4;
        }

        &:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
        }
      }
    }
  }
`

interface WorkOfficeSidebarProps {
  onOpenMeetingHistory?: () => void
  onOpenDepartments?: () => void
}

export const WorkOfficeSidebar: React.FC<WorkOfficeSidebarProps> = ({
  onOpenMeetingHistory,
  onOpenDepartments,
}) => {
  const dispatch = useAppDispatch()
  const roomName = useAppSelector((state) => state.room.roomName)

  // Estado da aba selecionada no Dock
  const [activeTabState, setDockTab] = useState<SidebarTab>('home')
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

  // Sub-abas do Chat Corporativo Tela Cheia (general | activities | support | playerId)
  const [chatCurrentSection, setChatCurrentSection] = useState<string>('general')
  const [mobileChatView, setMobileChatView] = useState<'list' | 'conversation'>('conversation')
  const chatMessages = useAppSelector((state) => state.chat.chatMessages)
  const privateChats = useAppSelector((state) => state.chat.privateChats)
  const [chatInput, setChatInput] = useState<string>('')

  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false)
  const [showMentionPicker, setShowMentionPicker] = useState<boolean>(false)
  const [showAttachMenu, setShowAttachMenu] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const emojisList = ['😀', '😂', '😍', '🎉', '👍', '👏', '🚀', '🔥', '👀', '❤️', '💼', '✅', '🤝', '☕', '💡', '✨', '🙌', '💯']

  const handleSelectEmoji = (emoji: string) => {
    setChatInput((prev) => prev + emoji)
    setShowEmojiPicker(false)
    textareaRef.current?.focus()
  }

  const handleSelectMention = (name: string) => {
    setChatInput((prev) => {
      const spacer = prev.length > 0 && !prev.endsWith(' ') ? ' ' : ''
      return prev + spacer + '@' + name + ' '
    })
    setShowMentionPicker(false)
    textareaRef.current?.focus()
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setChatInput((prev) => prev + (prev.length > 0 ? '\n' : '') + '📎 [Arquivo: ' + file.name + ']')
      setShowAttachMenu(false)
      textareaRef.current?.focus()
    }
  }

  const handleInsertLink = () => {
    const url = prompt('Digite o link que deseja compartilhar:', 'https://')
    if (url && url !== 'https://') {
      setChatInput((prev) => prev + (prev.length > 0 ? ' ' : '') + url)
    }
    setShowAttachMenu(false)
    textareaRef.current?.focus()
  }


  // Suporte WorkOffice integrado localmente
  const [supportMessages, setSupportMessages] = useState<Array<{ author: string; content: string; time: string }>>([
    {
      author: 'Suporte WorkOffice',
      content: 'Olá! Bem-vindo ao WorkOffice. Precisa de ajuda com o escritório virtual, atas de reuniões ou salas?',
      time: '10:00 AM',
    },
  ])

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

    if (activeTabState === tab && isPanelOpen) {
      setIsPanelOpen(false)
    } else {
      setDockTab(tab)
      setIsPanelOpen(true)
    }
  }

  // Envio de mensagem
  const handleSendChatMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!chatInput.trim()) return

    const val = chatInput.trim()
    const game = phaserGame?.scene?.keys?.game as Game

    if (chatCurrentSection === 'general') {
      // Chat público geral
      if (game && game.network) {
        game.network.addChatMessage(val)
      }
    } else if (chatCurrentSection === 'support') {
      // Suporte WorkOffice
      setSupportMessages((prev) => [
        ...prev,
        { author: myPlayerInfo.name, content: val, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        { author: 'Suporte WorkOffice', content: 'Recebemos sua mensagem! Nossa equipe ou a IA de suporte responderá em instantes.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ])
    } else {
      // Mensagem Direta (DM com membro específico)
      const targetMember = otherPlayers.find((p) => p.id === chatCurrentSection)
      const targetName = targetMember?.name || 'Colega'

      if (game && game.network) {
        game.network.addChatMessage(val, chatCurrentSection, targetName)
      }

      dispatch(
        pushPrivateMessage({
          partnerId: chatCurrentSection,
          partnerName: targetName,
          author: myPlayerInfo.name,
          content: val,
          createdAt: Date.now(),
          isSelf: true,
        })
      )
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

  // Membro atual da DM selecionada
  const activeChatPartner = otherPlayers.find((p) => p.id === chatCurrentSection)

  return (
    <SidebarWrapper $hasOpenPanel={isPanelOpen}>
      {/* 1. DOCK VERTICAL FIXO (~64px) */}
      <VerticalDock>
        <DockTop>
          {/* Logo "W" isolada no Dock */}
          <Tooltip title="WorkOffice Escritório" placement="right">
            <LogoBadge onClick={() => handleTabClick('home')}>
              <img src="/assets/workoffice-icon.jpg" alt="WorkOffice" />
            </LogoBadge>
          </Tooltip>

          <NavButtonGroup>
            <Tooltip title="Equipes & Reuniões" placement="right">
              <NavIconButton
                $active={isPanelOpen && activeTabState === 'home'}
                onClick={() => handleTabClick('home')}
              >
                {isPanelOpen && activeTabState === 'home' ? <HomeIcon /> : <HomeOutlinedIcon />}
              </NavIconButton>
            </Tooltip>

            <Tooltip title="Chat & Mensagens" placement="right">
              <NavIconButton
                $active={isPanelOpen && activeTabState === 'chat'}
                onClick={() => handleTabClick('chat')}
              >
                {isPanelOpen && activeTabState === 'chat' ? (
                  <ChatBubbleRoundedIcon />
                ) : (
                  <ChatBubbleOutlineRoundedIcon />
                )}
              </NavIconButton>
            </Tooltip>

            <Tooltip title="Calendário & Agenda" placement="right">
              <NavIconButton
                $active={isPanelOpen && activeTabState === 'calendar'}
                onClick={() => handleTabClick('calendar')}
              >
                {isPanelOpen && activeTabState === 'calendar' ? (
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

      {/* 2. PAINEL EXPANSÍVEL (Largura normal ou Tela Cheia no Chat) */}
      <FlyoutPanel $open={isPanelOpen} $fullScreen={activeTabState === 'chat'}>
        {/* CONTEÚDO: HOME / EQUIPES */}
        {activeTabState === 'home' && (
          <>
            <PanelHeader>
              <div className="title-group">
                <img
                  src="/assets/workoffice-logo.jpg"
                  alt="WorkOffice"
                  style={{ height: '65px', width: 'auto', objectFit: 'contain' }}
                />
                <span style={{ fontSize: '16px', color: '#475569', fontWeight: 700 }}>• {roomName || 'Pink Aplly'}</span>
              </div>
              <button className="close-icon-btn" onClick={() => setIsPanelOpen(false)}>
                <CloseRoundedIcon fontSize="small" />
              </button>
            </PanelHeader>

            <PanelBody>
              {/* Card de Convidar Colegas */}
              <InviteCard>
                <div className="headline">WorkOffice é melhor com colegas de equipe!</div>
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
                    <span className="badge">Escritório WorkOffice</span>
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
                      setChatCurrentSection(player.id)
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

        {/* CONTEÚDO: CHAT CORPORATIVO EM TELA CHEIA (IMAGEM 1 & 2) */}
        {activeTabState === 'chat' && (
          <FullChatContainer>
            {/* SIDEBAR INTERNO DO CHAT */}
            <ChatSidebarNav $hideOnMobile={mobileChatView === 'conversation'}>
              <ChatNavHeader>
                <div className="brand">{roomName || 'WorkOffice'}</div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <EditOutlinedIcon style={{ fontSize: 20, color: '#64748b', cursor: 'pointer' }} />
                  <button className="mobile-close-btn" onClick={() => setIsPanelOpen(false)} title="Fechar Chat">
                    <CloseRoundedIcon fontSize="small" />
                  </button>
                </div>
              </ChatNavHeader>

              <ChatNavSearch>
                <input type="text" placeholder={`Pesquisar ${roomName || 'WorkOffice'}...`} />
              </ChatNavSearch>

              <ChatNavSection>
                {/* Menus Principais de Comunicação */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div
                    className={`nav-item ${chatCurrentSection === 'activities' ? 'active' : ''}`}
                    onClick={() => { setChatCurrentSection('activities'); setMobileChatView('conversation'); }}
                  >
                    <DynamicFeedOutlinedIcon style={{ fontSize: 18, color: '#64748b' }} />
                    <span>Atividade</span>
                  </div>
                  <div
                    className={`nav-item ${chatCurrentSection === 'general' ? 'active' : ''}`}
                    onClick={() => { setChatCurrentSection('general'); setMobileChatView('conversation'); }}
                  >
                    <TagRoundedIcon style={{ fontSize: 18, color: '#64748b' }} />
                    <span>Chat da Reunião</span>
                  </div>
                </div>

                {/* Seção Canais */}
                <div>
                  <div className="group-title">
                    <span># Canais</span>
                  </div>
                  <div
                    className={`nav-item ${chatCurrentSection === 'general' ? 'active' : ''}`}
                    onClick={() => { setChatCurrentSection('general'); setMobileChatView('conversation'); }}
                  >
                    <TagRoundedIcon style={{ fontSize: 16 }} />
                    <span>general</span>
                  </div>
                </div>

                {/* Seção Mensagens Diretas com Membros do Escritório */}
                <div>
                  <div className="group-title">
                    <span>Mensagens Diretas</span>
                    <AddRoundedIcon style={{ fontSize: 16, cursor: 'pointer' }} />
                  </div>

                  {otherPlayers.length === 0 ? (
                    <div style={{ fontSize: '11px', color: '#94a3b8', padding: '6px 8px' }}>
                      Nenhum outro membro online no momento.
                    </div>
                  ) : (
                    otherPlayers.map((player) => (
                      <div
                        key={player.id}
                        className={`nav-item ${chatCurrentSection === player.id ? 'active' : ''}`}
                        onClick={() => { setChatCurrentSection(player.id); setMobileChatView('conversation'); }}
                      >
                        <img
                          src={avatarMap[player.avatar] || Adam}
                          alt={player.name}
                          className="avatar-icon"
                        />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {player.name}
                        </span>
                        {privateChats[player.id]?.unreadCount > 0 && (
                          <span className="badge-unread">
                            {privateChats[player.id].unreadCount}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Seção Suporte WorkOffice */}
                <div>
                  <div className="group-title">
                    <span>Mensagens de Suporte</span>
                  </div>
                  <div
                    className={`nav-item ${chatCurrentSection === 'support' ? 'active' : ''}`}
                    onClick={() => { setChatCurrentSection('support'); setMobileChatView('conversation'); }}
                  >
                    <SupportAgentRoundedIcon style={{ fontSize: 18, color: '#5865F2' }} />
                    <span>Suporte WorkOffice</span>
                  </div>
                </div>
              </ChatNavSection>
            </ChatSidebarNav>

            {/* ÁREA PRINCIPAL DO CHAT */}
            <ChatMainArea $hideOnMobile={mobileChatView === 'list'}>
              {/* Barra do Topo da Conversa */}
              <ChatTopBar>
                <div className="recipient-box">
                  <button
                    className="mobile-back-btn"
                    onClick={() => setMobileChatView('list')}
                    title="Ver lista de canais e membros"
                  >
                    <ArrowBackIcon style={{ fontSize: 16 }} />
                    <span>Canais</span>
                  </button>
                  {chatCurrentSection === 'general' ? (
                    <div className="title">
                      <TagRoundedIcon style={{ color: '#5865F2' }} />
                      <span>general (Chat do Escritório)</span>
                    </div>
                  ) : chatCurrentSection === 'activities' ? (
                    <div className="title">
                      <DynamicFeedOutlinedIcon style={{ color: '#5865F2' }} />
                      <span>Feed de Atividades</span>
                    </div>
                  ) : chatCurrentSection === 'support' ? (
                    <div className="title">
                      <SupportAgentRoundedIcon style={{ color: '#5865F2' }} />
                      <span>Suporte Oficial WorkOffice</span>
                    </div>
                  ) : (
                    <div className="title">
                      <img
                        src={avatarMap[activeChatPartner?.avatar || 'adam'] || Adam}
                        alt="Avatar"
                        style={{ width: 28, height: 28, borderRadius: '50%' }}
                      />
                      <span>{activeChatPartner?.name || 'Mensagem Direta'}</span>
                      <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 'normal' }}>● Online</span>
                    </div>
                  )}
                </div>

                <div className="actions">
                  <button onClick={() => setIsPanelOpen(false)} title="Fechar Chat">
                    <CloseRoundedIcon fontSize="small" />
                  </button>
                </div>
              </ChatTopBar>

              {/* Lista de Mensagens */}
              <ChatMessagesList>
                {/* 1. MODO GERAL */}
                {chatCurrentSection === 'general' && (
                  chatMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '60px' }}>
                      <TagRoundedIcon style={{ fontSize: 48, color: '#cbd5e1' }} />
                      <div style={{ marginTop: '8px', fontWeight: 600 }}>Início do canal #general</div>
                      <div style={{ fontSize: '13px' }}>Todas as mensagens públicas do escritório aparecem aqui.</div>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <MessageBubbleRow key={idx}>
                        <img src={Adam} alt="Avatar" className="user-pic" />
                        <div className="body">
                          <div className="name-time">
                            <span>{msg.chatMessage?.author || 'Colega'}</span>
                            <span className="time">
                              {new Date(msg.chatMessage?.createdAt || Date.now()).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="bubble-text">{msg.chatMessage?.content}</div>
                        </div>
                      </MessageBubbleRow>
                    ))
                  )
                )}

                {/* 2. MODO ATIVIDADES (IMAGEM 2) */}
                {chatCurrentSection === 'activities' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                      Atividades Recentes no Escritório
                    </div>
                    {chatMessages.slice(-5).map((msg, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={Adam} alt="avatar" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                          <div>
                            <span style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{msg.chatMessage?.author}</span>
                            <div style={{ fontSize: '12px', color: '#475569' }}>{msg.chatMessage?.content}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Mensagem no escritório</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. MODO SUPORTE */}
                {chatCurrentSection === 'support' && (
                  supportMessages.map((msg, idx) => (
                    <MessageBubbleRow key={idx}>
                      <SupportAgentRoundedIcon style={{ fontSize: 36, color: '#5865F2' }} />
                      <div className="body">
                        <div className="name-time">
                          <span>{msg.author}</span>
                          <span className="time">{msg.time}</span>
                        </div>
                        <div className="bubble-text">{msg.content}</div>
                      </div>
                    </MessageBubbleRow>
                  ))
                )}

                {/* 4. MODO MENSAGEM DIRETA (DM) */}
                {chatCurrentSection !== 'general' && chatCurrentSection !== 'activities' && chatCurrentSection !== 'support' && (
                  privateChats[chatCurrentSection]?.messages?.length ? (
                    privateChats[chatCurrentSection].messages.map((pm, idx) => (
                      <MessageBubbleRow key={idx}>
                        <img
                          src={pm.isSelf ? (avatarMap[myPlayerInfo.avatar] || Adam) : (avatarMap[activeChatPartner?.avatar || 'adam'] || Adam)}
                          alt="Avatar"
                          className="user-pic"
                        />
                        <div className="body">
                          <div className="name-time">
                            <span>{pm.author}</span>
                            <span className="time">
                              {new Date(pm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="bubble-text">{pm.content}</div>
                        </div>
                      </MessageBubbleRow>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '60px' }}>
                      <LockRoundedIcon style={{ fontSize: 44, color: '#cbd5e1' }} />
                      <div style={{ marginTop: '8px', fontWeight: 600 }}>Conversa privada com {activeChatPartner?.name}</div>
                      <div style={{ fontSize: '13px' }}>As mensagens trocadas aqui são visíveis apenas entre vocês dois.</div>
                    </div>
                  )
                )}
              </ChatMessagesList>

              {/* Editor Inferior (com barra de ferramentas SoWork) */}
              {chatCurrentSection !== 'activities' && (
                <ChatFooterEditor>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />

                  {showEmojiPicker && (
                    <EmojiPickerCard>
                      {emojisList.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleSelectEmoji(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </EmojiPickerCard>
                  )}

                  {showMentionPicker && (
                    <MentionPickerCard>
                      <div className="header">Mencionar no chat</div>
                      <div className="item" onClick={() => handleSelectMention('todos')}>
                        <span>📢 @todos</span>
                      </div>
                      <div className="item" onClick={() => handleSelectMention('aqui')}>
                        <span>🟢 @aqui</span>
                      </div>
                      {otherPlayers.map((p) => (
                        <div key={p.id} className="item" onClick={() => handleSelectMention(p.name)}>
                          <span>👤 @{p.name}</span>
                        </div>
                      ))}
                    </MentionPickerCard>
                  )}

                  {showAttachMenu && (
                    <AttachMenuCard>
                      <button
                        type="button"
                        className="menu-btn"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <span>📎 Anexar arquivo</span>
                      </button>
                      <button
                        type="button"
                        className="menu-btn"
                        onClick={handleInsertLink}
                      >
                        <span>🔗 Compartilhar link</span>
                      </button>
                    </AttachMenuCard>
                  )}

                  <div className="editor-card">
                    <textarea
                      ref={textareaRef}
                      placeholder={`Mensagem para ${
                        chatCurrentSection === 'general'
                          ? '#general'
                          : chatCurrentSection === 'support'
                          ? 'Suporte WorkOffice'
                          : activeChatPartner?.name || 'Colega'
                      }...`}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onFocus={() => dispatch(setFocused(true))}
                      onBlur={() => dispatch(setFocused(false))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          setShowEmojiPicker(false)
                          setShowMentionPicker(false)
                          setShowAttachMenu(false)
                          handleSendChatMessage()
                        }
                      }}
                    />
                    <div className="toolbar">
                      <div className="tools-left">
                        <button
                          type="button"
                          title="Adicionar arquivo / link"
                          onClick={() => {
                            setShowAttachMenu(!showAttachMenu)
                            setShowEmojiPicker(false)
                            setShowMentionPicker(false)
                          }}
                        >
                          <AddRoundedIcon fontSize="small" />
                        </button>
                        <button
                          type="button"
                          title="Inserir emoji"
                          onClick={() => {
                            setShowEmojiPicker(!showEmojiPicker)
                            setShowAttachMenu(false)
                            setShowMentionPicker(false)
                          }}
                        >
                          <InsertEmoticonRoundedIcon fontSize="small" />
                        </button>
                        <button
                          type="button"
                          title="Mencionar pessoa"
                          onClick={() => {
                            setShowMentionPicker(!showMentionPicker)
                            setShowAttachMenu(false)
                            setShowEmojiPicker(false)
                          }}
                        >
                          <AlternateEmailRoundedIcon fontSize="small" />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="send-btn"
                        disabled={!chatInput.trim()}
                        onClick={() => {
                          setShowEmojiPicker(false)
                          setShowMentionPicker(false)
                          setShowAttachMenu(false)
                          handleSendChatMessage()
                        }}
                      >
                        <SendRoundedIcon style={{ fontSize: 14 }} />
                        Enviar
                      </button>
                    </div>
                  </div>
                </ChatFooterEditor>
              )}
            </ChatMainArea>
          </FullChatContainer>
        )}

        {/* CONTEÚDO: CALENDÁRIO */}
        {activeTabState === 'calendar' && (
          <>
            <PanelHeader>
              <div className="title-group">
                <CalendarMonthRoundedIcon style={{ color: '#5865F2', fontSize: 22 }} />
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
                    <img src="/assets/Calendar.svg" alt="Google Calendar" style={{ width: 24, height: 24, objectFit: 'contain' }} /> <span>Vincular Google Calendar</span>
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
                    <img src="/assets/Outlook.svg.webp" alt="Outlook Calendar" style={{ width: 24, height: 24, objectFit: 'contain' }} /> <span>Conectar Calendário Outlook</span>
                  </button>
                </div>
              </div>
            </PanelBody>
          </>
        )}
      </FlyoutPanel>

      {/* 3. POPOVER DE PERFIL E STATUS */}
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

export default WorkOfficeSidebar
