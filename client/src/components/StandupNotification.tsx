import React from 'react'
import styled, { keyframes } from 'styled-components'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined'
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

import { DailyStandupDigest, DailyStandupService } from '../services/DailyStandupService'

const popIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 10006;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
`

const StandupCard = styled.div`
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.2);
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: ${popIn} 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  color: #1e293b;
`

const CardHeader = styled.div`
  padding: 20px 24px;
  background: linear-gradient(135deg, #1e3a8a, #2563eb);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .header-content {
    display: flex;
    align-items: center;
    gap: 12px;

    .icon-box {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    p {
      margin: 2px 0 0 0;
      font-size: 13px;
      opacity: 0.85;
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }

  .close-btn {
    background: transparent;
    border: none;
    color: #ffffff;
    cursor: pointer;
    opacity: 0.85;
    padding: 6px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;

    &:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.15);
    }
  }
`

const CardBody = styled.div`
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;

  .metric-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;

    .metric {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px;
      text-align: center;

      .number {
        font-size: 20px;
        font-weight: 700;
        color: #2563eb;
      }

      .label {
        font-size: 11px;
        color: #64748b;
        font-weight: 600;
        text-transform: uppercase;
        margin-top: 2px;
      }
    }
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .item-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .commitment-card {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 13px;
      color: #92400e;
      display: flex;
      justify-content: space-between;
      align-items: center;

      strong {
        color: #78350f;
      }

      .deadline {
        font-size: 11px;
        background: #fef3c7;
        padding: 2px 8px;
        border-radius: 6px;
        color: #b45309;
        font-weight: 600;
      }
    }

    .decision-item {
      background: #f5f3ff;
      border: 1px solid #ddd6fe;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 13px;
      color: #5b21b6;
    }
  }
`

const CardFooter = styled.div`
  padding: 16px 24px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  .dismiss-btn {
    background: transparent;
    border: 1px solid #cbd5e1;
    color: #475569;
    padding: 10px 18px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
  }

  .primary-btn {
    background: #2563eb;
    color: #ffffff;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background 0.15s ease;

    &:hover {
      background: #1d4ed8;
    }
  }
`

interface Props {
  open: boolean
  standup: DailyStandupDigest | null
  onClose: () => void
  onOpenMinutes: () => void
}

export default function StandupNotification({
  open,
  standup,
  onClose,
  onOpenMinutes,
}: Props) {
  if (!open || !standup) return null

  const handleDismiss = () => {
    DailyStandupService.dismissStandupToday()
    onClose()
  }

  return (
    <ModalBackdrop onClick={handleDismiss}>
      <StandupCard onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <div className="header-content">
            <div className="icon-box">
              <AutoAwesomeIcon style={{ fontSize: 24 }} />
            </div>
            <div>
              <h3>Standup Diário • Bia IA</h3>
              <p>
                <CalendarTodayIcon style={{ fontSize: 13 }} />
                {standup.dateFormatted}
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={handleDismiss} title="Fechar">
            <CloseIcon style={{ fontSize: 20 }} />
          </button>
        </CardHeader>

        <CardBody>
          <div className="metric-cards">
            <div className="metric">
              <div className="number">{standup.totalMeetings}</div>
              <div className="label">Reuniões</div>
            </div>
            <div className="metric">
              <div className="number">{standup.totalCommitments}</div>
              <div className="label">Compromissos</div>
            </div>
            <div className="metric">
              <div className="number">{standup.recentDecisions.length}</div>
              <div className="label">Decisões</div>
            </div>
          </div>

          {standup.pendingCommitments.length > 0 && (
            <div className="section">
              <div className="section-title">
                <FlagOutlinedIcon style={{ fontSize: 16, color: '#b45309' }} />
                Compromissos Pendentes da Equipe
              </div>
              <div className="item-list">
                {standup.pendingCommitments.map((c, idx) => (
                  <div className="commitment-card" key={idx}>
                    <div>
                      <strong>{c.responsiblePerson}:</strong> {c.description}
                    </div>
                    {c.deadline && <span className="deadline">{c.deadline}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {standup.recentDecisions.length > 0 && (
            <div className="section">
              <div className="section-title">
                <GavelOutlinedIcon style={{ fontSize: 16, color: '#6d28d9' }} />
                Últimas Decisões Tomadas
              </div>
              <div className="item-list">
                {standup.recentDecisions.map((d, idx) => (
                  <div className="decision-item" key={idx}>
                    • <strong>{d.decision}</strong> ({d.meetingTitle})
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardBody>

        <CardFooter>
          <button className="dismiss-btn" onClick={handleDismiss}>
            Entendido, começar o dia
          </button>
          <button
            className="primary-btn"
            onClick={() => {
              handleDismiss()
              onOpenMinutes()
            }}
          >
            Ver Todas as Atas
            <ArrowForwardIcon style={{ fontSize: 16 }} />
          </button>
        </CardFooter>
      </StandupCard>
    </ModalBackdrop>
  )
}
