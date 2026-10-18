import Peer from 'peerjs'
import Network from '../services/Network'
import store from '../stores'
import { setVideoConnected } from '../stores/UserStore'

export default class WebRTC {
  private myPeer: Peer
  private peers = new Map<string, { call: Peer.MediaConnection; video: HTMLVideoElement; audio?: HTMLAudioElement; stream?: MediaStream }>()
  private onCalledPeers = new Map<string, { call: Peer.MediaConnection; video: HTMLVideoElement; audio?: HTMLAudioElement; stream?: MediaStream }>()
  private videoGrid = document.querySelector('.video-grid')
  private buttonGrid = document.querySelector('.button-grid')
  private myVideo = document.createElement('video')
  private myStream?: MediaStream
  private network: Network

  constructor(userId: string, network: Network) {
    const sanitizedId = this.replaceInvalidId(userId)
    this.myPeer = new Peer(sanitizedId, {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
        ],
      },
    })
    this.network = network
    console.log('userId:', userId)
    console.log('sanitizedId:', sanitizedId)
    this.myPeer.on('error', (err) => {
      console.log(err.type)
      console.error(err)
    })

    // mute your own video stream (you don't want to hear yourself)
    this.myVideo.muted = true

    // Torna a área da câmera arrastável tanto no mobile quanto no desktop
    this.initVideoGridDrag()

    // Desbloqueia áudio se houver restrição de autoplay do navegador ao interagir
    const unlockAudio = () => {
      this.peers.forEach((p) => {
        p.audio?.play().catch(() => {})
        p.video?.play().catch(() => {})
      })
      this.onCalledPeers.forEach((p) => {
        p.audio?.play().catch(() => {})
        p.video?.play().catch(() => {})
      })
    }
    window.addEventListener('click', unlockAudio, { passive: true })
    window.addEventListener('touchstart', unlockAudio, { passive: true })
    window.addEventListener('keydown', unlockAudio, { passive: true })

    // config peerJS
    this.initialize()
  }

  // PeerJS throws invalid_id error if it contains some characters such as that colyseus generates.
  // https://peerjs.com/docs.html#peer-id
  private replaceInvalidId(userId: string) {
    return userId.replace(/[^0-9a-z]/gi, 'G')
  }

  hasConnectionWith(userId: string): boolean {
    const sanitizedId = this.replaceInvalidId(userId)
    return this.peers.has(sanitizedId) || this.onCalledPeers.has(sanitizedId)
  }

  hasStream(): boolean {
    return !!this.myStream
  }

  /**
   * Retorna o stream de mídia local
   */
  getMyStream(): MediaStream | undefined {
    return this.myStream
  }

  /**
   * Retorna todos os streams remotos ativos para o mixer de gravação
   */
  getAllRemoteStreams(): MediaStream[] {
    const streams: MediaStream[] = []
    this.peers.forEach((p) => {
      if (p.stream) streams.push(p.stream)
    })
    this.onCalledPeers.forEach((p) => {
      if (p.stream) streams.push(p.stream)
    })
    return streams
  }

  initialize() {
    this.myPeer.on('call', (call) => {
      // Auto-obter mídia local caso o usuário receptor ainda não tenha iniciado
      if (!this.myStream) {
        this.getUserMedia(false)
      }

      const streamToSend = this.myStream || this.createAvatarStream()
      call.answer(streamToSend)

      let peerRecord = this.onCalledPeers.get(call.peer)
      if (!peerRecord) {
        const video = document.createElement('video')
        video.muted = false
        const audio = document.createElement('audio')
        audio.autoplay = true
        audio.style.display = 'none'
        document.body.appendChild(audio)

        peerRecord = { call, video, audio, stream: undefined }
        this.onCalledPeers.set(call.peer, peerRecord)
      } else {
        peerRecord.call = call
      }

      const currentRecord = peerRecord
      call.on('stream', (userVideoStream) => {
        currentRecord.stream = userVideoStream
        if (currentRecord.audio) {
          if (currentRecord.audio.srcObject !== userVideoStream) {
            currentRecord.audio.srcObject = userVideoStream
          }
          currentRecord.audio.play().catch((e) => {
            if (e.name !== 'AbortError') {
              console.warn('Erro ao tocar áudio recebido:', e)
            }
          })
        }
        this.addVideoStream(currentRecord.video, userVideoStream)
      })

      call.on('close', () => {
        this.deleteOnCalledVideoStream(call.peer)
      })

      call.on('error', (err) => {
        console.warn('Erro na chamada recebida:', err)
        this.deleteOnCalledVideoStream(call.peer)
      })
    })
  }

  // check if permission has been granted before
  checkPreviousPermission() {
    const permissionName = 'microphone' as PermissionName
    navigator.permissions?.query({ name: permissionName }).then((result) => {
      if (result.state === 'granted') this.getUserMedia(false)
    })
  }

  private createSilentAudioTrack(): MediaStreamTrack | undefined {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return undefined
      const audioCtx = new AudioContextClass()
      const dst = audioCtx.createMediaStreamDestination()
      return dst.stream.getAudioTracks()[0]
    } catch (e) {
      console.warn('Could not create silent audio track', e)
      return undefined
    }
  }

  private createAvatarStream(audioStream?: MediaStream): MediaStream {
    const canvas = document.createElement('canvas')
    canvas.width = 320
    canvas.height = 240
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#171821'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = '#00ebc7'
      ctx.beginPath()
      ctx.arc(160, 95, 42, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#171821'
      ctx.font = 'bold 36px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('👤', 160, 95)

      ctx.fillStyle = '#f8fafc'
      ctx.font = 'bold 15px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Ao Vivo', 160, 165)

      ctx.fillStyle = '#22c55e'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('● Conectado no escritório', 160, 190)
    }

    const canvasStream = (canvas as any).captureStream ? (canvas as any).captureStream(15) : null
    const videoTrack = canvasStream?.getVideoTracks()[0]

    const tracks: MediaStreamTrack[] = []
    if (audioStream) {
      const audioTrack = audioStream.getAudioTracks()[0]
      if (audioTrack) tracks.push(audioTrack)
    } else {
      const silentAudio = this.createSilentAudioTrack()
      if (silentAudio) tracks.push(silentAudio)
    }
    if (videoTrack) tracks.push(videoTrack)

    return new MediaStream(tracks)
  }

  private replaceTracksOnAllCalls(newStream: MediaStream) {
    const newVideoTrack = newStream.getVideoTracks()[0]
    const newAudioTrack = newStream.getAudioTracks()[0]

    const allConnections: Peer.MediaConnection[] = []
    this.peers.forEach((p) => allConnections.push(p.call))
    this.onCalledPeers.forEach((p) => allConnections.push(p.call))

    allConnections.forEach((conn) => {
      const pc: RTCPeerConnection = (conn as any).peerConnection
      if (pc && pc.getSenders) {
        const videoSender = pc.getSenders().find((s) => s.track?.kind === 'video')
        const audioSender = pc.getSenders().find((s) => s.track?.kind === 'audio')

        if (videoSender && newVideoTrack) {
          videoSender.replaceTrack(newVideoTrack).catch((err) => console.warn('Erro ao atualizar vídeo na chamada:', err))
        } else if (!videoSender && newVideoTrack) {
          try { pc.addTrack(newVideoTrack, newStream) } catch (e) {}
        }

        if (audioSender && newAudioTrack) {
          audioSender.replaceTrack(newAudioTrack).catch((err) => console.warn('Erro ao atualizar áudio na chamada:', err))
        } else if (!audioSender && newAudioTrack) {
          try { pc.addTrack(newAudioTrack, newStream) } catch (e) {}
        }
      }
    })
  }

  getUserMedia(alertOnError = true) {
    const askMedia = (constraints: MediaStreamConstraints) => {
      return navigator.mediaDevices?.getUserMedia(constraints)
    }

    // Tenta primeiro áudio + vídeo
    askMedia({ video: true, audio: true })
      .then((stream) => {
        this.myStream = stream
        this.addVideoStream(this.myVideo, this.myStream)
        this.replaceTracksOnAllCalls(this.myStream)
        this.setUpButtons()
        store.dispatch(setVideoConnected(true))
        this.network.videoConnected()
      })
      .catch((err) => {
        console.warn('Câmera indisponível ou em uso, conectando com microfone...', err)
        askMedia({ audio: true, video: false })
          .then((audioStream) => {
            this.myStream = this.createAvatarStream(audioStream)
            this.replaceTracksOnAllCalls(this.myStream)
            this.setUpButtons()
            store.dispatch(setVideoConnected(true))
            this.network.videoConnected()
          })
          .catch((finalErr) => {
            console.warn('Permissão de microfone não concedida, criando canal virtual para recepção...', finalErr)
            this.myStream = this.createAvatarStream()
            this.replaceTracksOnAllCalls(this.myStream)
            this.setUpButtons()
            store.dispatch(setVideoConnected(true))
            this.network.videoConnected()

            if (alertOnError) {
              const msg =
                finalErr.name === 'NotAllowedError' || finalErr.name === 'PermissionDeniedError'
                  ? 'Permissão negada! Clique no ícone de configurações ao lado do endereço e permita Câmera e Microfone.'
                  : `Aviso de mídia: ${finalErr.message || 'Verifique as permissões de microfone.'}`
              window.alert(msg)
            }
          })
      })
  }

  // method to call a peer
  connectToNewUser(userId: string) {
    const streamToSend = this.myStream || this.createAvatarStream()

    const sanitizedId = this.replaceInvalidId(userId)
    if (!this.peers.has(sanitizedId) && !this.onCalledPeers.has(sanitizedId)) {
      console.log('calling', sanitizedId)
      const call = this.myPeer.call(sanitizedId, streamToSend)
      const video = document.createElement('video')
      video.muted = false
      const audio = document.createElement('audio')
      audio.autoplay = true
      audio.style.display = 'none'
      document.body.appendChild(audio)

      const peerRecord = { call, video, audio, stream: undefined as MediaStream | undefined }
      this.peers.set(sanitizedId, peerRecord)

      call.on('stream', (userVideoStream) => {
        peerRecord.stream = userVideoStream
        if (audio.srcObject !== userVideoStream) {
          audio.srcObject = userVideoStream
        }
        audio.play().catch((e) => {
          if (e.name !== 'AbortError') {
            console.warn('Erro ao tocar áudio recebido:', e)
          }
        })
        this.addVideoStream(video, userVideoStream)
      })

      call.on('close', () => {
        this.deleteVideoStream(sanitizedId)
      })

      call.on('error', (err) => {
        console.warn('Erro na chamada emitida:', err)
        this.deleteVideoStream(sanitizedId)
      })
    }
  }

  // method to add new video stream to videoGrid div
  addVideoStream(video: HTMLVideoElement, stream: MediaStream) {
    video.srcObject = stream
    video.playsInline = true
    video.autoplay = true

    const updateDisplay = () => {
      const videoTrack = stream.getVideoTracks()[0]
      const isEnabled = videoTrack ? videoTrack.enabled : false
      video.style.display = isEnabled ? 'block' : 'none'
    }

    updateDisplay()

    const videoTrack = stream.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.onmute = () => {
        video.style.display = 'none'
      }
      videoTrack.onunmute = () => {
        if (videoTrack.enabled) video.style.display = 'block'
      }
    }

    // Monitor track additions (e.g. when sender dynamically upgrades stream)
    stream.onaddtrack = () => {
      updateDisplay()
      video.play().catch((err) => console.warn('Erro ao reproduzir stream:', err))
    }

    video.addEventListener('loadedmetadata', () => {
      updateDisplay()
      video.play().catch((err) => console.warn('Erro ao reproduzir stream:', err))
    })

    if (!this.videoGrid) {
      this.videoGrid = document.querySelector('.video-grid')
    }
    if (this.videoGrid && !video.parentElement) this.videoGrid.append(video)
  }

  // method to remove video stream (when we are the host of the call)
  deleteVideoStream(userId: string) {
    const sanitizedId = this.replaceInvalidId(userId)
    if (this.peers.has(sanitizedId)) {
      const peer = this.peers.get(sanitizedId)
      peer?.call.close()
      peer?.video.remove()
      peer?.audio?.remove()
      this.peers.delete(sanitizedId)
    }
  }

  // method to remove video stream (when we are the guest of the call)
  deleteOnCalledVideoStream(userId: string) {
    const sanitizedId = this.replaceInvalidId(userId)
    if (this.onCalledPeers.has(sanitizedId)) {
      const onCalledPeer = this.onCalledPeers.get(sanitizedId)
      onCalledPeer?.call.close()
      onCalledPeer?.video.remove()
      onCalledPeer?.audio?.remove()
      this.onCalledPeers.delete(sanitizedId)
    }
  }

  toggleAudio(): boolean {
    if (this.myStream) {
      const track = this.myStream.getAudioTracks()[0]
      if (track) {
        track.enabled = !track.enabled
        return track.enabled
      }
    }
    return false
  }

  isAudioEnabled(): boolean {
    if (this.myStream) {
      const track = this.myStream.getAudioTracks()[0]
      return track ? track.enabled : false
    }
    return false
  }

  toggleVideo(): boolean {
    if (this.myStream) {
      const track = this.myStream.getVideoTracks()[0]
      if (track) {
        track.enabled = !track.enabled
        this.myVideo.style.display = track.enabled ? 'block' : 'none'
        return track.enabled
      }
    }
    this.myVideo.style.display = 'none'
    return false
  }

  isVideoEnabled(): boolean {
    if (this.myStream) {
      const track = this.myStream.getVideoTracks()[0]
      return track ? track.enabled : false
    }
    return false
  }

  private initVideoGridDrag() {
    if (!this.videoGrid) return
    const grid = this.videoGrid as HTMLElement
    grid.style.cursor = 'grab'
    grid.style.touchAction = 'none'

    let isDragging = false
    let startX = 0
    let startY = 0
    let initialLeft = 0
    let initialTop = 0

    const onStart = (clientX: number, clientY: number) => {
      isDragging = true
      grid.style.cursor = 'grabbing'
      const rect = grid.getBoundingClientRect()
      startX = clientX
      startY = clientY
      initialLeft = rect.left
      initialTop = rect.top

      grid.style.position = 'fixed'
      grid.style.left = `${initialLeft}px`
      grid.style.top = `${initialTop}px`
      grid.style.right = 'auto'
      grid.style.bottom = 'auto'
    }

    const onMove = (clientX: number, clientY: number) => {
      if (!isDragging) return
      const dx = clientX - startX
      const dy = clientY - startY

      const rect = grid.getBoundingClientRect()
      const newLeft = Math.max(0, Math.min(window.innerWidth - rect.width, initialLeft + dx))
      const newTop = Math.max(0, Math.min(window.innerHeight - rect.height, initialTop + dy))

      grid.style.left = `${newLeft}px`
      grid.style.top = `${newTop}px`
    }

    const onEnd = () => {
      if (!isDragging) return
      isDragging = false
      grid.style.cursor = 'grab'
    }

    grid.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.button !== 0) return
      onStart(e.clientX, e.clientY)

      const handleMouseMove = (moveEv: MouseEvent) => onMove(moveEv.clientX, moveEv.clientY)
      const handleMouseUp = () => {
        onEnd()
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    })

    grid.addEventListener(
      'touchstart',
      (e: TouchEvent) => {
        if (e.touches.length !== 1) return
        const touch = e.touches[0]
        onStart(touch.clientX, touch.clientY)
      },
      { passive: true }
    )

    grid.addEventListener(
      'touchmove',
      (e: TouchEvent) => {
        if (!isDragging || e.touches.length !== 1) return
        e.preventDefault()
        const touch = e.touches[0]
        onMove(touch.clientX, touch.clientY)
      },
      { passive: false }
    )

    grid.addEventListener('touchend', onEnd)
    grid.addEventListener('touchcancel', onEnd)
  }

  setUpButtons() {
    // Substituído pela barra de tarefas moderna BottomTaskbar
  }
}
