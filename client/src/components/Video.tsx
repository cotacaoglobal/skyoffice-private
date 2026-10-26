import React, { VideoHTMLAttributes, useEffect, useRef } from 'react'

type PropsType = VideoHTMLAttributes<HTMLVideoElement> & {
  srcObject: MediaStream
}

export default function Video({ srcObject, ...props }: PropsType) {
  const refVideo = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = refVideo.current
    if (!video) return
    video.srcObject = srcObject

    const tryPlay = () => {
      video.play().catch(() => {
        // Se o navegador bloquear autoplay com som, força muted e tenta novamente
        video.muted = true
        video.play().catch(() => {})
      })
    }

    tryPlay()
    video.onloadedmetadata = () => {
      tryPlay()
    }
  }, [srcObject])

  return <video ref={refVideo} playsInline autoPlay {...props} />
}
