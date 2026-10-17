import React, { useState, useEffect } from 'react'
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
import Alert from '@mui/material/Alert'

import { MeetingRecord, MeetingStorage } from '../services/MeetingStorage'

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

const TaskCard = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #10b981;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  .task-text {
    font-size: 14px;
    font-weight: 500;
    color: #1e293b;
  }

  .task-badges {
    display: flex;
    gap: 8px;
    align-items: center;

    .assignee-badge {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      font-size: 12px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 6px;
    }

    .deadline-badge {
      background: #f1f5f9;
      color: #64748b;
      font-size: 12px;
      padding: 3px 8px;
      border-radius: 6px;
    }
  }
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
                    <span>{new Date(m.createdAt).toLocaleDateString('pt-BR')}</span>
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
                        {new Date(selectedMeeting.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      <span>
                        <AccessTimeOutlinedIcon style={{ fontSize: 15, color: '#2563eb' }} />
                        {selectedMeeting.durationFormatted}
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

                  <div className="action-buttons">
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

                {/* ✅ Itens de Ação (Tarefas e Responsáveis) */}
                <CleanCard>
                  <h3>✅ Itens de Ação (Tarefas e Responsáveis)</h3>
                  {selectedMeeting.actionItems.map((act, idx) => (
                    <TaskCard key={idx}>
                      <span className="task-text">✓ {act.task}</span>
                      <div className="task-badges">
                        <span className="assignee-badge">👤 {act.assignee}</span>
                        {act.deadline && <span className="deadline-badge">⏰ {act.deadline}</span>}
                      </div>
                    </TaskCard>
                  ))}
                </CleanCard>

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

              {selectedMeeting?.videoBlobUrl ? (
                <CleanCard>
                  <video
                    src={selectedMeeting.videoBlobUrl}
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
                      href={selectedMeeting.videoBlobUrl}
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
                  Chave da API do Google Gemini salva com sucesso no navegador!
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
                    onChange={(e) => setApiKey(e.target.value)}
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

                  <div style={{ marginTop: 10 }}>
                    <CleanButton $variant="primary" onClick={handleSaveApiKey}>
                      <CheckCircleIcon style={{ fontSize: 16 }} />
                      Salvar Chave de API
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
