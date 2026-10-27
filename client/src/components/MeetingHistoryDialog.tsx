import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SearchIcon from '@mui/icons-material/Search'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DownloadIcon from '@mui/icons-material/Download'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined'
import VideoLibraryOutlinedIcon from '@mui/icons-material/VideoLibraryOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined'
import CheckIcon from '@mui/icons-material/Check'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import FlagIcon from '@mui/icons-material/Flag'
import TimelineIcon from '@mui/icons-material/Timeline'
import TravelExploreIcon from '@mui/icons-material/TravelExplore'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import SendIcon from '@mui/icons-material/Send'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

import { MeetingRecord, MeetingStorage, Commitment, MEETINGS_UPDATED_EVENT } from '../services/MeetingStorage'
import { VideoStorageService } from '../services/VideoStorageService'
import { SemanticSearchService, SearchMatch } from '../services/SemanticSearchService'
import { BiaChatService, ChatMessage } from '../services/BiaChatService'
import { GeminiMeetingService } from '../services/GeminiMeetingService'

// Tela Inteira (Full Page) com visual limpo, moderno e claro
const FullPageContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #f8fafc;
  z-index: 10005;
  display: flex;
  flex-direction: column;
  color: #1e293b;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  overflow: hidden;
`

const TopHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 28px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .brand-area {
    display: flex;
    align-items: center;
    gap: 14px;

    .icon-wrapper {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #eff6ff;
      color: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.02em;
    }

    p {
      margin: 2px 0 0 0;
      font-size: 13px;
      color: #64748b;
    }
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
`

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);

  &:hover {
    background: #1d4ed8;
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.35);
  }

  &:active {
    transform: translateY(0);
  }
`

const NavigationBar = styled.nav`
  display: flex;
  gap: 8px;
  padding: 8px 28px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
`

const NavTab = styled.button<{ $active: boolean }>`
  background: ${({ $active }) => ($active ? '#eff6ff' : 'transparent')};
  border: 1px solid ${({ $active }) => ($active ? '#bfdbfe' : 'transparent')};
  color: ${({ $active }) => ($active ? '#1d4ed8' : '#64748b')};
  font-size: 14px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.15s ease;

  &:hover {
    background: #f1f5f9;
    color: #0f172a;
  }
`

const MainLayout = styled.main`
  flex: 1;
  display: flex;
  overflow: hidden;
  background: #f8fafc;

  @media (max-width: 860px) {
    flex-direction: column;
  }
`

const SideSidebar = styled.aside`
  width: 340px;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;

  @media (max-width: 860px) {
    width: 100%;
    max-height: 220px;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }
`

const SearchBarWrapper = styled.div`
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  position: relative;
  display: flex;
  align-items: center;

  .search-icon {
    position: absolute;
    left: 28px;
    color: #94a3b8;
    font-size: 20px;
  }

  input {
    width: 100%;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 10px 12px 10px 38px;
    color: #0f172a;
    font-size: 13px;
    outline: none;
    transition: all 0.2s;

    &::placeholder {
      color: #94a3b8;
    }

    &:focus {
      background: #ffffff;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
    }
  }
`

const MeetingListItem = styled.div<{ $selected: boolean }>`
  padding: 14px 18px;
  border-bottom: 1px solid #f1f5f9;
  background: ${({ $selected }) => ($selected ? '#f0f7ff' : '#ffffff')};
  border-left: 4px solid ${({ $selected }) => ($selected ? '#2563eb' : 'transparent')};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $selected }) => ($selected ? '#f0f7ff' : '#f8fafc')};
  }

  h4 {
    margin: 0 0 6px 0;
    font-size: 14px;
    font-weight: 600;
    color: ${({ $selected }) => ($selected ? '#1d4ed8' : '#1e293b')};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .meta-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #64748b;
  }
`

const ContentArea = styled.section`
  flex: 1;
  padding: 28px 36px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 22px;
  background: #f8fafc;
`

const DetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
  gap: 20px;

  .title-group {
    h2 {
      margin: 0 0 10px 0;
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.01em;
    }

    .meta-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 13px;
      color: #64748b;

      span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #ffffff;
        padding: 5px 12px;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
      }
    }
  }

  .action-buttons {
    display: flex;
    gap: 10px;
  }
`

const CleanButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  outline: none;

  ${({ $variant }) =>
    $variant === 'secondary'
      ? `
    background: #ffffff;
    border: 1px solid #cbd5e1;
    color: #334155;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

    &:hover {
      background: #f8fafc;
      border-color: #94a3b8;
      color: #0f172a;
    }
  `
      : `
    background: #2563eb;
    border: 1px solid #1d4ed8;
    color: #ffffff;
    box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);

    &:hover {
      background: #1d4ed8;
    }
  `}
`

const CleanCard = styled.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

  h3 {
    margin: 0 0 14px 0;
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  ul {
    margin: 0;
    padding-left: 20px;
    li {
      margin-bottom: 8px;
      font-size: 14px;
      line-height: 1.6;
      color: #334155;
    }
  }
`

const PulseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);

  .pulse-box {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .pulse-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
    }

    .pulse-value {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
  }
`

const InsightCard = styled.div<{ $type: 'risk' | 'blind_spot' | 'recommendation' }>`
  background: ${({ $type }) =>
    $type === 'risk' ? '#fef2f2' : $type === 'blind_spot' ? '#fffbeb' : '#f0f9ff'};
  border: 1px solid
    ${({ $type }) =>
      $type === 'risk' ? '#fecaca' : $type === 'blind_spot' ? '#fde68a' : '#bae6fd'};
  border-left: 4px solid
    ${({ $type }) =>
      $type === 'risk' ? '#ef4444' : $type === 'blind_spot' ? '#f59e0b' : '#0284c7'};
  border-radius: 8px;
  padding: 14px 18px;
  margin-bottom: 10px;

  .insight-top {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;

    .insight-type-badge {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 4px;
      background: ${({ $type }) =>
        $type === 'risk' ? '#fee2e2' : $type === 'blind_spot' ? '#fef3c7' : '#e0f2fe'};
      color: ${({ $type }) =>
        $type === 'risk' ? '#991b1b' : $type === 'blind_spot' ? '#92400e' : '#0369a1'};
    }

    strong {
      font-size: 14px;
      color: #0f172a;
    }
  }

  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.55;
    color: #334155;
  }
`

const TaskCard = styled.div<{ $done?: boolean }>`
  background: ${({ $done }) => ($done ? '#f0fdf4' : '#ffffff')};
  border: 1px solid ${({ $done }) => ($done ? '#bbf7d0' : '#e2e8f0')};
  border-left: 4px solid ${({ $done }) => ($done ? '#22c55e' : '#3b82f6')};
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transform: translateY(-1px);
  }

  .task-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .task-check {
    color: ${({ $done }) => ($done ? '#22c55e' : '#94a3b8')};
    display: flex;
    align-items: center;
  }

  .task-text {
    font-size: 14px;
    font-weight: 500;
    color: ${({ $done }) => ($done ? '#64748b' : '#1e293b')};
    text-decoration: ${({ $done }) => ($done ? 'line-through' : 'none')};
  }

  .task-badges {
    display: flex;
    gap: 8px;
    align-items: center;

    .assignee-badge {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      color: #1e293b;
      font-size: 12px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 6px;
    }

    .deadline-badge {
      background: #fef3c7;
      border: 1px solid #fde68a;
      color: #92400e;
      font-size: 12px;
      padding: 3px 8px;
      border-radius: 6px;
    }

    .status-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 6px;
      background: ${({ $done }) => ($done ? '#dcfce7' : '#fef9c3')};
      color: ${({ $done }) => ($done ? '#15803d' : '#854d0e')};
    }
  }
`

const ViewSwitcher = styled.div`
  display: flex;
  background: #f1f5f9;
  padding: 3px;
  border-radius: 8px;
  gap: 2px;
  margin-left: auto;

  button {
    border: none;
    background: transparent;
    font-size: 12px;
    font-weight: 600;
    padding: 5px 12px;
    border-radius: 6px;
    cursor: pointer;
    color: #64748b;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.15s ease;

    &.active {
      background: #ffffff;
      color: #1e293b;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }
  }
`

const KanbanContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 14px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const KanbanColumn = styled.div<{ $color: string }>`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-top: 3px solid ${({ $color }) => $color};
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 190px;

  .kanban-column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 700;
    color: #334155;
    padding-bottom: 8px;
    border-bottom: 1px solid #e2e8f0;

    .count-badge {
      font-size: 11px;
      font-weight: 700;
      background: #e2e8f0;
      color: #475569;
      padding: 2px 7px;
      border-radius: 10px;
    }
  }

  .kanban-cards {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }

  .kanban-empty {
    font-size: 12px;
    color: #94a3b8;
    text-align: center;
    padding: 28px 8px;
    font-style: italic;
  }
`

const KanbanItemCard = styled.div`
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.15s ease;

  &:hover {
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
    border-color: #94a3b8;
  }

  .kanban-item-text {
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
    line-height: 1.45;
  }

  .kanban-item-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;

    .assignee {
      font-size: 11px;
      font-weight: 600;
      background: #eff6ff;
      color: #1d4ed8;
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid #dbeafe;
    }

    .deadline {
      font-size: 11px;
      background: #fef3c7;
      color: #92400e;
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid #fde68a;
    }
  }

  .kanban-actions {
    display: flex;
    gap: 6px;
    margin-top: 2px;
    padding-top: 8px;
    border-top: 1px dashed #e2e8f0;

    button {
      flex: 1;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      font-size: 11px;
      font-weight: 600;
      padding: 5px 8px;
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: #f1f5f9;
        border-color: #94a3b8;
      }

      &.advance {
        background: #f0fdf4;
        border-color: #86efac;
        color: #15803d;

        &:hover {
          background: #dcfce7;
        }
      }

      &.done {
        background: #ecfdf5;
        border-color: #a7f3d0;
        color: #065f46;
      }
    }
  }
`

// ====== Commitment Tracking Styles ======

const CommitmentCard = styled.div<{ $done: boolean }>`
  background: ${({ $done }) => ($done ? '#f0fdf4' : '#fffbeb')};
  border: 1px solid ${({ $done }) => ($done ? '#bbf7d0' : '#fde68a')};
  border-left: 4px solid ${({ $done }) => ($done ? '#22c55e' : '#f59e0b')};
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 10px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transform: translateY(-1px);
  }

  .commitment-check {
    flex-shrink: 0;
    margin-top: 2px;
    color: ${({ $done }) => ($done ? '#22c55e' : '#d97706')};
    cursor: pointer;
  }

  .commitment-body {
    flex: 1;
    min-width: 0;

    .commitment-text {
      font-size: 14px;
      font-weight: 500;
      color: ${({ $done }) => ($done ? '#6b7280' : '#1e293b')};
      text-decoration: ${({ $done }) => ($done ? 'line-through' : 'none')};
      line-height: 1.5;
    }

    .commitment-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;

      .meta-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        padding: 3px 8px;
        border-radius: 6px;
        font-weight: 500;
      }

      .person-chip {
        background: #eff6ff;
        color: #1d4ed8;
        border: 1px solid #bfdbfe;
      }

      .deadline-chip {
        background: #fef3c7;
        color: #92400e;
        border: 1px solid #fde68a;
      }

      .timestamp-chip {
        background: #f3e8ff;
        color: #7c3aed;
        border: 1px solid #ddd6fe;
        cursor: pointer;
        transition: all 0.15s;

        &:hover {
          background: #ede9fe;
          transform: scale(1.05);
        }
      }

      .status-chip {
        background: ${({ $done }) => ($done ? '#dcfce7' : '#fff7ed')};
        color: ${({ $done }) => ($done ? '#15803d' : '#c2410c')};
        border: 1px solid ${({ $done }) => ($done ? '#bbf7d0' : '#fed7aa')};
      }
    }
  }
`

// ====== Timeline Styles ======

const TimelineContainer = styled.div`
  position: relative;
  padding-left: 28px;

  &::before {
    content: '';
    position: absolute;
    left: 10px;
    top: 8px;
    bottom: 8px;
    width: 2px;
    background: linear-gradient(to bottom, #e2e8f0, #cbd5e1);
    border-radius: 2px;
  }
`

const TimelineItem = styled.div<{ $type: string }>`
  position: relative;
  padding: 10px 16px;
  margin-bottom: 8px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.15s ease;
  cursor: default;

  &:hover {
    background: #f8fafc;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  }

  &::before {
    content: '';
    position: absolute;
    left: -24px;
    top: 16px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid #ffffff;
    box-shadow: 0 0 0 1px ${({ $type }) => {
      switch ($type) {
        case 'summary': return '#3b82f6'
        case 'decision': return '#8b5cf6'
        case 'commitment': return '#f59e0b'
        default: return '#94a3b8'
      }
    }};
    background: ${({ $type }) => {
      switch ($type) {
        case 'summary': return '#3b82f6'
        case 'decision': return '#8b5cf6'
        case 'commitment': return '#f59e0b'
        default: return '#94a3b8'
      }
    }};
  }

  .timeline-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;

    .timeline-timestamp {
      font-size: 12px;
      font-weight: 700;
      color: #7c3aed;
      background: #f3e8ff;
      padding: 2px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        background: #ede9fe;
        transform: scale(1.05);
      }
    }

    .timeline-speaker {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
    }

    .timeline-type-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      ${({ $type }) => {
        switch ($type) {
          case 'summary':
            return 'background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;'
          case 'decision':
            return 'background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe;'
          case 'commitment':
            return 'background: #fffbeb; color: #b45309; border: 1px solid #fde68a;'
          default:
            return 'background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0;'
        }
      }}
    }
  }

  .timeline-content {
    font-size: 13px;
    color: #334155;
    line-height: 1.5;
  }
`

const TypeLegend = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #64748b;

    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
  }
`

// Componentes da Busca Semântica Global
const SemanticSearchContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const SemanticSearchBox = styled.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 20px 24px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 14px;

  .input-row {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 10px 16px;
    transition: all 0.2s ease;

    &:focus-within {
      border-color: #2563eb;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
    }

    input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 15px;
      color: #0f172a;
      outline: none;

      &::placeholder {
        color: #94a3b8;
      }
    }

    .search-btn {
      background: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s ease;

      &:hover {
        background: #1d4ed8;
      }

      &:disabled {
        background: #94a3b8;
        cursor: not-allowed;
      }
    }
  }

  .quick-queries {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;

    span {
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
    }

    button {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 4px 12px;
      font-size: 12px;
      color: #334155;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: #eff6ff;
        border-color: #bfdbfe;
        color: #1d4ed8;
      }
    }
  }
`

const SearchResultCard = styled.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);

  &:hover {
    border-color: #bfdbfe;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.06);
    transform: translateY(-1px);
  }

  .result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    .meeting-badge {
      display: flex;
      align-items: center;
      gap: 8px;

      h4 {
        margin: 0;
        font-size: 15px;
        font-weight: 700;
        color: #0f172a;
      }

      span.date {
        font-size: 12px;
        color: #64748b;
      }
    }

    .score-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 6px;
      background: #f0fdf4;
      color: #16a34a;
      border: 1px solid #bbf7d0;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .snippet-box {
    background: #f8fafc;
    border-left: 3px solid #2563eb;
    padding: 10px 14px;
    border-radius: 0 8px 8px 0;
    font-size: 14px;
    color: #1e293b;
    line-height: 1.5;

    .type-tag {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 4px;
      display: inline-block;
    }
  }

  .result-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 6px;

    .meta {
      font-size: 12px;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .open-action {
      background: transparent;
      border: none;
      color: #2563eb;
      font-size: 13px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: background 0.15s ease;

      &:hover {
        background: #eff6ff;
      }
    }
  }
`

// Componentes da Interface de Chat da Bia
const BiaChatContainer = styled.div`
  max-width: 860px;
  margin: 0 auto;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  overflow: hidden;
`

const BiaChatHeader = styled.div`
  padding: 16px 24px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .bia-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .avatar {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
    }

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
    }

    p {
      margin: 2px 0 0 0;
      font-size: 12px;
      color: #16a34a;
      display: flex;
      align-items: center;
      gap: 5px;

      &::before {
        content: '';
        display: inline-block;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #16a34a;
      }
    }
  }

  .status-badge {
    font-size: 12px;
    color: #64748b;
    background: #f1f5f9;
    padding: 6px 12px;
    border-radius: 20px;
    font-weight: 500;
  }
`

const BiaChatMessages = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f8fafc;
`

const BiaBubble = styled.div<{ $sender: 'user' | 'bia' }>`
  max-width: 80%;
  align-self: ${({ $sender }) => ($sender === 'user' ? 'flex-end' : 'flex-start')};
  background: ${({ $sender }) => ($sender === 'user' ? '#2563eb' : '#ffffff')};
  color: ${({ $sender }) => ($sender === 'user' ? '#ffffff' : '#1e293b')};
  border: 1px solid ${({ $sender }) => ($sender === 'user' ? '#1d4ed8' : '#e2e8f0')};
  border-radius: ${({ $sender }) => ($sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px')};
  padding: 14px 18px;
  font-size: 14px;
  line-height: 1.6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  white-space: pre-wrap;

  .message-meta {
    margin-top: 6px;
    font-size: 11px;
    color: ${({ $sender }) => ($sender === 'user' ? 'rgba(255, 255, 255, 0.75)' : '#94a3b8')};
    text-align: right;
  }

  .references-box {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid #f1f5f9;
    font-size: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;

    .ref-title {
      font-weight: 600;
      color: #64748b;
    }

    button {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1d4ed8;
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      align-self: flex-start;
      display: inline-flex;
      align-items: center;
      gap: 4px;

      &:hover {
        background: #dbeafe;
      }
    }
  }
`

const BiaInputArea = styled.div`
  padding: 16px 20px;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 10px;

  .quick-suggestions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;

    button {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 4px 12px;
      font-size: 12px;
      color: #334155;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: #eff6ff;
        border-color: #bfdbfe;
        color: #1d4ed8;
      }
    }
  }

  .input-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    padding: 8px 14px;
    transition: all 0.2s ease;

    &:focus-within {
      border-color: #2563eb;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
    }

    input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 14px;
      color: #0f172a;
      outline: none;

      &::placeholder {
        color: #94a3b8;
      }
    }

    button {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #2563eb;
      color: #ffffff;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s ease;

      &:hover {
        background: #1d4ed8;
      }

      &:disabled {
        background: #cbd5e1;
        cursor: not-allowed;
      }
    }
  }
`

interface Props {
  open: boolean
  onClose: () => void
}

export default function MeetingHistoryDialog({ open, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'minutes' | 'bia' | 'search' | 'videos' | 'settings'>('minutes')
  const [meetings, setMeetings] = useState<MeetingRecord[]>([])
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [copyWhatsAppSuccess, setCopyWhatsAppSuccess] = useState(false)
  const [copyEmailSuccess, setCopyEmailSuccess] = useState(false)
  const [isTestingKey, setIsTestingKey] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [taskViewMode, setTaskViewMode] = useState<'kanban' | 'list'>('kanban')
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false)
  const insightsAttemptedRef = useRef<Set<string>>(new Set())

  // Estados do Chat da Bia
  const [biaMessages, setBiaMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bia',
      text: 'Olá! Sou a Bia, sua assistente executiva de atas e reuniões. Posso responder qualquer dúvida sobre decisões, tarefas, compromissos ou discussões anteriores do time. Como posso te ajudar hoje?',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [biaInput, setBiaInput] = useState('')
  const [isBiaTyping, setIsBiaTyping] = useState(false)

  const handleSendBiaMessage = async (customMessage?: string) => {
    const textToSend = (customMessage !== undefined ? customMessage : biaInput).trim()
    if (!textToSend || isBiaTyping) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }

    const updatedHistory = [...biaMessages, userMsg]
    setBiaMessages(updatedHistory)
    setBiaInput('')
    setIsBiaTyping(true)

    try {
      const response = await BiaChatService.askBia({
        question: textToSend,
        chatHistory: updatedHistory,
        meetings,
      })

      const biaReply: ChatMessage = {
        id: `bia-${Date.now()}`,
        sender: 'bia',
        text: response.text,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        references: response.references,
      }

      setBiaMessages((prev) => [...prev, biaReply])
    } catch (e) {
      console.error('Erro ao conversar com a Bia:', e)
    } finally {
      setIsBiaTyping(false)
    }
  }

  // Estados da Busca Semântica
  const [semanticQuery, setSemanticQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchMatch[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const handleSemanticSearch = async (queryToUse?: string) => {
    const q = (queryToUse !== undefined ? queryToUse : semanticQuery).trim()
    if (!q) return

    setIsSearching(true)
    setHasSearched(true)
    try {
      const results = await SemanticSearchService.searchAcrossMeetings(q, meetings)
      setSearchResults(results)
    } catch (e) {
      console.error('Erro na busca semântica:', e)
    } finally {
      setIsSearching(false)
    }
  }

  const handleQuickQuery = (query: string) => {
    setSemanticQuery(query)
    handleSemanticSearch(query)
  }

  const handleSelectSearchResult = (meetingId: string) => {
    setSelectedMeetingId(meetingId)
    setActiveTab('minutes')
  }

  const [videoUrlsMap, setVideoUrlsMap] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return

    let cancelled = false

    const applyRecords = (records: MeetingRecord[]) => {
      if (cancelled) return
      setMeetings(records)
      setSelectedMeetingId((prev) =>
        prev && records.some((m) => m.id === prev) ? prev : records[0]?.id || ''
      )
    }

    // Carrega URLs de vídeos persistidos no IndexedDB
    const loadVideoUrls = (records: MeetingRecord[]) => {
      records.forEach(async (m) => {
        const persistedUrl = await VideoStorageService.getVideoUrl(m.id)
        if (persistedUrl && !cancelled) {
          setVideoUrlsMap((prev) => ({ ...prev, [m.id]: persistedUrl }))
        }
      })
    }

    const initialRecords = MeetingStorage.getMeetings()
    applyRecords(initialRecords)
    loadVideoUrls(initialRecords)

    // Sincroniza a chave do servidor central
    MeetingStorage.getApiKeyAsync().then((k) => {
      if (!cancelled) setApiKey(k)
    })

    // Busca as atas compartilhadas por todos os membros da sala
    MeetingStorage.fetchSharedMeetings()
      .then((records) => {
        applyRecords(records)
        loadVideoUrls(records)
      })
      .catch((e) => console.warn('Erro ao sincronizar atas compartilhadas:', e))

    const handleMeetingsUpdated = () => {
      const records = MeetingStorage.getMeetings()
      applyRecords(records)
      loadVideoUrls(records)
    }

    window.addEventListener(MEETINGS_UPDATED_EVENT, handleMeetingsUpdated)

    return () => {
      cancelled = true
      window.removeEventListener(MEETINGS_UPDATED_EVENT, handleMeetingsUpdated)
    }
  }, [open])

  // Preenchimento proativo de Insights e Pulse para reuniões gravadas antes da funcionalidade
  useEffect(() => {
    if (!open || !selectedMeetingId) return
    const current = meetings.find((m) => m.id === selectedMeetingId)
    if (!current) return

    const lacksPulse = !current.pulse
    const lacksInsights = !current.insights || current.insights.length === 0
    if (lacksPulse || lacksInsights) {
      // Evita regerar em loop quando a atualização da ata dispara novos renders
      if (insightsAttemptedRef.current.has(current.id)) return
      insightsAttemptedRef.current.add(current.id)

      GeminiMeetingService.generateInsightsAndPulse(current)
        .then(({ pulse, insights }) => {
          const updated: MeetingRecord = {
            ...current,
            pulse: current.pulse || pulse,
            insights:
              current.insights && current.insights.length > 0 ? current.insights : insights,
          }
          MeetingStorage.saveMeeting(updated)
          setMeetings((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
        })
        .catch((e) => console.warn('Erro na geração automática de insights:', e))
    }
  }, [open, selectedMeetingId, meetings])

  if (!open) return null

  const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId) || meetings[0]
  const currentVideoUrl = selectedMeeting
    ? videoUrlsMap[selectedMeeting.id] ||
      selectedMeeting.videoBlobUrl ||
      (selectedMeeting.videoUrl
        ? (selectedMeeting.videoUrl.startsWith('http')
            ? selectedMeeting.videoUrl
            : `${MeetingStorage.getHttpBaseUrl()}${selectedMeeting.videoUrl}`)
        : undefined)
    : undefined

  const filteredMeetings = meetings.filter((m) => {
    const text = `${m.title} ${m.roomName} ${m.participants.join(' ')}`.toLowerCase()
    return text.includes(searchQuery.toLowerCase())
  })

  const handleToggleCommitment = (commitmentIndex: number) => {
    if (!selectedMeeting) return
    const updatedMeetings = meetings.map((m) => {
      if (m.id !== selectedMeeting.id) return m
      const updatedCommitments = [...(m.commitments || [])].map((c, i) => {
        if (i !== commitmentIndex) return c
        return { ...c, status: c.status === 'done' ? 'pending' as const : 'done' as const }
      })
      return { ...m, commitments: updatedCommitments }
    })
    setMeetings(updatedMeetings)
    // Persist to localStorage
    const updated = updatedMeetings.find((m) => m.id === selectedMeeting.id)
    if (updated) MeetingStorage.saveMeeting(updated)
  }

  const handleToggleActionItem = (actionIndex: number) => {
    if (!selectedMeeting) return
    const updated = MeetingStorage.toggleActionItemStatus(selectedMeeting.id, actionIndex)
    if (updated) {
      setMeetings((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
    }
  }

  const handleUpdateTaskStatus = (
    actionIndex: number,
    status: 'pending' | 'in_progress' | 'done'
  ) => {
    if (!selectedMeeting) return
    const updated = MeetingStorage.updateActionItemStatus(selectedMeeting.id, actionIndex, status)
    if (updated) {
      setMeetings((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
    }
  }

  const handleGenerateInsightsNow = async () => {
    if (!selectedMeeting) return
    setIsGeneratingInsights(true)
    try {
      const { pulse, insights } = await GeminiMeetingService.generateInsightsAndPulse(selectedMeeting)
      const updated: MeetingRecord = {
        ...selectedMeeting,
        pulse,
        insights,
      }
      MeetingStorage.saveMeeting(updated)
      setMeetings((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
    } catch (err: any) {
      console.error('Erro ao gerar insights:', err)
    } finally {
      setIsGeneratingInsights(false)
    }
  }

  const handleCopyWhatsApp = () => {
    if (!selectedMeeting) return
    const dateFormatted = new Date(selectedMeeting.createdAt).toLocaleDateString('pt-BR')
    const timeFormatted = new Date(selectedMeeting.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    let text = `*📋 ATA EXECUTIVA DE REUNIÃO*\n`
    text += `*Assunto:* ${selectedMeeting.title}\n`
    text += `*Data/Hora:* ${dateFormatted} às ${timeFormatted} | *Duração:* ${selectedMeeting.durationFormatted}\n`
    text += `*Local/Sala:* ${selectedMeeting.roomName}\n`
    text += `*Participantes:* ${selectedMeeting.participants.join(', ')}\n\n`

    if (selectedMeeting.pulse) {
      text += `*📊 METRICS & PULSE DA SESSÃO*\n`
      text += `• Alinhamento: ${selectedMeeting.pulse.alignmentLevel} | Clima: ${selectedMeeting.pulse.tone}\n`
      text += `• Foco: ${selectedMeeting.pulse.focusArea} | Eficiência: ${selectedMeeting.pulse.efficiencyRating}\n\n`
    }

    text += `*📌 RESUMO DOS PRINCIPAIS PONTOS*\n`
    selectedMeeting.summary.forEach((s) => {
      text += `• ${s}\n`
    })
    text += `\n`

    text += `*⚖️ DECISÕES TOMADAS*\n`
    selectedMeeting.decisions.forEach((d) => {
      text += `• ${d}\n`
    })
    text += `\n`

    if (selectedMeeting.actionItems && selectedMeeting.actionItems.length > 0) {
      text += `*🎯 ITENS DE AÇÃO / TAREFAS*\n`
      selectedMeeting.actionItems.forEach((a) => {
        const check = a.status === 'done' ? '✅' : '⏳'
        text += `${check} ${a.task} _(Resp: ${a.assignee}${a.deadline ? ` | Prazo: ${a.deadline}` : ''})_\n`
      })
      text += `\n`
    }

    if (selectedMeeting.insights && selectedMeeting.insights.length > 0) {
      text += `*💡 INSIGHTS E RECOMENDAÇÕES DA IA*\n`
      selectedMeeting.insights.forEach((ins) => {
        const icon = ins.type === 'risk' ? '🚨' : ins.type === 'blind_spot' ? '⚠️' : '💡'
        text += `${icon} *${ins.title}*: ${ins.description}\n`
      })
      text += `\n`
    }

    text += `_Gerado automaticamente via SkyOffice AI_`

    navigator.clipboard.writeText(text)
    setCopyWhatsAppSuccess(true)
    setTimeout(() => setCopyWhatsAppSuccess(false), 2500)
  }

  const handleCopyEmail = () => {
    if (!selectedMeeting) return
    const dateFormatted = new Date(selectedMeeting.createdAt).toLocaleDateString('pt-BR')
    const timeFormatted = new Date(selectedMeeting.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    let text = `Prezados,\n\nSegue a ata executiva referente à reunião "${selectedMeeting.title}".\n\n`
    text += `===============================================\n`
    text += `INFORMAÇÕES DA SESSÃO\n`
    text += `===============================================\n`
    text += `Data: ${dateFormatted} às ${timeFormatted}\n`
    text += `Duração: ${selectedMeeting.durationFormatted}\n`
    text += `Sala: ${selectedMeeting.roomName}\n`
    text += `Participantes: ${selectedMeeting.participants.join(', ')}\n\n`

    if (selectedMeeting.pulse) {
      text += `CLIMA E EFICIÊNCIA DA SESSÃO\n`
      text += `- Alinhamento: ${selectedMeeting.pulse.alignmentLevel}\n`
      text += `- Tom da Reunião: ${selectedMeeting.pulse.tone}\n`
      text += `- Área de Foco: ${selectedMeeting.pulse.focusArea}\n`
      text += `- Avaliação de Eficiência: ${selectedMeeting.pulse.efficiencyRating}\n\n`
    }

    text += `1. RESUMO EXECUTIVO\n`
    selectedMeeting.summary.forEach((s) => {
      text += `  • ${s}\n`
    })
    text += `\n`

    text += `2. DECISÕES ALINHADAS\n`
    selectedMeeting.decisions.forEach((d) => {
      text += `  • ${d}\n`
    })
    text += `\n`

    if (selectedMeeting.actionItems && selectedMeeting.actionItems.length > 0) {
      text += `3. PLANO DE AÇÃO E RESPONSABILIDADES\n`
      selectedMeeting.actionItems.forEach((a) => {
        const mark = a.status === 'done' ? '[CONCLUÍDO]' : '[PENDENTE]'
        text += `  ${mark} ${a.task} | Responsável: ${a.assignee}${a.deadline ? ` | Prazo: ${a.deadline}` : ''}\n`
      })
      text += `\n`
    }

    if (selectedMeeting.insights && selectedMeeting.insights.length > 0) {
      text += `4. RECOMENDAÇÕES E INSIGHTS DA IA\n`
      selectedMeeting.insights.forEach((ins) => {
        text += `  • [${ins.type.toUpperCase()}] ${ins.title}: ${ins.description}\n`
      })
      text += `\n`
    }

    text += `Atenciosamente,\nSkyOffice Virtual Suite`

    navigator.clipboard.writeText(text)
    setCopyEmailSuccess(true)
    setTimeout(() => setCopyEmailSuccess(false), 2500)
  }

  const handleCopyMinutes = () => {
    if (!selectedMeeting) return
    const commitmentLines = (selectedMeeting.commitments || []).length > 0
      ? `\n---\n\n### 🔖 Compromissos Detectados\n${selectedMeeting.commitments.map((c) => `• [${c.status === 'done' ? 'x' : ' '}] ${c.description} (${c.responsiblePerson}${c.deadline ? ` | Prazo: ${c.deadline}` : ''} | ⏱️ ${c.detectedAt})`).join('\n')}\n`
      : ''
    const text = `# 📋 Ata de Reunião: ${selectedMeeting.title}
Data: ${new Date(selectedMeeting.createdAt).toLocaleDateString('pt-BR')} | Duração: ${selectedMeeting.durationFormatted}
Sala: ${selectedMeeting.roomName}
Participantes: ${selectedMeeting.participants.join(', ')}

---

### 📌 Resumo dos Principais Pontos
${selectedMeeting.summary.map((s) => `• ${s}`).join('\n')}

---

### ⚖️ Decisões Tomadas
${selectedMeeting.decisions.map((d) => `• ${d}`).join('\n')}

---

### ✅ Itens de Ação (Tarefas e Responsáveis)
${selectedMeeting.actionItems.map((a) => `• [ ] ${a.task} (Responsável: ${a.assignee} ${a.deadline ? `| Prazo: ${a.deadline}` : ''})`).join('\n')}
${commitmentLines}`
    navigator.clipboard.writeText(text)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2500)
  }

  const handleSaveApiKey = async () => {
    await MeetingStorage.setApiKey(apiKey)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2500)
  }

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'Insira a chave do Gemini antes de testar.' })
      return
    }
    setIsTestingKey(true)
    setTestResult(null)
    try {
      const res = await GeminiMeetingService.testApiKey(apiKey)
      setTestResult(res)
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Falha ao conectar com o Gemini.' })
    } finally {
      setIsTestingKey(false)
    }
  }

  const handleRegenerateAta = async () => {
    if (!selectedMeeting) return
    setIsRegenerating(true)
    try {
      const videoBlob = await VideoStorageService.getVideoBlob(selectedMeeting.id)
      const regenerated = await GeminiMeetingService.generateMeetingNotes({
        audioBlob: videoBlob,
        rawTranscript: selectedMeeting.transcript,
        meetingTitle: selectedMeeting.title,
        roomName: selectedMeeting.roomName,
        participants: selectedMeeting.participants,
        durationSeconds: 60,
      })
      regenerated.id = selectedMeeting.id
      regenerated.createdAt = selectedMeeting.createdAt
      regenerated.durationFormatted = selectedMeeting.durationFormatted !== '0 seg' ? selectedMeeting.durationFormatted : regenerated.durationFormatted
      regenerated.videoBlobUrl = selectedMeeting.videoBlobUrl
      regenerated.videoFileName = selectedMeeting.videoFileName

      MeetingStorage.saveMeeting(regenerated)
      setMeetings(MeetingStorage.getMeetings())
      alert('✅ Ata gerada e atualizada com sucesso pela Inteligência Artificial!')
    } catch (err: any) {
      alert(`⚠️ Erro ao gerar ata com IA: ${err?.message || err}`)
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <FullPageContainer>
      {/* Top Header com Botão de Voltar ao Escritório */}
      <TopHeader>
        <div className="brand-area">
          <div className="icon-wrapper">
            <SmartToyOutlinedIcon style={{ fontSize: 26 }} />
          </div>
          <div>
            <h1>Central de Reuniões & Atas IA</h1>
            <p>Histórico inteligente e resumos executivos gerados por Inteligência Artificial</p>
          </div>
        </div>

        <div className="nav-actions">
          <BackButton onClick={onClose}>
            <ArrowBackIcon style={{ fontSize: 18 }} />
            Voltar para o Escritório
          </BackButton>
          <IconButton onClick={onClose} size="medium" style={{ color: '#64748b' }} title="Fechar">
            <CloseIcon />
          </IconButton>
        </div>
      </TopHeader>

      {/* Barra de Abas */}
      <NavigationBar>
        <NavTab $active={activeTab === 'minutes'} onClick={() => setActiveTab('minutes')}>
          <DescriptionOutlinedIcon style={{ fontSize: 18 }} />
          Atas & Resumos IA
        </NavTab>
        <NavTab $active={activeTab === 'bia'} onClick={() => setActiveTab('bia')}>
          <SmartToyOutlinedIcon style={{ fontSize: 18 }} />
          Assistente Bia IA
        </NavTab>
        <NavTab $active={activeTab === 'search'} onClick={() => setActiveTab('search')}>
          <TravelExploreIcon style={{ fontSize: 18 }} />
          Busca IA (Knowledge Base)
        </NavTab>
        <NavTab $active={activeTab === 'videos'} onClick={() => setActiveTab('videos')}>
          <VideoLibraryOutlinedIcon style={{ fontSize: 18 }} />
          Vídeos Gravados
        </NavTab>
        <NavTab $active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
          <SettingsOutlinedIcon style={{ fontSize: 18 }} />
          Configuração de IA
        </NavTab>
      </NavigationBar>

      {/* Conteúdo Principal */}
      <MainLayout>
        {activeTab === 'minutes' && (
          <>
            {/* Barra lateral de reuniões */}
            <SideSidebar>
              <SearchBarWrapper>
                <SearchIcon className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar atas anteriores..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </SearchBarWrapper>

              {filteredMeetings.map((m) => (
                <MeetingListItem
                  key={m.id}
                  $selected={selectedMeeting?.id === m.id}
                  onClick={() => setSelectedMeetingId(m.id)}
                >
                  <h4>{m.title}</h4>
                  <div className="meta-info">
                    <span>
                      {new Date(m.createdAt).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>•</span>
                    <span>{m.durationFormatted}</span>
                    <span>•</span>
                    <span>{m.roomName}</span>
                  </div>
                </MeetingListItem>
              ))}

              {filteredMeetings.length === 0 && (
                <div style={{ padding: '36px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  Nenhuma reunião encontrada.
                </div>
              )}
            </SideSidebar>

            {/* Painel de Leitura da Ata */}
            {selectedMeeting ? (
              <ContentArea>
                <DetailHeader>
                  <div className="title-group">
                    <h2>{selectedMeeting.title}</h2>
                    <div className="meta-badges">
                      <span>
                        <CalendarTodayOutlinedIcon style={{ fontSize: 15, color: '#2563eb' }} />
                        {new Date(selectedMeeting.createdAt).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(selectedMeeting.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>
                        <AccessTimeOutlinedIcon style={{ fontSize: 15, color: '#2563eb' }} />
                        Duração: {selectedMeeting.durationFormatted}
                      </span>
                      <span>
                        <MeetingRoomOutlinedIcon style={{ fontSize: 15, color: '#2563eb' }} />
                        {selectedMeeting.roomName}
                      </span>
                      <span>
                        <PersonOutlineIcon style={{ fontSize: 16, color: '#2563eb' }} />
                        {selectedMeeting.participants.join(', ')}
                      </span>
                    </div>
                  </div>

                  <div className="action-buttons" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <CleanButton
                      $variant="secondary"
                      onClick={handleRegenerateAta}
                      disabled={isRegenerating}
                      title="Solicita que a IA processe a gravação e gere todos os resumos, decisões e transcrições"
                      style={{ border: '1px solid #d8b4fe', color: '#7e22ce', background: '#faf5ff' }}
                    >
                      <AutoAwesomeIcon style={{ fontSize: 16, color: '#9333ea' }} />
                      {isRegenerating ? 'Gerando Ata com IA...' : 'Gerar Ata com IA'}
                    </CleanButton>

                    <CleanButton
                      $variant="secondary"
                      onClick={handleCopyWhatsApp}
                      title="Copiar ata formatada para envio no WhatsApp"
                      style={{ border: '1px solid #bbf7d0', color: '#15803d', background: '#f0fdf4' }}
                    >
                      <WhatsAppIcon style={{ fontSize: 16, color: '#16a34a' }} />
                      {copyWhatsAppSuccess ? 'Copiado p/ Zap!' : 'WhatsApp'}
                    </CleanButton>

                    <CleanButton
                      $variant="secondary"
                      onClick={handleCopyEmail}
                      title="Copiar ata formatada como E-mail Executivo"
                      style={{ border: '1px solid #bae6fd', color: '#0369a1', background: '#f0f9ff' }}
                    >
                      <EmailOutlinedIcon style={{ fontSize: 16, color: '#0284c7' }} />
                      {copyEmailSuccess ? 'Copiado p/ E-mail!' : 'E-mail'}
                    </CleanButton>

                    <CleanButton $variant="secondary" onClick={handleCopyMinutes}>
                      {copySuccess ? (
                        <>
                          <CheckIcon style={{ fontSize: 16, color: '#10b981' }} />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <ContentCopyIcon style={{ fontSize: 16 }} />
                          Copiar Ata
                        </>
                      )}
                    </CleanButton>
                  </div>
                </DetailHeader>

                {/* 📊 Meeting Pulse (Clima, Alinhamento & Métricas da Reunião) */}
                {selectedMeeting.pulse ? (
                  <PulseGrid>
                    <div className="pulse-box">
                      <span className="pulse-title">🎯 Nível de Alinhamento</span>
                      <span
                        className="pulse-value"
                        style={{
                          color: selectedMeeting.pulse.alignmentLevel === 'Alto' ? '#16a34a' : '#2563eb',
                        }}
                      >
                        {selectedMeeting.pulse.alignmentLevel}
                      </span>
                    </div>
                    <div className="pulse-box">
                      <span className="pulse-title">💬 Clima & Tom</span>
                      <span className="pulse-value">{selectedMeeting.pulse.tone}</span>
                    </div>
                    <div className="pulse-box">
                      <span className="pulse-title">🔍 Foco Principal</span>
                      <span className="pulse-value">{selectedMeeting.pulse.focusArea}</span>
                    </div>
                    <div className="pulse-box">
                      <span className="pulse-title">⚡ Eficiência da Sessão</span>
                      <span className="pulse-value" style={{ color: '#0284c7' }}>
                        {selectedMeeting.pulse.efficiencyRating}
                      </span>
                    </div>
                  </PulseGrid>
                ) : (
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px dashed #cbd5e1',
                      borderRadius: 10,
                      padding: '12px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 13, color: '#64748b' }}>
                      📊 <strong>Meeting Pulse:</strong> Avalie clima, alinhamento e eficiência desta reunião com a IA.
                    </span>
                    <CleanButton
                      $variant="secondary"
                      onClick={handleGenerateInsightsNow}
                      disabled={isGeneratingInsights}
                      style={{ fontSize: 12, padding: '6px 14px' }}
                    >
                      {isGeneratingInsights ? 'Analisando...' : '✨ Analisar Pulse & Clima'}
                    </CleanButton>
                  </div>
                )}

                {/* 📌 Resumo dos Principais Pontos */}
                <CleanCard>
                  <h3>📌 Resumo dos Principais Pontos</h3>
                  <ul>
                    {selectedMeeting.summary.map((pt, idx) => (
                      <li key={idx}>{pt}</li>
                    ))}
                  </ul>
                </CleanCard>

                {/* ⚖️ Decisões Tomadas pela Equipe */}
                <CleanCard>
                  <h3>⚖️ Decisões Tomadas pela Equipe</h3>
                  <ul>
                    {selectedMeeting.decisions.map((dec, idx) => (
                      <li key={idx}>{dec}</li>
                    ))}
                  </ul>
                </CleanCard>

                {/* 💡 Insights Estratégicos & Pontos Cegos (Recomendações Consultivas da IA) */}
                <CleanCard>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 14,
                      flexWrap: 'wrap',
                      gap: 10,
                    }}
                  >
                    <h3 style={{ margin: 0 }}>
                      <LightbulbOutlinedIcon style={{ fontSize: 18, color: '#eab308' }} />
                      💡 Insights Estratégicos & Pontos Cegos da IA
                    </h3>
                    {(!selectedMeeting.insights || selectedMeeting.insights.length === 0) && (
                      <CleanButton
                        $variant="secondary"
                        onClick={handleGenerateInsightsNow}
                        disabled={isGeneratingInsights}
                        style={{
                          fontSize: 12,
                          padding: '5px 12px',
                          border: '1px solid #fde68a',
                          color: '#92400e',
                          background: '#fffbeb',
                        }}
                      >
                        {isGeneratingInsights ? 'Gerando Análise...' : '✨ Gerar Insights Agora'}
                      </CleanButton>
                    )}
                  </div>

                  {selectedMeeting.insights && selectedMeeting.insights.length > 0 ? (
                    selectedMeeting.insights.map((ins, idx) => (
                      <InsightCard key={idx} $type={ins.type}>
                        <div className="insight-top">
                          <span className="insight-type-badge">
                            {ins.type === 'risk'
                              ? '🚨 Risco'
                              : ins.type === 'blind_spot'
                              ? '⚠️ Ponto Cego'
                              : '💡 Recomendação'}
                          </span>
                          <strong>{ins.title}</strong>
                        </div>
                        <p>{ins.description}</p>
                      </InsightCard>
                    ))
                  ) : (
                    <div
                      style={{
                        background: '#fffbeb',
                        border: '1px dashed #fde68a',
                        borderRadius: 8,
                        padding: '16px',
                        textAlign: 'center',
                        color: '#92400e',
                        fontSize: 13,
                      }}
                    >
                      <p style={{ margin: '0 0 10px 0' }}>
                        Esta reunião foi gravada antes do módulo consultivo de IA. Clique no botão abaixo para analisar riscos, pontos cegos e recomendações táticas agora mesmo:
                      </p>
                      <CleanButton
                        $variant="secondary"
                        onClick={handleGenerateInsightsNow}
                        disabled={isGeneratingInsights}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #f59e0b',
                          color: '#b45309',
                          fontWeight: 600,
                        }}
                      >
                        <AutoAwesomeIcon style={{ fontSize: 15, color: '#f59e0b' }} />
                        {isGeneratingInsights ? 'Analisando Diálogos com IA...' : 'Analisar Riscos & Pontos Cegos com IA'}
                      </CleanButton>
                    </div>
                  )}
                </CleanCard>

                {/* 🎯 Plano de Ação & Quadro Kanban de Tarefas */}
                <CleanCard>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 10,
                      marginBottom: 14,
                    }}
                  >
                    <h3 style={{ margin: 0 }}>
                      <AssignmentTurnedInOutlinedIcon style={{ fontSize: 18, color: '#2563eb' }} />
                      🎯 Quadro de Tarefas & Kanban da Reunião
                      {selectedMeeting.actionItems.length > 0 && (
                        <span
                          style={{
                            marginLeft: 10,
                            fontSize: 12,
                            fontWeight: 500,
                            color: '#64748b',
                            background: '#f1f5f9',
                            padding: '2px 10px',
                            borderRadius: 12,
                          }}
                        >
                          {selectedMeeting.actionItems.filter((a) => a.status === 'done').length} de{' '}
                          {selectedMeeting.actionItems.length} concluídas
                        </span>
                      )}
                    </h3>

                    <ViewSwitcher>
                      <button
                        className={taskViewMode === 'kanban' ? 'active' : ''}
                        onClick={() => setTaskViewMode('kanban')}
                      >
                        ⊞ Quadro Kanban
                      </button>
                      <button
                        className={taskViewMode === 'list' ? 'active' : ''}
                        onClick={() => setTaskViewMode('list')}
                      >
                        ≡ Lista Interativa
                      </button>
                    </ViewSwitcher>
                  </div>

                  {taskViewMode === 'kanban' ? (
                    <KanbanContainer>
                      {/* Coluna 1: A Fazer */}
                      <KanbanColumn $color="#3b82f6">
                        <div className="kanban-column-header">
                          <span>📋 A Fazer</span>
                          <span className="count-badge">
                            {
                              selectedMeeting.actionItems.filter(
                                (a) => !a.status || a.status === 'pending'
                              ).length
                            }
                          </span>
                        </div>
                        <div className="kanban-cards">
                          {selectedMeeting.actionItems.map((act, idx) => {
                            const status = act.status || 'pending'
                            if (status !== 'pending') return null
                            return (
                              <KanbanItemCard key={idx}>
                                <div className="kanban-item-text">{act.task}</div>
                                <div className="kanban-item-meta">
                                  <span className="assignee">👤 {act.assignee}</span>
                                  {act.deadline && <span className="deadline">⏰ {act.deadline}</span>}
                                </div>
                                <div className="kanban-actions">
                                  <button
                                    className="advance"
                                    onClick={() => handleUpdateTaskStatus(idx, 'in_progress')}
                                    title="Mover para Em Andamento"
                                  >
                                    ▶ Iniciar
                                  </button>
                                  <button
                                    className="done"
                                    onClick={() => handleUpdateTaskStatus(idx, 'done')}
                                    title="Marcar como Concluída"
                                  >
                                    ✓ Concluir
                                  </button>
                                </div>
                              </KanbanItemCard>
                            )
                          })}
                          {selectedMeeting.actionItems.filter(
                            (a) => !a.status || a.status === 'pending'
                          ).length === 0 && (
                            <div className="kanban-empty">Nenhuma tarefa pendente</div>
                          )}
                        </div>
                      </KanbanColumn>

                      {/* Coluna 2: Em Andamento */}
                      <KanbanColumn $color="#f59e0b">
                        <div className="kanban-column-header">
                          <span>⚡ Em Andamento</span>
                          <span className="count-badge">
                            {
                              selectedMeeting.actionItems.filter((a) => a.status === 'in_progress')
                                .length
                            }
                          </span>
                        </div>
                        <div className="kanban-cards">
                          {selectedMeeting.actionItems.map((act, idx) => {
                            if (act.status !== 'in_progress') return null
                            return (
                              <KanbanItemCard key={idx}>
                                <div className="kanban-item-text">{act.task}</div>
                                <div className="kanban-item-meta">
                                  <span className="assignee">👤 {act.assignee}</span>
                                  {act.deadline && <span className="deadline">⏰ {act.deadline}</span>}
                                </div>
                                <div className="kanban-actions">
                                  <button
                                    onClick={() => handleUpdateTaskStatus(idx, 'pending')}
                                    title="Voltar para A Fazer"
                                  >
                                    ◀ Voltar
                                  </button>
                                  <button
                                    className="done"
                                    onClick={() => handleUpdateTaskStatus(idx, 'done')}
                                    title="Marcar como Concluída"
                                  >
                                    ✓ Concluir
                                  </button>
                                </div>
                              </KanbanItemCard>
                            )
                          })}
                          {selectedMeeting.actionItems.filter((a) => a.status === 'in_progress')
                            .length === 0 && (
                            <div className="kanban-empty">Nenhuma tarefa em andamento</div>
                          )}
                        </div>
                      </KanbanColumn>

                      {/* Coluna 3: Concluídas */}
                      <KanbanColumn $color="#10b981">
                        <div className="kanban-column-header">
                          <span>✅ Concluídas</span>
                          <span className="count-badge">
                            {selectedMeeting.actionItems.filter((a) => a.status === 'done').length}
                          </span>
                        </div>
                        <div className="kanban-cards">
                          {selectedMeeting.actionItems.map((act, idx) => {
                            if (act.status !== 'done') return null
                            return (
                              <KanbanItemCard
                                key={idx}
                                style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}
                              >
                                <div
                                  className="kanban-item-text"
                                  style={{ textDecoration: 'line-through', color: '#64748b' }}
                                >
                                  {act.task}
                                </div>
                                <div className="kanban-item-meta">
                                  <span className="assignee">👤 {act.assignee}</span>
                                  {act.deadline && <span className="deadline">⏰ {act.deadline}</span>}
                                </div>
                                <div className="kanban-actions">
                                  <button
                                    onClick={() => handleUpdateTaskStatus(idx, 'pending')}
                                    title="Reabrir tarefa como A Fazer"
                                  >
                                    ↺ Reabrir
                                  </button>
                                </div>
                              </KanbanItemCard>
                            )
                          })}
                          {selectedMeeting.actionItems.filter((a) => a.status === 'done').length ===
                            0 && <div className="kanban-empty">Nenhuma tarefa concluída</div>}
                        </div>
                      </KanbanColumn>
                    </KanbanContainer>
                  ) : (
                    // Modo Lista
                    <>
                      {selectedMeeting.actionItems.map((act, idx) => {
                        const isDone = act.status === 'done'
                        return (
                          <TaskCard
                            key={idx}
                            $done={isDone}
                            onClick={() => handleToggleActionItem(idx)}
                            title="Clique para alternar status da tarefa (Pendente / Concluída)"
                          >
                            <div className="task-left">
                              <div className="task-check">
                                {isDone ? (
                                  <CheckCircleIcon style={{ fontSize: 20 }} />
                                ) : (
                                  <RadioButtonUncheckedIcon style={{ fontSize: 20 }} />
                                )}
                              </div>
                              <span className="task-text">{act.task}</span>
                            </div>
                            <div className="task-badges">
                              <span className="assignee-badge">👤 {act.assignee}</span>
                              {act.deadline && <span className="deadline-badge">⏰ {act.deadline}</span>}
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  background: isDone
                                    ? '#dcfce7'
                                    : act.status === 'in_progress'
                                    ? '#fef3c7'
                                    : '#f1f5f9',
                                  color: isDone
                                    ? '#166534'
                                    : act.status === 'in_progress'
                                    ? '#92400e'
                                    : '#475569',
                                }}
                              >
                                {isDone
                                  ? 'Concluída'
                                  : act.status === 'in_progress'
                                  ? 'Em Andamento'
                                  : 'Pendente'}
                              </span>
                            </div>
                          </TaskCard>
                        )
                      })}
                      {selectedMeeting.actionItems.length === 0 && (
                        <div style={{ color: '#94a3b8', fontSize: 13, padding: '8px 0' }}>
                          Nenhuma tarefa registrada para esta reunião.
                        </div>
                      )}
                    </>
                  )}
                </CleanCard>

                {/* 🔖 Compromissos Detectados pela IA */}
                {selectedMeeting.commitments && selectedMeeting.commitments.length > 0 && (
                  <CleanCard>
                    <h3>
                      <FlagIcon style={{ fontSize: 18, color: '#f59e0b' }} />
                      🔖 Compromissos Detectados pela IA
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#64748b',
                        background: '#f1f5f9',
                        padding: '2px 10px',
                        borderRadius: 12,
                      }}>
                        {selectedMeeting.commitments.filter((c) => c.status === 'pending').length} pendentes
                      </span>
                    </h3>
                    {selectedMeeting.commitments.map((commitment, idx) => (
                      <CommitmentCard
                        key={idx}
                        $done={commitment.status === 'done'}
                        onClick={() => handleToggleCommitment(idx)}
                      >
                        <div className="commitment-check">
                          {commitment.status === 'done' ? (
                            <CheckCircleIcon style={{ fontSize: 22 }} />
                          ) : (
                            <RadioButtonUncheckedIcon style={{ fontSize: 22 }} />
                          )}
                        </div>
                        <div className="commitment-body">
                          <div className="commitment-text">{commitment.description}</div>
                          <div className="commitment-meta">
                            <span className="meta-chip person-chip">
                              👤 {commitment.responsiblePerson}
                            </span>
                            {commitment.deadline && (
                              <span className="meta-chip deadline-chip">
                                ⏰ {commitment.deadline}
                              </span>
                            )}
                            <span className="meta-chip timestamp-chip">
                              <PlayCircleOutlineIcon style={{ fontSize: 14 }} />
                              {commitment.detectedAt}
                            </span>
                            <span className="meta-chip status-chip">
                              {commitment.status === 'done' ? '✅ Concluído' : '🔶 Pendente'}
                            </span>
                          </div>
                        </div>
                      </CommitmentCard>
                    ))}
                  </CleanCard>
                )}

                {/* 🕐 Timeline com Timestamps */}
                {selectedMeeting.timestampedSegments && selectedMeeting.timestampedSegments.length > 0 && (
                  <CleanCard>
                    <h3>
                      <TimelineIcon style={{ fontSize: 18, color: '#7c3aed' }} />
                      🕐 Timeline da Reunião
                    </h3>
                    <TypeLegend>
                      <div className="legend-item">
                        <div className="legend-dot" style={{ background: '#3b82f6' }} />
                        Resumo
                      </div>
                      <div className="legend-item">
                        <div className="legend-dot" style={{ background: '#8b5cf6' }} />
                        Decisão
                      </div>
                      <div className="legend-item">
                        <div className="legend-dot" style={{ background: '#f59e0b' }} />
                        Compromisso
                      </div>
                      <div className="legend-item">
                        <div className="legend-dot" style={{ background: '#94a3b8' }} />
                        Geral
                      </div>
                    </TypeLegend>
                    <TimelineContainer>
                      {selectedMeeting.timestampedSegments.map((seg, idx) => (
                        <TimelineItem key={idx} $type={seg.type}>
                          <div className="timeline-header">
                            <span className="timeline-timestamp">
                              ▶ {seg.timestamp}
                            </span>
                            {seg.speaker && (
                              <span className="timeline-speaker">{seg.speaker}</span>
                            )}
                            <span className="timeline-type-badge">
                              {seg.type === 'summary' && '📌 Resumo'}
                              {seg.type === 'decision' && '⚖️ Decisão'}
                              {seg.type === 'commitment' && '🔖 Compromisso'}
                              {seg.type === 'general' && '💬 Geral'}
                            </span>
                          </div>
                          <div className="timeline-content">{seg.content}</div>
                        </TimelineItem>
                      ))}
                    </TimelineContainer>
                  </CleanCard>
                )}

                {/* 📝 Transcrição / Detalhes */}
                {selectedMeeting.transcript && (
                  <CleanCard>
                    <h3>📝 Transcrição / Detalhes da Conversa</h3>
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: 16,
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: '#475569',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {selectedMeeting.transcript}
                    </div>
                  </CleanCard>
                )}
              </ContentArea>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#94a3b8', fontSize: 14 }}>Selecione uma reunião para ver a ata.</p>
              </div>
            )}
          </>
        )}

        {/* Aba da Assistente Bia IA (Chat Q&A) */}
        {activeTab === 'bia' && (
          <ContentArea style={{ height: 'calc(100vh - 140px)', padding: '16px' }}>
            <BiaChatContainer>
              <BiaChatHeader>
                <div className="bia-info">
                  <div className="avatar">B</div>
                  <div>
                    <h3>Bia • Assistente Executiva IA</h3>
                    <p>Online e pronta para responder sobre as reuniões</p>
                  </div>
                </div>
                <div className="status-badge">
                  {meetings.length} reunião(ões) indexada(s)
                </div>
              </BiaChatHeader>

              <BiaChatMessages>
                {biaMessages.map((msg) => (
                  <BiaBubble key={msg.id} $sender={msg.sender}>
                    {msg.text}
                    <div className="message-meta">{msg.timestamp}</div>

                    {msg.references && msg.references.length > 0 && (
                      <div className="references-box">
                        <span className="ref-title">Fontes consultadas:</span>
                        {msg.references.map((r, i) => (
                          <button
                            key={i}
                            onClick={() => handleSelectSearchResult(r.meetingId)}
                          >
                            <OpenInNewIcon style={{ fontSize: 13 }} />
                            {r.meetingTitle}
                          </button>
                        ))}
                      </div>
                    )}
                  </BiaBubble>
                ))}

                {isBiaTyping && (
                  <BiaBubble $sender="bia">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b' }}>
                      <CircularProgress size={14} style={{ color: '#2563eb' }} />
                      <span>Bia está analisando as atas e redigindo a resposta...</span>
                    </div>
                  </BiaBubble>
                )}
              </BiaChatMessages>

              <BiaInputArea>
                <div className="quick-suggestions">
                  <button onClick={() => handleSendBiaMessage('Bia, resuma o que foi decidido na última reunião.')}>
                    Resumo da última reunião
                  </button>
                  <button onClick={() => handleSendBiaMessage('Quais tarefas e prazos o time tem pendentes?')}>
                    Tarefas do time
                  </button>
                  <button onClick={() => handleSendBiaMessage('Quais compromissos o Felipe assumiu?')}>
                    Compromissos do Felipe
                  </button>
                  <button onClick={() => handleSendBiaMessage('O que foi combinado sobre a infraestrutura e VPS?')}>
                    Alinhamento sobre VPS
                  </button>
                </div>

                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="Pergunte à Bia sobre qualquer assunto discutido nas reuniões..."
                    value={biaInput}
                    onChange={(e) => setBiaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSendBiaMessage()
                      }
                    }}
                  />
                  <button
                    disabled={isBiaTyping || !biaInput.trim()}
                    onClick={() => handleSendBiaMessage()}
                    title="Enviar pergunta"
                  >
                    <SendIcon style={{ fontSize: 16 }} />
                  </button>
                </div>
              </BiaInputArea>
            </BiaChatContainer>
          </ContentArea>
        )}

        {/* Aba de Vídeos Gravados */}
        {activeTab === 'videos' && (
          <ContentArea>
            <div style={{ maxWidth: 860, margin: '0 auto', width: '100%' }}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ margin: '0 0 6px 0', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                  🎥 Galeria de Gravações de Reunião
                </h2>
                <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
                  Assista às reuniões gravadas diretamente no navegador ou baixe o arquivo em alta definição.
                </p>
              </div>

              {currentVideoUrl ? (
                <CleanCard>
                  <video
                    src={currentVideoUrl}
                    controls
                    style={{
                      width: '100%',
                      maxHeight: '440px',
                      background: '#000000',
                      borderRadius: 8,
                      outline: 'none',
                    }}
                  />
                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
                        {selectedMeeting.title}
                      </h4>
                      <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                        {new Date(selectedMeeting.createdAt).toLocaleDateString('pt-BR')} • {selectedMeeting.durationFormatted}
                      </p>
                    </div>
                    <a
                      href={currentVideoUrl}
                      download={selectedMeeting.videoFileName || 'reuniao-skyoffice.webm'}
                      style={{ textDecoration: 'none' }}
                    >
                      <CleanButton $variant="primary">
                        <DownloadIcon style={{ fontSize: 16 }} />
                        Baixar Vídeo (.webm)
                      </CleanButton>
                    </a>
                  </div>
                </CleanCard>
              ) : (
                <CleanCard style={{ textAlign: 'center', padding: '60px 24px' }}>
                  <VideoLibraryOutlinedIcon style={{ fontSize: 56, color: '#3b82f6', marginBottom: 12 }} />
                  <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#0f172a', justifyContent: 'center' }}>
                    As gravações de reuniões são salvas diretamente no seu computador
                  </h3>
                  <p style={{ margin: 0, fontSize: 14, color: '#64748b', maxWidth: 480, marginInline: 'auto', lineHeight: 1.5 }}>
                    Ao clicar em <strong>"Gravar Reunião"</strong> na barra inferior do escritório, o áudio e vídeo
                    dos participantes são capturados e o download do arquivo de vídeo (.webm) é disparado automaticamente.
                  </p>
                </CleanCard>
              )}
            </div>
          </ContentArea>
        )}

        {/* Aba de Busca Semântica IA (Knowledge Base) */}
        {activeTab === 'search' && (
          <ContentArea>
            <SemanticSearchContainer>
              <div>
                <h2 style={{ margin: '0 0 6px 0', fontSize: 22, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AutoAwesomeIcon style={{ color: '#2563eb' }} />
                  Knowledge Base IA — Busca Semântica Global
                </h2>
                <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
                  Pesquise decisões, tarefas, discussões e promessas em linguagem natural através de todas as reuniões do escritório.
                </p>
              </div>

              <SemanticSearchBox>
                <div className="input-row">
                  <TravelExploreIcon style={{ color: '#64748b' }} />
                  <input
                    type="text"
                    placeholder="Ex: O que foi decidido sobre o WebRTC? Quem vai entregar na sexta?"
                    value={semanticQuery}
                    onChange={(e) => setSemanticQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSemanticSearch()
                      }
                    }}
                  />
                  <button
                    className="search-btn"
                    disabled={isSearching || !semanticQuery.trim()}
                    onClick={() => handleSemanticSearch()}
                  >
                    {isSearching ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <SearchIcon style={{ fontSize: 16 }} />
                    )}
                    Pesquisar
                  </button>
                </div>

                <div className="quick-queries">
                  <span>Sugestões rápidas:</span>
                  <button onClick={() => handleQuickQuery('O que foi decidido sobre o deploy e VPS?')}>
                    Deploy e VPS
                  </button>
                  <button onClick={() => handleQuickQuery('Quais são as tarefas e prazos pendentes?')}>
                    Tarefas e Prazos
                  </button>
                  <button onClick={() => handleQuickQuery('O que o Felipe se comprometeu a fazer?')}>
                    Compromissos do Felipe
                  </button>
                  <button onClick={() => handleQuickQuery('Quais foram as decisões tomadas?')}>
                    Todas as decisões
                  </button>
                </div>
              </SemanticSearchBox>

              {/* Resultados da Busca */}
              {isSearching && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                  <CircularProgress size={32} style={{ color: '#2563eb', marginBottom: 12 }} />
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
                    Consultando base de conhecimento e comparando relevância semântica...
                  </p>
                </div>
              )}

              {!isSearching && hasSearched && searchResults.length === 0 && (
                <CleanCard style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                  <TravelExploreIcon style={{ fontSize: 44, color: '#94a3b8', marginBottom: 12 }} />
                  <h3 style={{ margin: '0 0 6px 0', fontSize: 16, color: '#0f172a', justifyContent: 'center' }}>
                    Nenhum resultado relevante encontrado
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                    Tente reformular sua pergunta ou usar termos mais amplos.
                  </p>
                </CleanCard>
              )}

              {!isSearching && searchResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
                      {searchResults.length} trechos encontrados por ordem de relevância:
                    </span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      Clique em "Ver na Ata" para abrir o contexto completo
                    </span>
                  </div>

                  {searchResults.map((res, idx) => {
                    const tagLabelMap: Record<string, { label: string; color: string }> = {
                      summary: { label: 'Resumo', color: '#1d4ed8' },
                      decision: { label: 'Decisão', color: '#6d28d9' },
                      actionItem: { label: 'Item de Ação', color: '#047857' },
                      commitment: { label: 'Compromisso', color: '#b45309' },
                      topic: { label: 'Tópico / Linha do Tempo', color: '#0284c7' },
                      transcript: { label: 'Transcrição', color: '#475569' },
                    }
                    const tagInfo = tagLabelMap[res.segmentType] || { label: 'Geral', color: '#475569' }

                    return (
                      <SearchResultCard key={`${res.meetingId}-${idx}`}>
                        <div className="result-header">
                          <div className="meeting-badge">
                            <h4>{res.meetingTitle}</h4>
                            <span className="date">
                              • {new Date(res.meetingDate).toLocaleDateString('pt-BR')} • {res.roomName}
                            </span>
                          </div>
                          <span className="score-badge">
                            <AutoAwesomeIcon style={{ fontSize: 13 }} />
                            Relevância: {Math.round(res.similarityScore * 100)}%
                          </span>
                        </div>

                        <div className="snippet-box">
                          <span className="type-tag" style={{ color: tagInfo.color }}>
                            {tagInfo.label} {res.timestamp ? `• ${res.timestamp}` : ''}
                          </span>
                          <div>{res.snippet}</div>
                        </div>

                        <div className="result-footer">
                          <div className="meta">
                            {res.speaker && <span>👤 Falado por: <strong>{res.speaker}</strong></span>}
                            {res.timestamp && <span>⏱️ Momento: <strong>{res.timestamp}</strong></span>}
                          </div>
                          <button
                            className="open-action"
                            onClick={() => handleSelectSearchResult(res.meetingId)}
                          >
                            Ver na Ata
                            <OpenInNewIcon style={{ fontSize: 15 }} />
                          </button>
                        </div>
                      </SearchResultCard>
                    )
                  })}
                </div>
              )}
            </SemanticSearchContainer>
          </ContentArea>
        )}

        {/* Aba de Configurações da IA */}
        {activeTab === 'settings' && (
          <ContentArea>
            <div style={{ maxWidth: 720, margin: '0 auto', width: '100%' }}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ margin: '0 0 6px 0', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                  ⚙️ Configurações da Inteligência Artificial
                </h2>
                <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
                  Conecte sua chave da API do Google Gemini para habilitar transcrições automáticas e geração inteligente de atas.
                </p>
              </div>

              {saveSuccess && (
                <Alert severity="success" style={{ marginBottom: 16, borderRadius: 8 }}>
                  ✅ Chave da API do Google Gemini salva e sincronizada com sucesso!
                </Alert>
              )}

              {testResult && (
                <Alert
                  severity={testResult.success ? 'success' : 'error'}
                  style={{ marginBottom: 16, borderRadius: 8 }}
                >
                  {testResult.message}
                </Alert>
              )}

              <CleanCard>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <label style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                    Google Gemini API Key:
                  </label>
                  <input
                    type="password"
                    placeholder="Cole sua chave aqui (ex: AIzaSy...)"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value)
                      setTestResult(null)
                    }}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: 8,
                      padding: '12px 14px',
                      color: '#0f172a',
                      fontSize: 14,
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                  />
                  <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                    Você pode obter sua chave de API gratuitamente no{' '}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
                    >
                      Google AI Studio ↗
                    </a>
                    . O limite gratuito do Gemini é amplo e ideal para atas e transcrições de reuniões corporativas.
                  </p>

                  <div style={{ marginTop: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
                    <CleanButton $variant="primary" onClick={handleSaveApiKey}>
                      <CheckCircleIcon style={{ fontSize: 16 }} />
                      Salvar Chave
                    </CleanButton>

                    <CleanButton
                      $variant="secondary"
                      onClick={handleTestApiKey}
                      disabled={isTestingKey}
                      style={{ border: '1px solid #93c5fd', color: '#1d4ed8', background: '#eff6ff' }}
                    >
                      {isTestingKey ? (
                        <>
                          <CircularProgress size={14} style={{ color: '#1d4ed8', marginRight: 6 }} />
                          Testando Conexão...
                        </>
                      ) : (
                        <>
                          <AutoAwesomeIcon style={{ fontSize: 16, color: '#2563eb' }} />
                          Testar Conexão com Gemini
                        </>
                      )}
                    </CleanButton>
                  </div>
                </div>
              </CleanCard>
            </div>
          </ContentArea>
        )}
      </MainLayout>
    </FullPageContainer>
  )
}
