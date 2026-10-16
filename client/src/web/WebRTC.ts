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
        console.warn('Câmera indisponível, conectando apenas áudio/microfone...', err)
        askMedia({ audio: true, video: false })
          .then((audioStream) => {
            this.myStream = audioStream
            // Não adiciona card de vídeo local para áudio puro (removido a pedido do usuário)
            this.setUpButtons()
            store.dispatch(setVideoConnected(true))
            this.network.videoConnected()
          })
          .catch((finalErr) => {
            console.warn('Permissão de microfone não concedida, criando canal de áudio para recepção...', finalErr)
            this.myStream = new MediaStream()
            this.setUpButtons()
            store.dispatch(setVideoConnected(true))
            this.network.videoConnected()

            if (alertOnError) {
              const msg =
                finalErr.name === 'NotAllowedError' || finalErr.name === 'PermissionDeniedError'
                  ? 'Permissão negada! Clique no ícone de configurações ao lado do endereço e permita Microfone para conversar.'
                  : `Aviso de áudio: ${finalErr.message || 'Verifique as permissões de microfone.'}`
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
    const hasVideo = stream.getVideoTracks().length > 0
    if (!hasVideo) {
      video.style.display = 'none'
    } else {
      video.style.display = 'block'
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
        return track.enabled
      }
    }
    return false
  }

  isVideoEnabled(): boolean {
    if (this.myStream) {
      const track = this.myStream.getVideoTracks()[0]
      return track ? track.enabled : false
    }
    return false
  }

  setUpButtons() {
    // Substituído pela barra de tarefas moderna BottomTaskbar
  }
}
