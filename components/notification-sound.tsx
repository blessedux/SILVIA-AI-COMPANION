"use client"

import { useEffect, useRef } from "react"

interface NotificationSoundProps {
  play: boolean
}

export default function NotificationSound({ play }: NotificationSoundProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (play && audioRef.current) {
      audioRef.current.play()
    }
  }, [play])

  return (
    <audio
      ref={audioRef}
      src="/SILVIA RINGTONE.mp3"
      preload="auto"
    />
  )
} 