import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DownloadIcon from '@mui/icons-material/Download'
import PlayCircleIcon from '@mui/icons-material/PlayCircle'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary'
import DescriptionIcon from '@mui/icons-material/Description'
import SettingsIcon from '@mui/icons-material/Settings'
import PersonIcon from '@mui/icons-material/Person'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import Alert from '@mui/material/Alert'

import { MeetingRecord, MeetingStorage } from '../services/MeetingStorage'

const PixelCorner = styled.div<{ $position: 'tl' | 'tr' | 'bl' | 'br' }>`
  position: absolute;
  width: 14px;
  height: 14px;
  background: #00f5d4;
  border: 2px solid #020b17;
  box-shadow: 
    0 0 8px #00f5d4,
    inset -2px -2px 0 #0f766e,
    inset 2px 2px 0 #ffffff;
  z-index: 10;

  ${({ $position }) =>
    $position === 'tl' &&
    `
    top: -4px;
    left: -4px;
    border-radius: 3px 0 0 0;
  `}

  ${({ $position }) =>
    $position === 'tr' &&
    `
    top: -4px;
    right: -4px;
    border-radius: 0 3px 0 0;
  `}

  ${({ $position }) =>
    $position === 'bl' &&
    `
    bottom: -4px;
    left: -4px;
    border-radius: 0 0 0 3px;
  `}

  ${({ $position }) =>
    $position === 'br' &&
    `
    bottom: -4px;
    right: -4px;
    border-radius: 0 0 3px 0;
  `}
`

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(4, 9, 20, 0.75);
  backdrop-filter: blur(6px);
  z-index: 10005;
  display: flex;
  align-items: center;
  justify-content: center;
`

const DialogWrapper = styled.div`
  position: relative;
  background: #091326;
  border: 4px solid #083344;
  border-radius: 20px;
  width: 950px;
  max-width: calc(100vw - 24px);
  height: 650px;
  max-height: 92vh;
  box-shadow: 
    0 0 0 2px #020b17,
    0 20px 50px rgba(0, 0, 0, 0.85),
    0 0 30px rgba(0, 235, 199, 0.22),
    inset 0 0 0 2px #0d4a5e;
  display: flex;
  flex-direction: column;
  color: #f8fafc;
  box-sizing: border-box;
  overflow: hidden;

  @media (max-width: 768px) {
    height: 94vh;
    max-height: 94vh;
  }
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: #061e2f;
  border-bottom: 2px solid #083344;

  .title-box {
    display: flex;
    align-items: center;
    gap: 12px;

    h2 {
      margin: 0;
      font-family: 'Silkscreen', monospace, sans-serif;
      font-size: 17px;
      color: #ffffff;
      text-shadow: 0 2px 0 #000;
    }

    p {
      margin: 2px 0 0 0;
      font-size: 11px;
      color: #94a3b8;
    }
  }

  .close-btn {
    color: #64748b;
    transition: color 0.15s;
    &:hover {
      color: #00f5d4;
    }
  }
`

const TabsBar = styled.div`
  display: flex;
  gap: 8px;
  padding: 10px 24px;
  background: #0a1730;
  border-bottom: 1px solid #162a4d;
  overflow-x: auto;
`

const TabBtn = styled.button<{ $active: boolean }>`
  background: ${({ $active }) => ($active ? '#063542' : 'transparent')};
  border: 2px solid ${({ $active }) => ($active ? '#00f5d4' : 'transparent')};
  color: ${({ $active }) => ($active ? '#00f5d4' : '#94a3b8')};
  font-family: 'Silkscreen', monospace, sans-serif;
  font-size: 12px;
  font-weight: 700;
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.15s;
  outline: none;

  &:hover {
    color: #00f5d4;
    background: #0d2838;
  }
`

const Body = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`

const ListPanel = styled.div`
  width: 320px;
  background: #061124;
  border-right: 2px solid #0d2440;
  display: flex;
  flex-direction: column;
  overflow-y: auto;

  @media (max-width: 768px) {
    width: 100%;
    max-height: 180px;
    border-right: none;
    border-bottom: 2px solid #0d2440;
  }
`

const SearchWrapper = styled.div`
  padding: 12px;
  border-bottom: 1px solid #12223d;
  position: relative;
  display: flex;
  align-items: center;

  .search-icon {
    position: absolute;
    left: 22px;
    color: #00f5d4;
    font-size: 18px;
  }

  input {
    width: 100%;
    background: #0a1936;
    border: 1px solid #0284c7;
    border-radius: 8px;
    padding: 8px 10px 8px 34px;
    color: #ffffff;
    font-size: 12px;
    outline: none;

    &:focus {
      border-color: #00f5d4;
      box-shadow: 0 0 8px rgba(0, 245, 212, 0.4);
    }
  }
`

const MeetingCard = styled.div<{ $selected: boolean }>`
  padding: 12px 14px;
  border-bottom: 1px solid #0b1a33;
  background: ${({ $selected }) => ($selected ? '#0a273b' : 'transparent')};
  border-left: 3px solid ${({ $selected }) => ($selected ? '#00f5d4' : 'transparent')};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: #0a2033;
  }

  h4 {
    margin: 0 0 4px 0;
    font-size: 13px;
    font-weight: 600;
    color: ${({ $selected }) => ($selected ? '#00f5d4' : '#e2e8f0')};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 11px;
    color: #64748b;
  }
`

const DetailPanel = styled.div`
  flex: 1;
  padding: 20px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
`

const SectionBox = styled.div`
  background: #07152b;
  border: 1px solid #0d2c4d;
  border-radius: 12px;
  padding: 14px 18px;

  h3 {
    margin: 0 0 10px 0;
    font-family: 'Silkscreen', monospace, sans-serif;
    font-size: 13px;
    color: #00f5d4;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  ul {
    margin: 0;
    padding-left: 20px;
    li {
      margin-bottom: 6px;
      font-size: 13px;
      line-height: 1.5;
      color: #cbd5e1;
    }
  }
`

const ActionItemCard = styled.div`
  background: #092038;
  border-left: 3px solid #38ef7d;
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .task {
    font-size: 12px;
    color: #f1f5f9;
    font-weight: 500;
  }

  .tags {
    display: flex;
    gap: 8px;
    align-items: center;

    .assignee {
      background: #063542;
      border: 1px solid #00f5d4;
      color: #00f5d4;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Silkscreen', monospace, sans-serif;
    }

    .deadline {
      background: #1e293b;
      color: #94a3b8;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
    }
  }
`

const PixelButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 8px 14px;
  border-radius: 8px;
  font-family: 'Silkscreen', monospace, sans-serif;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
  outline: none;

  ${({ $variant }) =>
    $variant === 'secondary'
      ? `
    background: #091f36;
    border: 1px solid #0284c7;
    color: #38bdf8;
    &:hover {
      background: #0d2b4a;
      border-color: #00f5d4;
      color: #00f5d4;
    }
  `
      : `
    background: linear-gradient(180deg, #00f5d4 0%, #00c9ab 100%);
    border: 1px solid #002b24;
    border-top: 1px solid #a7f3d0;
    border-bottom: 3px solid #036b5c;
    color: #01221b;
    &:hover {
      background: linear-gradient(180deg, #38ef7d 0%, #00f5d4 100%);
    }
    &:active {
      transform: translateY(2px);
    }
  `}
`

interface Props {
  open: boolean
  onClose: () => void
}

export default function MeetingHistoryDialog({ open, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'minutes' | 'videos' | 'settings'>('minutes')
  const [meetings, setMeetings] = useState<MeetingRecord[]>([])
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    if (open) {
      const records = MeetingStorage.getMeetings()
      setMeetings(records)
      if (records.length > 0) {
        setSelectedMeetingId(records[0].id)
      }
      setApiKey(MeetingStorage.getApiKey())
    }
  }, [open])

  if (!open) return null

  const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId) || meetings[0]

  const filteredMeetings = meetings.filter((m) => {
    const text = `${m.title} ${m.roomName} ${m.participants.join(' ')}`.toLowerCase()
    return text.includes(searchQuery.toLowerCase())
  })

  const handleCopyMinutes = () => {
    if (!selectedMeeting) return
    const text = `# 📋 Ata de Reunião: ${selectedMeeting.title}
**Data:** ${new Date(selectedMeeting.createdAt).toLocaleDateString('pt-BR')} | **Duração:** ${selectedMeeting.durationFormatted}
**Sala:** ${selectedMeeting.roomName}
**Participantes:** ${selectedMeeting.participants.join(', ')}

---

### 📌 Resumo dos Principais Pontos
${selectedMeeting.summary.map((s) => `* ${s}`).join('\n')}

---

### ⚖️ Decisões Tomadas
${selectedMeeting.decisions.map((d) => `* ${d}`).join('\n')}

---

### ✅ Itens de Ação (Tarefas e Responsáveis)
${selectedMeeting.actionItems.map((a) => `* [ ] **${a.task}** (Responsável: ${a.assignee} ${a.deadline ? `| Prazo: ${a.deadline}` : ''})`).join('\n')}
`
    navigator.clipboard.writeText(text)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2500)
  }

  const handleSaveApiKey = () => {
    MeetingStorage.setApiKey(apiKey)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2500)
  }

  return (
    <Overlay onClick={onClose}>
      <DialogWrapper onClick={(e) => e.stopPropagation()}>
        <PixelCorner $position="tl" />
        <PixelCorner $position="tr" />
        <PixelCorner $position="bl" />
        <PixelCorner $position="br" />

        <Header>
          <div className="title-box">
            <SmartToyIcon style={{ color: '#00f5d4', fontSize: 26 }} />
            <div>
              <h2>Central de Reuniões & Atas IA</h2>
              <p>Histórico inteligente com Inteligência Artificial</p>
            </div>
          </div>
          <IconButton className="close-btn" onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Header>

        <TabsBar>
          <TabBtn $active={activeTab === 'minutes'} onClick={() => setActiveTab('minutes')}>
            <DescriptionIcon style={{ fontSize: 16 }} />
            Atas & Resumos IA
          </TabBtn>
          <TabBtn $active={activeTab === 'videos'} onClick={() => setActiveTab('videos')}>
            <VideoLibraryIcon style={{ fontSize: 16 }} />
            Vídeos Gravados
          </TabBtn>
          <TabBtn $active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
            <SettingsIcon style={{ fontSize: 16 }} />
            Configuração de IA
          </TabBtn>
        </TabsBar>

        <Body>
          {activeTab === 'minutes' && (
            <>
              <ListPanel>
                <SearchWrapper>
                  <SearchIcon className="search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar atas anteriores..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </SearchWrapper>
                {filteredMeetings.map((m) => (
                  <MeetingCard
                    key={m.id}
                    $selected={selectedMeeting?.id === m.id}
                    onClick={() => setSelectedMeetingId(m.id)}
                  >
                    <h4>{m.title}</h4>
                    <div className="meta">
                      <span>{new Date(m.createdAt).toLocaleDateString('pt-BR')}</span>
                      <span>•</span>
                      <span>{m.durationFormatted}</span>
                    </div>
                  </MeetingCard>
                ))}
                {filteredMeetings.length === 0 && (
                  <div style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 12 }}>
                    Nenhuma reunião encontrada.
                  </div>
                )}
              </ListPanel>

              {selectedMeeting ? (
                <DetailPanel>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      borderBottom: '1px solid #162a4d',
                      paddingBottom: 12,
                    }}
                  >
                    <div>
                      <h2 style={{ margin: '0 0 6px 0', fontSize: 18, color: '#f8fafc' }}>
                        {selectedMeeting.title}
                      </h2>
                      <div
                        style={{
                          display: 'flex',
                          gap: 14,
                          fontSize: 12,
                          color: '#94a3b8',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CalendarTodayIcon style={{ fontSize: 14, color: '#00f5d4' }} />
                          {new Date(selectedMeeting.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <AccessTimeIcon style={{ fontSize: 14, color: '#00f5d4' }} />
                          {selectedMeeting.durationFormatted}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <PersonIcon style={{ fontSize: 14, color: '#00f5d4' }} />
                          {selectedMeeting.participants.join(', ')}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <PixelButton $variant="secondary" onClick={handleCopyMinutes}>
                        <ContentCopyIcon style={{ fontSize: 14 }} />
                        {copySuccess ? 'Copiado!' : 'Copiar Ata'}
                      </PixelButton>
                    </div>
                  </div>

                  {/* Resumo */}
                  <SectionBox>
                    <h3>📌 Resumo dos Principais Pontos</h3>
                    <ul>
                      {selectedMeeting.summary.map((pt, idx) => (
                        <li key={idx}>{pt}</li>
                      ))}
                    </ul>
                  </SectionBox>

                  {/* Decisões */}
                  <SectionBox>
                    <h3>⚖️ Decisões Tomadas pela Equipe</h3>
                    <ul>
                      {selectedMeeting.decisions.map((dec, idx) => (
                        <li key={idx}>{dec}</li>
                      ))}
                    </ul>
                  </SectionBox>

                  {/* Ações */}
                  <SectionBox>
                    <h3>✅ Itens de Ação (Tarefas e Responsáveis)</h3>
                    {selectedMeeting.actionItems.map((act, idx) => (
                      <ActionItemCard key={idx}>
                        <span className="task">● {act.task}</span>
                        <div className="tags">
                          <span className="assignee">👤 {act.assignee}</span>
                          {act.deadline && <span className="deadline">⏰ {act.deadline}</span>}
                        </div>
                      </ActionItemCard>
                    ))}
                  </SectionBox>

                  {/* Transcrição */}
                  {selectedMeeting.transcript && (
                    <SectionBox>
                      <h3>📝 Transcrição / Detalhes da Conversa</h3>
                      <pre
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: '#94a3b8',
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'monospace',
                        }}
                      >
                        {selectedMeeting.transcript}
                      </pre>
                    </SectionBox>
                  )}
                </DetailPanel>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ color: '#64748b' }}>Selecione uma reunião para ver a ata.</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'videos' && (
            <DetailPanel>
              <h3 style={{ margin: 0, color: '#00f5d4', fontFamily: 'Silkscreen' }}>
                🎥 Galeria de Gravações de Reunião
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
                Assista às reuniões gravadas diretamente no navegador ou baixe o arquivo em alta definição.
              </p>

              {selectedMeeting?.videoBlobUrl ? (
                <div style={{ marginTop: 10 }}>
                  <video
                    src={selectedMeeting.videoBlobUrl}
                    controls
                    style={{
                      width: '100%',
                      maxHeight: '340px',
                      background: '#000',
                      borderRadius: 12,
                      border: '2px solid #00f5d4',
                    }}
                  />
                  <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                    <a
                      href={selectedMeeting.videoBlobUrl}
                      download={selectedMeeting.videoFileName || 'reuniao-skyoffice.webm'}
                      style={{ textDecoration: 'none' }}
                    >
                      <PixelButton $variant="primary">
                        <DownloadIcon style={{ fontSize: 15 }} />
                        Baixar Vídeo (.webm)
                      </PixelButton>
                    </a>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: '#07152b',
                    border: '2px dashed #0d2c4d',
                    borderRadius: 12,
                    padding: 40,
                    textAlign: 'center',
                    marginTop: 10,
                  }}
                >
                  <VideoLibraryIcon style={{ fontSize: 48, color: '#00f5d4', marginBottom: 12 }} />
                  <h4 style={{ margin: '0 0 6px 0', fontSize: 15 }}>
                    As gravações realizadas no escritório são salvas no seu computador
                  </h4>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b', maxWidth: 450, marginInline: 'auto' }}>
                    Ao clicar em <strong>"Gravar Reunião"</strong> na barra inferior, o vídeo e áudio dos participantes
                    são gravados e o download é disparado automaticamente para sua pasta Downloads.
                  </p>
                </div>
              )}
            </DetailPanel>
          )}

          {activeTab === 'settings' && (
            <DetailPanel>
              <h3 style={{ margin: 0, color: '#00f5d4', fontFamily: 'Silkscreen' }}>
                ⚙️ Configurações da Inteligência Artificial
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
                Conecte sua chave da API do Google Gemini para transcrever e gerar atas automáticas com IA.
              </p>

              {saveSuccess && (
                <Alert severity="success" style={{ fontSize: 12, borderRadius: 8 }}>
                  Chave de API salva com sucesso no navegador!
                </Alert>
              )}

              <div
                style={{
                  background: '#07152b',
                  border: '1px solid #0d2c4d',
                  borderRadius: 12,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <label style={{ fontSize: 12, color: '#00f5d4', fontFamily: 'Silkscreen' }}>
                  Google Gemini API Key:
                </label>
                <input
                  type="password"
                  placeholder="Cole sua chave aqui (AIzaSy...)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={{
                    background: '#0a1936',
                    border: '1px solid #0284c7',
                    borderRadius: 8,
                    padding: '10px 14px',
                    color: '#ffffff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
                <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>
                  A chave do Gemini pode ser obtida gratuitamente em{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#00f5d4' }}
                  >
                    Google AI Studio
                  </a>{' '}
                  com limite gratuito muito generoso para atas corporativas.
                </p>

                <div style={{ marginTop: 6 }}>
                  <PixelButton $variant="primary" onClick={handleSaveApiKey}>
                    <CheckCircleIcon style={{ fontSize: 14 }} />
                    Salvar Configuração
                  </PixelButton>
                </div>
              </div>
            </DetailPanel>
          )}
        </Body>
      </DialogWrapper>
    </Overlay>
  )
}
