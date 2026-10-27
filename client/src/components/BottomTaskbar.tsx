import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import VideocamIcon from '@mui/icons-material/Videocam'
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import MoodIcon from '@mui/icons-material/Mood'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import SearchIcon from '@mui/icons-material/Search'
import TimerIcon from '@mui/icons-material/Timer'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import PanToolIcon from '@mui/icons-material/PanTool'
import ScreenShareIcon from '@mui/icons-material/ScreenShare'
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import CampaignIcon from '@mui/icons-material/Campaign'
import StopIcon from '@mui/icons-material/Stop'
import DescriptionIcon from '@mui/icons-material/Description'

import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'
import { phaserEvents } from '../events/EventCenter'
import { useAppSelector, useAppDispatch } from '../hooks'
import { setShowJoystick } from '../stores/UserStore'
import { PlayerBehavior } from '../../../types/PlayerBehavior'
import MeetingHistoryDialog from './MeetingHistoryDialog'
import PostMeetingDigest from './PostMeetingDigest'
import StandupNotification from './StandupNotification'
import DepartmentManagerDialog from './DepartmentManagerDialog'
import { GeminiMeetingService } from '../services/GeminiMeetingService'
import { MeetingStorage, MeetingRecord } from '../services/MeetingStorage'
import { VideoStorageService } from '../services/VideoStorageService'
import { DailyStandupService, DailyStandupDigest } from '../services/DailyStandupService'
import { DepartmentRoom, DepartmentStorage } from '../services/DepartmentStorage'
import BusinessIcon from '@mui/icons-material/Business'
import store from '../stores'

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

// Barra de tarefas flutuante principal (estilo pill moderno translúcido)
const TaskbarWrapper = styled.div`
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 9999px;
  padding: 6px 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(0, 0, 0, 0.08);
  user-select: none;

  @media (max-width: 650px) {
    bottom: 12px;
    padding: 4px 6px;
    gap: 4px;
    max-width: calc(100vw - 72px);
  }
`

const ControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`

const ActionBtn = styled.button<{ $active?: boolean; $danger?: boolean }>`
  background: ${({ $active, $danger }) =>
    $danger ? '#fee2e2' : $active ? '#e0f2fe' : 'transparent'};
  color: ${({ $danger, $active }) =>
    $danger ? '#ef4444' : $active ? '#0284c7' : '#334155'};
  border: none;
  outline: none;
  cursor: pointer;
  border-radius: 9999px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  @media (max-width: 650px) {
    width: 34px;
    height: 34px;
    min-width: 34px;

    svg {
      font-size: 18px !important;
    }
  }

  &:hover {
    background: ${({ $danger }) => ($danger ? '#fecaca' : '#f1f5f9')};
    color: ${({ $danger }) => ($danger ? '#dc2626' : '#0f172a')};
  }

  &:active {
    transform: scale(0.95);
  }
`

const ChevronBtn = styled.button`
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  margin-left: -4px;

  @media (max-width: 650px) {
    display: none;
  }

  &:hover {
    color: #0f172a;
    background: rgba(0, 0, 0, 0.05);
  }
`

const UserThumbnail = styled.div`
  width: 48px;
  height: 36px;
  border-radius: 10px;
  background: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.15);
  margin-left: 6px;

  @media (max-width: 650px) {
    width: 34px;
    height: 30px;
    min-width: 34px;
    margin-left: 2px;

    img {
      height: 24px !important;
    }
  }

  img {
    height: 30px;
    image-rendering: pixelated;
  }

  .status-dot {
    position: absolute;
    bottom: 3px;
    right: 3px;
    width: 8px;
    height: 8px;
    background: #22c55e;
    border-radius: 50%;
    border: 1.5px solid #000;
  }
`

// Popup do menu "..." com opções avançadas (Imagem 3)
const PopupMenu = styled.div`
  position: absolute;
  bottom: 58px;
  right: 12px;
  background: #1c1e29;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.65);
  padding: 8px 0;
  min-width: 250px;
  display: flex;
  flex-direction: column;
  z-index: 10001;
  color: #f1f5f9;
  animation: fadeIn 0.15s ease-out;

  @media (max-width: 650px) {
    bottom: 50px;
    right: 50%;
    transform: translateX(50%);
    min-width: 220px;
    max-width: 88vw;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

const MenuItem = styled.button<{ $danger?: boolean }>`
  background: transparent;
  border: none;
  color: ${({ $danger }) => ($danger ? '#f87171' : '#e2e8f0')};
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  text-align: left;
  transition: all 0.12s;

  .left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .shortcut {
    font-size: 10px;
    color: #64748b;
    background: rgba(255, 255, 255, 0.06);
    padding: 2px 6px;
    border-radius: 4px;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: ${({ $danger }) => ($danger ? '#ef4444' : '#ffffff')};
  }
`

// Popup flutuante de reações rápidas
const ReactionsBar = styled.div`
  position: absolute;
  bottom: 58px;
  left: 50%;
  transform: translateX(-50%);
  background: #1c1e29;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 9999px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.5);
  z-index: 10001;

  @media (max-width: 650px) {
    bottom: 50px;
    padding: 4px 8px;
    gap: 4px;
    max-width: 90vw;

    button {
      width: 28px !important;
      height: 28px !important;
      font-size: 16px !important;
    }
  }

  button {
    background: transparent;
    border: none;
    font-size: 20px;
    cursor: pointer;
    border-radius: 50%;
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.12s ease;

    &:hover {
      transform: scale(1.3);
      background: rgba(255, 255, 255, 0.1);
    }
  }
`

// Indicador de Gravação no topo da barra
const RecordingBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fee2e2;
  color: #b91c1c;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  margin-right: 4px;
  animation: pulse 1.5s infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
`

// Cronômetro flutuante
const TimerBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f0fdf4;
  color: #15803d;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  margin-right: 4px;
`

export default function BottomTaskbar() {
  const dispatch = useAppDispatch()
  const showJoystick = useAppSelector((state) => state.user.showJoystick)

  const [audioEnabled, setAudioEnabled] = useState(false)
  const [videoEnabled, setVideoEnabled] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [handRaised, setHandRaised] = useState(false)
  const myScreenStream = useAppSelector((state) => state.computer.myStream)
  const isScreenSharing = !!myScreenStream

  // Gravação de tela / áudio
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [isGeneratingAta, setIsGeneratingAta] = useState(false)
  const [showMeetingHistory, setShowMeetingHistory] = useState(false)
  const [digestMeeting, setDigestMeeting] = useState<MeetingRecord | null>(null)
  const [showDigestModal, setShowDigestModal] = useState(false)
  const [hasNewAtaBadge, setHasNewAtaBadge] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const recordingAudioContextRef = useRef<AudioContext | null>(null)
  const recordingActiveStreamsRef = useRef<MediaStream[]>([])
  const recordingStartTimeRef = useRef<number>(0)
  const speechRecognitionRef = useRef<any>(null)
  const liveTranscriptsRef = useRef<string[]>([])
  const taskbarRef = useRef<HTMLDivElement>(null)
  // Standup Diário Automático
  const [showStandupModal, setShowStandupModal] = useState(false)
  const [standupData, setStandupData] = useState<DailyStandupDigest | null>(null)

  // Gerenciador de Departamentos & Salas Fixas
  const [showDepartmentDialog, setShowDepartmentDialog] = useState(false)

  const handleSwitchDepartment = (dept: DepartmentRoom) => {
    const game = phaserGame?.scene?.keys?.game as Game
    const myName = game?.myPlayer?.playerName?.text || ''

    if (!DepartmentStorage.canUserAccess(dept, myName)) {
      alert(`⚠️ Você não tem permissão para acessar o departamento "${dept.name}". Contate o administrador.`)
      return
    }

    if (dept.accessType === 'password') {
      const pass = prompt(`Digite a senha para acessar "${dept.name}":`)
      if (pass !== dept.password) {
        alert('❌ Senha incorreta!')
        return
      }
    }

    // Teleporta o jogador suavemente para a ala do departamento selecionado
    if (game?.myPlayer) {
      let targetX = 705
      let targetY = 500

      if (dept.theme === 'ti_dev') {
        targetX = 1050
        targetY = 640
      } else if (dept.theme === 'executive') {
        targetX = 400
        targetY = 640
      } else if (dept.theme === 'creative') {
        targetX = 960
        targetY = 240
      }

      game.myPlayer.x = targetX
      game.myPlayer.y = targetY
      if (game.myPlayer.playerContainer) {
        game.myPlayer.playerContainer.x = targetX
        game.myPlayer.playerContainer.y = targetY
      }
      game.cameras.main.centerOn(targetX, targetY)
      alert(`➔ Você entrou no departamento: ${dept.name}!`)
    }
  }

  useEffect(() => {
    try {
      // Checa se já dispensou o standup hoje
      if (!DailyStandupService.isStandupDismissedToday()) {
        const allMeetings = MeetingStorage.getMeetings()
        if (allMeetings && allMeetings.length > 0) {
          const digest = DailyStandupService.generateDailyStandup(allMeetings)
          // Só exibe se houver reuniões gravadas
          if (digest && digest.totalMeetings > 0) {
            setStandupData(digest)
            // Pequeno delay de 1.5s para entrada suave no escritório
            const timer = setTimeout(() => {
              setShowStandupModal(true)
            }, 1500)
            return () => clearTimeout(timer)
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao verificar DailyStandup no mount:', err)
    }
  }, [])

  // Cronômetro pessoal (Pomodoro 25min)
  const [timerActive, setTimerActive] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(25 * 60)

  // Diálogo de Transmissão
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false)
  const [broadcastText, setBroadcastText] = useState('')

  // Mesa de trabalho vinculada e estado de sentar
  const [myDeskChair, setMyDeskChair] = useState<any>(null)
  const [isSitting, setIsSitting] = useState(false)

  useEffect(() => {
    const checkDeskAndSitting = () => {
      const game = phaserGame?.scene?.keys?.game as any
      if (!game) return

      if (game.myPlayer) {
        setIsSitting(game.myPlayer.playerBehavior === PlayerBehavior.SITTING)
      }

      if (!game.chairMap) return
      let found: any = null
      game.chairMap.forEach((chair: any) => {
        if (chair.isClaimedByMe(game.network?.mySessionId, game.myPlayer?.playerName?.text)) {
          found = chair
        }
      })
      setMyDeskChair(found)
    }

    const interval = setInterval(checkDeskAndSitting, 400)
    return () => clearInterval(interval)
  }, [])

  // Sincroniza estado de mídia com WebRTC
  useEffect(() => {
    const interval = setInterval(() => {
      const game = phaserGame?.scene?.keys?.game as Game
      if (game?.network?.webRTC) {
        setAudioEnabled(game.network.webRTC.isAudioEnabled())
        setVideoEnabled(game.network.webRTC.isVideoEnabled())
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Cronômetro de gravação
  useEffect(() => {
    let interval: any
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      setRecordingSeconds(0)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  // Cronômetro pessoal
  useEffect(() => {
    let interval: any
    if (timerActive) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerActive(false)
            alert('⏰ Seu tempo de foco terminou! Faça uma pausa.')
            return 25 * 60
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timerActive])

  // Atalho de teclado SHIFT + S para compartilhar tela
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault()
        handleToggleScreenShare()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isScreenSharing])

  // Fecha menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (taskbarRef.current && !taskbarRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false)
        setShowReactions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 1. Alterna Microfone
  const handleToggleAudio = () => {
    const game = phaserGame?.scene?.keys?.game as Game
    if (game?.network?.webRTC) {
      if (!game.network.webRTC.hasStream()) {
        game.network.webRTC.getUserMedia(true)
        setAudioEnabled(true)
        return
      }
      const newState = game.network.webRTC.toggleAudio()
      setAudioEnabled(newState)
    }
  }

  // 2. Alterna Câmera
  const handleToggleVideo = () => {
    const game = phaserGame?.scene?.keys?.game as Game
    if (game?.network?.webRTC) {
      if (!game.network.webRTC.hasStream()) {
        game.network.webRTC.getUserMedia(true)
        setVideoEnabled(true)
        return
      }
      const newState = game.network.webRTC.toggleVideo()
      setVideoEnabled(newState)
    }
  }

  // 3. Envia Reação Rápida
  const handleSendReaction = (emoji: string) => {
    const game = phaserGame?.scene?.keys?.game as Game
    if (game?.myPlayer) {
      game.myPlayer.updateDialogBubble(emoji)
      game.network?.addChatMessage(emoji)
    }
    setShowReactions(false)
  }

  // 4. Alterna Levantar Mão
  const handleToggleHand = () => {
    const nextHand = !handRaised
    setHandRaised(nextHand)
    const game = phaserGame?.scene?.keys?.game as Game
    if (game?.myPlayer) {
      if (nextHand) {
        game.myPlayer.updateDialogBubble('✋ Mão Levantada')
        game.network?.addChatMessage('✋ Levantou a mão!')
      } else {
        game.myPlayer.clearDialogBubble()
      }
    }
    setShowMoreMenu(false)
  }

  // 5. Gravar Reunião com Mixer de Áudio Completo (Microfone Local + Colegas WebRTC + Tela)
  const handleToggleRecording = async () => {
    setShowMoreMenu(false)
    if (isRecording) {
      // Para gravação
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      setIsRecording(false)
    } else {
      // Inicia gravação com Mixer de Áudio
      try {
        let displayStream: MediaStream | null = null
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
            displayStream = await navigator.mediaDevices.getDisplayMedia({
              video: true,
              audio: true,
            })
          }
        } catch (displayErr) {
          console.warn('getDisplayMedia não disponível ou cancelado, fallback para gravação de áudio/câmera:', displayErr)
        }

        const game = phaserGame?.scene?.keys?.game as Game
        const webRTC = game?.network?.webRTC

        // Cria o AudioContext para o mixer
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        const audioCtx = new AudioContextClass()
        recordingAudioContextRef.current = audioCtx
        const destination = audioCtx.createMediaStreamDestination()

        const activeStreams: MediaStream[] = []
        if (displayStream) {
          activeStreams.push(displayStream)
        }

        // 1. Conecta o áudio do compartilhamento de tela se disponível
        if (displayStream && displayStream.getAudioTracks().length > 0) {
          try {
            const displaySource = audioCtx.createMediaStreamSource(displayStream)
            displaySource.connect(destination)
          } catch (e) {
            console.warn('Não foi possível conectar áudio da tela:', e)
          }
        }

        // 2. Conecta o microfone local do usuário
        let localStream = webRTC?.getMyStream()
        if (!localStream || localStream.getAudioTracks().length === 0) {
          try {
            localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            activeStreams.push(localStream)
          } catch (e) {
            console.warn('Microfone local não disponível para gravação:', e)
          }
        }
        if (localStream && localStream.getAudioTracks().length > 0) {
          try {
            const localSource = audioCtx.createMediaStreamSource(localStream)
            localSource.connect(destination)
          } catch (e) {
            console.warn('Não foi possível conectar microfone local ao mixer:', e)
          }
        }

        // 3. Conecta o áudio de todos os outros colegas na reunião
        const remoteStreams = webRTC?.getAllRemoteStreams() || []
        remoteStreams.forEach((remStream) => {
          if (remStream.getAudioTracks().length > 0) {
            try {
              const remoteSource = audioCtx.createMediaStreamSource(remStream)
              remoteSource.connect(destination)
            } catch (e) {
              console.warn('Não foi possível conectar áudio remoto ao mixer:', e)
            }
          }
        })

        recordingActiveStreamsRef.current = activeStreams

        // Monta o stream combinado de gravação: Vídeo da tela ou câmera + Áudio mixado
        const mixedAudioTrack = destination.stream.getAudioTracks()[0]
        const videoTracks: MediaStreamTrack[] = displayStream ? displayStream.getVideoTracks() : (localStream ? localStream.getVideoTracks() : [])
        const tracksToRecord: MediaStreamTrack[] = [...videoTracks]
        if (mixedAudioTrack) {
          tracksToRecord.push(mixedAudioTrack)
        }
        const recordStream = new MediaStream(tracksToRecord)

        // Grava simultaneamente um buffer de áudio isolado de alta qualidade para o Gemini
        const audioOnlyStream = mixedAudioTrack ? new MediaStream([mixedAudioTrack]) : null
        let audioChunks: Blob[] = []
        let audioRecorder: MediaRecorder | null = null
        if (audioOnlyStream) {
          try {
            const audioMime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
              ? 'audio/webm;codecs=opus'
              : MediaRecorder.isTypeSupported('audio/webm')
              ? 'audio/webm'
              : MediaRecorder.isTypeSupported('audio/ogg')
              ? 'audio/ogg'
              : ''
            audioRecorder = audioMime
              ? new MediaRecorder(audioOnlyStream, { mimeType: audioMime, audioBitsPerSecond: 32000 })
              : new MediaRecorder(audioOnlyStream)
            audioRecorder.ondataavailable = (ev) => {
              if (ev.data && ev.data.size > 0) audioChunks.push(ev.data)
            }
            audioRecorder.start(1000)
          } catch (e) {
            console.warn('MediaRecorder de áudio não suportado, usando stream padrão:', e)
          }
        }

        // Inicia o reconhecimento de voz contínuo para transcrever o diálogo da reunião em tempo real
        liveTranscriptsRef.current = []
        try {
          const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
          if (SpeechRec) {
            const recognition = new SpeechRec()
            recognition.continuous = true
            recognition.interimResults = false
            recognition.lang = 'pt-BR'
            const currentGame = phaserGame?.scene?.keys?.game as Game
            const mySpeakerName = currentGame?.myPlayer?.playerName?.text || 'Participante'

            recognition.onresult = (ev: any) => {
              for (let i = ev.resultIndex; i < ev.results.length; ++i) {
                if (ev.results[i].isFinal) {
                  const speechText = ev.results[i][0].transcript.trim()
                  if (speechText) {
                    const elapsedSecs = recordingStartTimeRef.current > 0
                      ? Math.max(0, Math.round((Date.now() - recordingStartTimeRef.current) / 1000))
                      : 0
                    const mm = String(Math.floor(elapsedSecs / 60)).padStart(2, '0')
                    const ss = String(elapsedSecs % 60).padStart(2, '0')
                    liveTranscriptsRef.current.push(`[${mm}:${ss}] ${mySpeakerName}: ${speechText}`)
                    console.log(`[Reunião Transcrição] [${mm}:${ss}] ${mySpeakerName}: ${speechText}`)
                  }
                }
              }
            }
            recognition.onerror = (err: any) => {
              console.warn('[SpeechRecognition] Detalhe:', err?.error)
            }
            recognition.start()
            speechRecognitionRef.current = recognition
          }
        } catch (e) {
          console.warn('[SpeechRecognition] Não suportado neste navegador:', e)
        }

        recordedChunksRef.current = []
        const mimeType = MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : MediaRecorder.isTypeSupported('video/mp4')
          ? 'video/mp4'
          : ''
        const recorder = mimeType ? new MediaRecorder(recordStream, { mimeType }) : new MediaRecorder(recordStream)
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data)
          }
        }

        // Se o usuário clicar em "Interromper compartilhamento" pela barra flutuante do navegador
        if (displayStream && displayStream.getVideoTracks()[0]) {
          displayStream.getVideoTracks()[0].onended = () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
              mediaRecorderRef.current.stop()
              setIsRecording(false)
            }
          }
        }

        recorder.onstop = async () => {
          // Para o reconhecimento de fala
          if (speechRecognitionRef.current) {
            try {
              speechRecognitionRef.current.stop()
            } catch (e) {}
            speechRecognitionRef.current = null
          }

          // Aguarda o término seguro do gravador de áudio
          const audioBlob: Blob | null = await new Promise((resolve) => {
            if (!audioRecorder || audioRecorder.state === 'inactive') {
              resolve(audioChunks.length > 0 ? new Blob(audioChunks, { type: 'audio/webm' }) : null)
              return
            }
            audioRecorder.onstop = () => {
              resolve(audioChunks.length > 0 ? new Blob(audioChunks, { type: 'audio/webm' }) : null)
            }
            try {
              audioRecorder.stop()
            } catch (e) {
              resolve(audioChunks.length > 0 ? new Blob(audioChunks, { type: 'audio/webm' }) : null)
            }
          })

          const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
          const url = URL.createObjectURL(videoBlob)
          const fileName = `reuniao-skyoffice-${new Date().toISOString().slice(0, 10)}.webm`

          const a = document.createElement('a')
          a.style.display = 'none'
          a.href = url
          a.download = fileName
          document.body.appendChild(a)
          a.click()
          setTimeout(() => {
            document.body.removeChild(a)
          }, 100)

          // Encerra os streams de captura da gravação
          recordingActiveStreamsRef.current.forEach((st) => st.getTracks().forEach((track) => track.stop()))
          recordStream.getTracks().forEach((track) => track.stop())
          if (recordingAudioContextRef.current && recordingAudioContextRef.current.state !== 'closed') {
            recordingAudioContextRef.current.close().catch(() => {})
          }

          setIsGeneratingAta(true)
          try {
            const currentGame = phaserGame?.scene?.keys?.game as Game
            const roomName = (store.getState() as any).room?.roomName || 'Escritório Geral'
            const participants: string[] = []
            if (currentGame?.myPlayer?.playerName?.text) {
              participants.push(currentGame.myPlayer.playerName.text)
            }
            if (currentGame?.otherPlayerMap) {
              currentGame.otherPlayerMap.forEach((p) => {
                if (p.playerName?.text) participants.push(p.playerName.text)
              })
            }

            const elapsed = recordingStartTimeRef.current > 0
              ? Math.max(1, Math.round((Date.now() - recordingStartTimeRef.current) / 1000))
              : recordingSeconds

            const rawTranscript = liveTranscriptsRef.current.join('\n')

            const meeting = await GeminiMeetingService.generateMeetingNotes({
              audioBlob,
              rawTranscript,
              roomName,
              participants: participants.length > 0 ? participants : ['Você'],
              durationSeconds: elapsed,
              meetingTitle: `Reunião - ${roomName}`,
            })

            meeting.videoBlobUrl = url
            meeting.videoFileName = fileName
            MeetingStorage.saveMeeting(meeting)

            // Salva o arquivo de vídeo no IndexedDB local para acesso offline instantâneo
            VideoStorageService.saveVideo(meeting.id, videoBlob).catch((e) =>
              console.warn('Erro ao salvar no IndexedDB', e)
            )

            // Faz upload do vídeo para o servidor para que todos os outros membros do escritório possam assistir e baixar
            MeetingStorage.uploadVideoToServer(meeting.id, videoBlob).catch((e) =>
              console.warn('Erro ao enviar vídeo gravado para o servidor compartilhado', e)
            )

            // Ativa o Digest pós-reunião e o badge visual
            setDigestMeeting(meeting)
            setShowDigestModal(true)
            setHasNewAtaBadge(true)
          } catch (err) {
            console.error('Erro ao gerar ata com IA', err)
          } finally {
            setIsGeneratingAta(false)
          }
        }

        recordingStartTimeRef.current = Date.now()
        recorder.start(1000)
        mediaRecorderRef.current = recorder
        setIsRecording(true)
      } catch (err) {
        console.warn('Gravação cancelada ou não permitida', err)
      }
    }
  }

  // 6. Compartilhar Tela com todos os membros da sala
  const handleToggleScreenShare = async () => {
    setShowMoreMenu(false)

    const manager = store.getState().computer.shareScreenManager
    if (!manager) {
      window.alert(
        'O compartilhamento de tela ainda não está pronto. Aguarde a conexão com o escritório e tente novamente.'
      )
      return
    }

    if (manager.myStream) {
      manager.stopScreenShare()
    } else {
      await manager.startRoomShare()
    }
  }

  // 7. Envia Transmissão Geral
  const handleSendBroadcast = () => {
    if (!broadcastText.trim()) return
    const game = phaserGame?.scene?.keys?.game as Game
    if (game?.myPlayer) {
      const msg = `📢 [TRANSMISSÃO]: ${broadcastText.trim()}`
      game.myPlayer.updateDialogBubble(msg)
      game.network?.addChatMessage(msg)
    }
    setBroadcastText('')
    setShowBroadcastDialog(false)
  }

  // Formata tempo (MM:SS)
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Recupera avatar atual
  let currentAvatar = Adam
  try {
    const game = phaserGame?.scene?.keys?.game as Game
    const texture = game?.myPlayer?.playerTexture?.toLowerCase()
    if (texture && avatarMap[texture]) {
      currentAvatar = avatarMap[texture]
    }
  } catch (err) {}

  return (
    <>
      <TaskbarWrapper ref={taskbarRef}>
        {/* Indicador de Gravação se ativo */}
        {isRecording && (
          <Tooltip title="Clique para encerrar gravação">
            <RecordingBadge onClick={handleToggleRecording} style={{ cursor: 'pointer' }}>
              <FiberManualRecordIcon style={{ fontSize: 12, color: '#ef4444' }} />
              REC {formatTime(recordingSeconds)}
            </RecordingBadge>
          </Tooltip>
        )}

        {/* Indicador do Cronômetro Pessoal se ativo */}
        {timerActive && (
          <Tooltip title="Cronômetro pessoal ativo">
            <TimerBadge onClick={() => setTimerActive(false)} style={{ cursor: 'pointer' }}>
              <TimerIcon style={{ fontSize: 12 }} />
              {formatTime(timerSeconds)}
            </TimerBadge>
          </Tooltip>
        )}

        {/* 1. Microfone */}
        <ControlGroup>
          <Tooltip title={audioEnabled ? 'Silenciar Microfone' : 'Ativar Microfone'}>
            <ActionBtn
              $danger={!audioEnabled}
              onClick={handleToggleAudio}
              aria-label="Toggle Microphone"
            >
              {audioEnabled ? <MicIcon style={{ fontSize: 21 }} /> : <MicOffIcon style={{ fontSize: 21 }} />}
            </ActionBtn>
          </Tooltip>
          <ChevronBtn onClick={handleToggleAudio}>
            <KeyboardArrowUpIcon style={{ fontSize: 14 }} />
          </ChevronBtn>
        </ControlGroup>

        {/* 2. Câmera */}
        <ControlGroup>
          <Tooltip title={videoEnabled ? 'Desligar Câmera' : 'Ligar Câmera'}>
            <ActionBtn
              $danger={!videoEnabled}
              onClick={handleToggleVideo}
              aria-label="Toggle Camera"
            >
              {videoEnabled ? <VideocamIcon style={{ fontSize: 22 }} /> : <VideocamOffIcon style={{ fontSize: 22 }} />}
            </ActionBtn>
          </Tooltip>
          <ChevronBtn onClick={handleToggleVideo}>
            <KeyboardArrowUpIcon style={{ fontSize: 14 }} />
          </ChevronBtn>
        </ControlGroup>

        {/* Botão de Atalho para Minha Mesa / Levantar da Cadeira */}
        {(myDeskChair || isSitting) && (
          <Tooltip title={isSitting ? 'Levantar da cadeira' : 'Caminhar até minha mesa de trabalho'}>
            <ActionBtn
              onClick={() => {
                const game = phaserGame?.scene?.keys?.game as any
                if (!game) return
                if (game.myPlayer?.playerBehavior === PlayerBehavior.SITTING) {
                  game.myPlayer.standUp(game.network)
                  setIsSitting(false)
                } else if (myDeskChair) {
                  phaserEvents.emit('NAVIGATE_TO_MY_DESK', myDeskChair)
                }
              }}
              style={{
                background: isSitting ? '#00ebc7' : 'rgba(0, 235, 199, 0.15)',
                border: isSitting ? '2px solid #00ebc7' : '1px solid rgba(0, 235, 199, 0.5)',
                color: isSitting ? '#0f172a' : '#00ebc7',
                boxShadow: isSitting ? '0 0 12px rgba(0, 235, 199, 0.7)' : 'none',
              }}
              aria-label={isSitting ? 'Levantar da cadeira' : 'Minha Mesa'}
            >
              <span style={{ fontSize: '18px' }}>🪑</span>
            </ActionBtn>
          </Tooltip>
        )}

        {/* 3. Reações Rápidas (Emoji) */}
        <Tooltip title="Reações Rápidas">
          <ActionBtn
            $active={showReactions}
            onClick={() => {
              setShowReactions(!showReactions)
              setShowMoreMenu(false)
            }}
            aria-label="Reactions"
          >
            <MoodIcon style={{ fontSize: 21 }} />
          </ActionBtn>
        </Tooltip>

        {/* 4. Mais Opções (...) */}
        <Tooltip title="Mais opções">
          <ActionBtn
            $active={showMoreMenu}
            onClick={() => {
              setShowMoreMenu(!showMoreMenu)
              setShowReactions(false)
            }}
            aria-label="More options"
          >
            <MoreHorizIcon style={{ fontSize: 22 }} />
          </ActionBtn>
        </Tooltip>

        {/* 4.5 Central de Atas & Gravações IA */}
        <Tooltip title={isGeneratingAta ? 'Gerando Ata com IA...' : 'Central de Atas & Gravações IA'}>
          <div style={{ position: 'relative' }}>
            <ActionBtn
              onClick={() => {
                setShowMeetingHistory(true)
                setHasNewAtaBadge(false)
              }}
              style={{
                background: isGeneratingAta ? '#063542' : '#091c36',
                border: '1.5px solid #00f5d4',
                color: '#00f5d4',
                animation: isGeneratingAta ? 'pulse 1.2s infinite' : 'none',
              }}
              aria-label="Meeting Notes & AI"
            >
              <DescriptionIcon style={{ fontSize: 20 }} />
            </ActionBtn>
            {hasNewAtaBadge && (
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: 10,
                  height: 10,
                  background: '#ef4444',
                  borderRadius: '50%',
                  border: '2px solid #ffffff',
                  boxShadow: '0 0 6px rgba(239, 68, 68, 0.8)',
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
        </Tooltip>

        {/* 4.6 Departamentos & Salas Fixas */}
        <Tooltip title="Departamentos & Salas Corporativas">
          <ActionBtn
            onClick={() => setShowDepartmentDialog(true)}
            style={{
              background: '#eff6ff',
              border: '1.5px solid #bfdbfe',
              color: '#2563eb',
            }}
            aria-label="Departamentos"
          >
            <BusinessIcon style={{ fontSize: 20 }} />
          </ActionBtn>
        </Tooltip>

        {/* 5. Miniatura / Avatar do Usuário */}
        <Tooltip title="Seu perfil no escritório">
          <UserThumbnail>
            <img src={currentAvatar} alt="Meu Avatar" />
            <div className="status-dot" />
          </UserThumbnail>
        </Tooltip>

        {/* Bar de Reações Rápidas Flutuante */}
        {showReactions && (
          <ReactionsBar>
            {['👏', '👍', '❤️', '🎉', '😂', '🚀', '🔥', '👋'].map((emoji) => (
              <button key={emoji} onClick={() => handleSendReaction(emoji)}>
                {emoji}
              </button>
            ))}
          </ReactionsBar>
        )}

        {/* Menu Pop-up com as Opções da Imagem 3 */}
        {showMoreMenu && (
          <PopupMenu>
            <MenuItem
              onClick={() => {
                setShowMoreMenu(false)
                setShowMeetingHistory(true)
              }}
            >
              <div className="left">
                <DescriptionIcon style={{ fontSize: 18, color: '#00f5d4' }} />
                <span>Central de Atas & Gravações</span>
              </div>
              <span className="shortcut" style={{ color: '#00f5d4', border: '1px solid #00f5d4' }}>IA</span>
            </MenuItem>
            <MenuItem
              onClick={() => {
                setShowMoreMenu(false)
                const searchInput = document.querySelector('input[placeholder*="Buscar colega"]') as HTMLInputElement
                searchInput?.focus()
              }}
            >
              <div className="left">
                <SearchIcon style={{ fontSize: 18, color: '#38bdf8' }} />
                <span>Busca global</span>
              </div>
            </MenuItem>

            <MenuItem
              onClick={() => {
                setShowMoreMenu(false)
                setTimerActive(!timerActive)
                if (!timerActive) setTimerSeconds(25 * 60)
              }}
            >
              <div className="left">
                <TimerIcon style={{ fontSize: 18, color: '#f59e0b' }} />
                <span>{timerActive ? 'Pausar cronômetro' : 'Iniciar um cronômetro pessoal'}</span>
              </div>
              <span className="shortcut">25m</span>
            </MenuItem>

            <MenuItem
              onClick={() => {
                setShowMoreMenu(false)
                dispatch(setShowJoystick(!showJoystick))
              }}
            >
              <div className="left">
                <SportsEsportsIcon style={{ fontSize: 18, color: '#a855f7' }} />
                <span>{showJoystick ? 'Ocultar Joystick' : 'Jogar um jogo / Joystick'}</span>
              </div>
            </MenuItem>

            <MenuItem onClick={handleToggleRecording} $danger={isRecording}>
              <div className="left">
                {isRecording ? (
                  <StopIcon style={{ fontSize: 18, color: '#ef4444' }} />
                ) : (
                  <FiberManualRecordIcon style={{ fontSize: 18, color: '#ef4444' }} />
                )}
                <span>{isRecording ? 'Parar Gravação' : 'Gravar Reunião'}</span>
              </div>
            </MenuItem>

            <MenuItem onClick={handleToggleHand}>
              <div className="left">
                <PanToolIcon style={{ fontSize: 18, color: handRaised ? '#eab308' : '#94a3b8' }} />
                <span>{handRaised ? 'Abaixar Mão' : 'Levantar Mão'}</span>
              </div>
            </MenuItem>

            <MenuItem onClick={handleToggleScreenShare}>
              <div className="left">
                {isScreenSharing ? (
                  <StopScreenShareIcon style={{ fontSize: 18, color: '#00ebc7' }} />
                ) : (
                  <ScreenShareIcon style={{ fontSize: 18, color: '#00ebc7' }} />
                )}
                <span>{isScreenSharing ? 'Parar Compartilhamento' : 'Compartilhar Tela'}</span>
              </div>
              <span className="shortcut">SHIFT + S</span>
            </MenuItem>

            <MenuItem
              onClick={() => {
                setShowMoreMenu(false)
                const game = phaserGame?.scene?.keys?.game as any
                if (!game) return
                let myChair: any = null
                game.chairMap?.forEach((chair: any) => {
                  if (chair.isClaimedByMe(game.network?.mySessionId, game.myPlayer?.playerName?.text)) {
                    myChair = chair
                  }
                })
                if (myChair) {
                  phaserEvents.emit('NAVIGATE_TO_MY_DESK', myChair)
                } else {
                  alert(
                    'Você ainda não vinculou nenhuma mesa de trabalho. Aproxime-se de uma mesa vazia e pressione C para vinculá-la!'
                  )
                }
              }}
            >
              <div className="left">
                <span style={{ fontSize: '18px' }}>🪑</span>
                <span>Ir para minha mesa</span>
              </div>
            </MenuItem>

            <MenuItem
              onClick={() => {
                setShowMoreMenu(false)
                setShowBroadcastDialog(true)
              }}
            >
              <div className="left">
                <CampaignIcon style={{ fontSize: 18, color: '#f43f5e' }} />
                <span>Transmissão</span>
              </div>
            </MenuItem>
          </PopupMenu>
        )}
      </TaskbarWrapper>

      {/* Modal de Transmissão Geral */}
      <Dialog
        open={showBroadcastDialog}
        onClose={() => setShowBroadcastDialog(false)}
        PaperProps={{
          style: {
            background: '#1c1e29',
            color: '#f8fafc',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            minWidth: '380px',
          },
        }}
      >
        <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CampaignIcon style={{ color: '#f43f5e' }} />
          Fazer Transmissão para o Escritório
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Mensagem de anúncio"
            fullWidth
            variant="outlined"
            color="secondary"
            multiline
            rows={3}
            value={broadcastText}
            onChange={(e) => setBroadcastText(e.target.value)}
            placeholder="Ex: Pessoal, reunião geral na sala de conferência em 5 minutos!"
            InputLabelProps={{ style: { color: '#94a3b8' } }}
            InputProps={{ style: { color: '#ffffff' } }}
          />
        </DialogContent>
        <DialogActions style={{ padding: '16px' }}>
          <Button onClick={() => setShowBroadcastDialog(false)} style={{ color: '#94a3b8' }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSendBroadcast}
            variant="contained"
            style={{ background: '#f43f5e', color: '#ffffff', fontWeight: 'bold' }}
          >
            Transmitir
          </Button>
        </DialogActions>
      </Dialog>

      <MeetingHistoryDialog
        open={showMeetingHistory}
        onClose={() => setShowMeetingHistory(false)}
      />

      <PostMeetingDigest
        open={showDigestModal}
        meeting={digestMeeting}
        onClose={() => setShowDigestModal(false)}
        onOpenFullMeeting={() => {
          setShowDigestModal(false)
          setShowMeetingHistory(true)
          setHasNewAtaBadge(false)
        }}
      />

      <StandupNotification
        open={showStandupModal}
        standup={standupData}
        onClose={() => setShowStandupModal(false)}
        onOpenMinutes={() => {
          setShowStandupModal(false)
          setShowMeetingHistory(true)
          setHasNewAtaBadge(false)
        }}
      />

      <DepartmentManagerDialog
        open={showDepartmentDialog}
        onClose={() => setShowDepartmentDialog(false)}
        onSwitchDepartment={handleSwitchDepartment}
      />
    </>
  )
}
