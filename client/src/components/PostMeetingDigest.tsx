import React from 'react'
import styled, { keyframes } from 'styled-components'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CloseIcon from '@mui/icons-material/Close'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { MeetingRecord } from '../services/MeetingStorage'

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`

const DigestOverlay = styled.div`
  position: fixed;
  bottom: 84px;
  right: 28px;
  max-width: 440px;
  width: calc(100vw - 48px);
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.16);
  z-index: 10003;
  animation: ${slideUp} 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #1e293b;
`

const DigestHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: linear-gradient(135deg, #1e40af, #2563eb);
  color: #ffffff;

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;

    .icon-badge {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    h4 {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    span {
      font-size: 11px;
      opacity: 0.85;
    }
  }

  .close-btn {
    background: transparent;
    border: none;
    color: #ffffff;
    cursor: pointer;
    opacity: 0.8;
    padding: 4px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.15s;

    &:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.15);
    }
  }
`

const DigestBody = styled.div`
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 360px;
  overflow-y: auto;

  .meeting-info {
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
    display: flex;
    justify-content: space-between;
    align-items: center;

    span.duration {
      font-size: 11px;
      font-weight: 500;
      background: #f1f5f9;
      color: #64748b;
      padding: 2px 8px;
      border-radius: 12px;
    }
  }

  .section-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
  }

  .summary-list {
    margin: 0;
    padding-left: 18px;
    font-size: 13px;
    color: #334155;
    line-height: 1.5;

    li {
      margin-bottom: 4px;
    }
  }

  .commitments-badge-list {
    display: flex;
    flex-direction: column;
    gap: 6px;

    .commit-item {
      font-size: 12px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 6px 10px;
      color: #92400e;
      display: flex;
      align-items: center;
      gap: 6px;

      strong {
        color: #78350f;
      }
    }
  }
`

const DigestFooter = styled.div`
  padding: 12px 18px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  .action-btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    border: none;

    &.primary {
      background: #2563eb;
      color: #ffffff;

      &:hover {
        background: #1d4ed8;
      }
    }

    &.secondary {
      background: #ffffff;
      color: #475569;
      border: 1px solid #cbd5e1;

      &:hover {
        background: #f1f5f9;
        color: #0f172a;
      }
    }
  }
`

interface Props {
  meeting: MeetingRecord | null
  open: boolean
  onClose: () => void
  onOpenFullMeeting: (meetingId: string) => void
}

export default function PostMeetingDigest({
  meeting,
  open,
  onClose,
  onOpenFullMeeting,
}: Props) {
  const [copied, setCopied] = React.useState(false)

  if (!open || !meeting) return null

  const handleCopy = () => {
    const text = `📋 Ata Rápida da Bia — ${meeting.title}\n` +
      `Data: ${new Date(meeting.createdAt).toLocaleDateString('pt-BR')} | Sala: ${meeting.roomName}\n\n` +
      `📌 Resumo:\n${meeting.summary.map((s) => `• ${s}`).join('\n')}\n\n` +
      `⚖️ Decisões:\n${meeting.decisions.map((d) => `• ${d}`).join('\n')}\n`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <DigestOverlay>
      <DigestHeader>
        <div className="brand">
          <div className="icon-badge">
            <AutoAwesomeIcon style={{ fontSize: 18 }} />
          </div>
          <div>
            <h4>Bia IA • Ata Pronta!</h4>
            <span>Resumo automático pós-reunião</span>
          </div>
        </div>
        <button className="close-btn" onClick={onClose} title="Fechar notificação">
          <CloseIcon style={{ fontSize: 18 }} />
        </button>
      </DigestHeader>

      <DigestBody>
        <div className="meeting-info">
          <span>{meeting.title}</span>
          <span className="duration">⏱️ {meeting.durationFormatted}</span>
        </div>

        <div>
          <div className="section-label">📌 Destaques Principais</div>
          <ul className="summary-list">
            {meeting.summary.slice(0, 3).map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        {meeting.commitments && meeting.commitments.length > 0 && (
          <div>
            <div className="section-label">🔖 Compromissos Identificados</div>
            <div className="commitments-badge-list">
              {meeting.commitments.slice(0, 2).map((c, idx) => (
                <div className="commit-item" key={idx}>
                  <span>🔖</span>
                  <div>
                    <strong>{c.responsiblePerson}:</strong> {c.description} {c.deadline ? `(${c.deadline})` : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DigestBody>

      <DigestFooter>
        <button className="action-btn secondary" onClick={handleCopy}>
          {copied ? (
            <>
              <CheckCircleOutlineIcon style={{ fontSize: 16, color: '#16a34a' }} />
              Copiado!
            </>
          ) : (
            <>
              <ContentCopyIcon style={{ fontSize: 16 }} />
              Copiar
            </>
          )}
        </button>

        <button
          className="action-btn primary"
          onClick={() => {
            onClose()
            onOpenFullMeeting(meeting.id)
          }}
        >
          <OpenInNewIcon style={{ fontSize: 16 }} />
          Ver Ata Completa
        </button>
      </DigestFooter>
    </DigestOverlay>
  )
}
