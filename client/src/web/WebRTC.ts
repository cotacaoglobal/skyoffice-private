import Peer from 'peerjs'
import Network from '../services/Network'
import store from '../stores'
import { setVideoConnected } from '../stores/UserStore'

export default class WebRTC {
  private myPeer: Peer
  private peers = new Map<string, { call: Peer.MediaConnection; video: HTMLVideoElement }>()
  private onCalledPeers = new Map<string, { call: Peer.MediaConnection; video: HTMLVideoElement }>()
  private videoGrid = document.querySelector('.video-grid')
  private buttonGrid = document.querySelector('.button-grid')
  private myVideo = document.createElement('video')
  private myStream?: MediaStream
  private network: Network

  constructor(userId: string, network: Network) {
    const sanitizedId = this.replaceInvalidId(userId)
    this.myPeer = new Peer(sanitizedId)
    this.network = network
    console.log('userId:', userId)
    console.log('sanitizedId:', sanitizedId)
    this.myPeer.on('error', (err) => {
      console.log(err.type)
      console.error(err)
    })

    // mute your own video stream (you don't want to hear yourself)
    this.myVideo.muted = true

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

  initialize() {
    this.myPeer.on('call', (call) => {
      // If we already have an active outgoing call to this peer, break tie cleanly
      if (this.peers.has(call.peer)) {
        if (this.myPeer.id < call.peer) {
          this.deleteVideoStream(call.peer)
        } else {
          call.answer(this.myStream)
          return
        }
      }

      if (!this.onCalledPeers.has(call.peer)) {
        call.answer(this.myStream)
        const video = document.createElement('video')
        this.onCalledPeers.set(call.peer, { call, video })

        call.on('stream', (userVideoStream) => {
          this.addVideoStream(video, userVideoStream)
        })
      }
    })
  }

  // check if permission has been granted before
  checkPreviousPermission() {
    const permissionName = 'microphone' as PermissionName
    navigator.permissions?.query({ name: permissionName }).then((result) => {
      if (result.state === 'granted') this.getUserMedia(false)
    })
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
      ctx.fillText('Áudio Conectado', 160, 165)

      ctx.fillStyle = '#22c55e'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('● Ao vivo no escritório', 160, 190)
    }

    const canvasStream = (canvas as any).captureStream ? (canvas as any).captureStream(15) : null
    const videoTrack = canvasStream?.getVideoTracks()[0]

    const tracks: MediaStreamTrack[] = []
    if (audioStream) {
      const audioTrack = audioStream.getAudioTracks()[0]
      if (audioTrack) tracks.push(audioTrack)
    }
    if (videoTrack) tracks.push(videoTrack)

    return new MediaStream(tracks)
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
        this.setUpButtons()
        store.dispatch(setVideoConnected(true))
        this.network.videoConnected()
      })
      .catch((err) => {
        console.warn('Câmera indisponível ou em uso, tentando microfone + cartão ao vivo...', err)
        askMedia({ audio: true, video: false })
          .then((audioStream) => {
            this.myStream = this.createAvatarStream(audioStream)
            this.addVideoStream(this.myVideo, this.myStream)
            this.setUpButtons()
            store.dispatch(setVideoConnected(true))
            this.network.videoConnected()
          })
          .catch((finalErr) => {
            console.warn('Permissão de microfone não concedida, gerando stream virtual para receber lives...', finalErr)
            this.myStream = this.createAvatarStream()
            this.addVideoStream(this.myVideo, this.myStream)
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
    if (this.myStream) {
      const sanitizedId = this.replaceInvalidId(userId)
      if (!this.peers.has(sanitizedId) && !this.onCalledPeers.has(sanitizedId)) {
        console.log('calling', sanitizedId)
        const call = this.myPeer.call(sanitizedId, this.myStream)
        const video = document.createElement('video')
        this.peers.set(sanitizedId, { call, video })

        call.on('stream', (userVideoStream) => {
          this.addVideoStream(video, userVideoStream)
        })
      }
    }
  }

  // method to add new video stream to videoGrid div
  addVideoStream(video: HTMLVideoElement, stream: MediaStream) {
    video.srcObject = stream
    video.playsInline = true
    video.addEventListener('loadedmetadata', () => {
      video.play()
    })
    if (this.videoGrid) this.videoGrid.append(video)
  }

  // method to remove video stream (when we are the host of the call)
  deleteVideoStream(userId: string) {
    const sanitizedId = this.replaceInvalidId(userId)
    if (this.peers.has(sanitizedId)) {
      const peer = this.peers.get(sanitizedId)
      peer?.call.close()
      peer?.video.remove()
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
      this.onCalledPeers.delete(sanitizedId)
    }
  }

  // method to set up mute/unmute and video on/off buttons
  setUpButtons() {
    if (this.buttonGrid && this.buttonGrid.children.length > 0) return
    const audioButton = document.createElement('button')
    audioButton.innerText = 'Mute'
    audioButton.addEventListener('click', () => {
      if (this.myStream) {
        const audioTrack = this.myStream.getAudioTracks()[0]
        if (audioTrack.enabled) {
          audioTrack.enabled = false
          audioButton.innerText = 'Unmute'
        } else {
          audioTrack.enabled = true
          audioButton.innerText = 'Mute'
        }
      }
    })
    const videoButton = document.createElement('button')
    videoButton.innerText = 'Video off'
    videoButton.addEventListener('click', () => {
      if (this.myStream) {
        const audioTrack = this.myStream.getVideoTracks()[0]
        if (audioTrack.enabled) {
          audioTrack.enabled = false
          videoButton.innerText = 'Video on'
        } else {
          audioTrack.enabled = true
          videoButton.innerText = 'Video off'
        }
      }
    })
    this.buttonGrid?.append(audioButton)
    this.buttonGrid?.append(videoButton)
  }
}
