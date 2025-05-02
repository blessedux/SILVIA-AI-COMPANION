"use client"

import { useEffect, useRef, useState } from "react"
import { pipeline } from "@xenova/transformers"

interface TTSPlayerProps {
  text: string
  onStart?: () => void
  onEnd?: () => void
}

export default function TTSPlayer({ text, onStart, onEnd }: TTSPlayerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    let synthesizer: any = null

    const initializeTTS = async () => {
      try {
        setIsLoading(true)
        // Initialize the TTS pipeline with a Spanish female voice model
        synthesizer = await pipeline('text-to-speech', 'facebook/fastspeech2-en-ljspeech')
        
        // Generate audio from text
        const audio = await synthesizer(text, {
          speaker_id: 0, // Female voice
          speed: 0.8, // Slightly slower for clarity
          pitch: 1.0, // Normal pitch
        })

        // Create audio element
        const audioBlob = new Blob([audio], { type: 'audio/wav' })
        const audioUrl = URL.createObjectURL(audioBlob)
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl
        }
      } catch (error) {
        console.error('Error generating speech:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeTTS()

    return () => {
      if (synthesizer) {
        synthesizer.dispose()
      }
    }
  }, [text])

  const handlePlay = () => {
    if (audioRef.current && !isLoading) {
      audioRef.current.play()
      setIsPlaying(true)
      onStart?.()
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    onEnd?.()
  }

  return (
    <div>
      <audio
        ref={audioRef}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      <button
        onClick={handlePlay}
        disabled={isLoading || isPlaying}
        className="text-sm text-slate-500 hover:text-slate-700"
      >
        {isLoading ? "Cargando..." : isPlaying ? "Reproduciendo..." : "Reproducir"}
      </button>
    </div>
  )
} 