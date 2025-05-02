"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import NotificationSound from "@/components/notification-sound"
import { Mic, MicOff } from "lucide-react"
import dynamic from 'next/dynamic'

// Declare types for speech recognition
declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition
    SpeechRecognition: new () => SpeechRecognition
  }
}

// Import the speech recognition component with no SSR
const SpeechRecognitionComponent = dynamic(
  () => import('../components/speech-recognition'),
  { ssr: false }
)

export default function Home() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")
  const [showNotification, setShowNotification] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  const [isClient, setIsClient] = useState(false)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  // First effect to set client-side flag
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Initialize speech synthesis only on client
  useEffect(() => {
    if (!isClient) return
    synthRef.current = window.speechSynthesis
  }, [isClient])

  const speak = (text: string) => {
    if (!synthRef.current) {
      console.error('Speech synthesis not available')
      return
    }

    // Cancel any ongoing speech
    synthRef.current.cancel()

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text)
    
    // Set Spanish voice if available
    const voices = synthRef.current.getVoices()
    console.log('Available voices:', voices)
    const spanishVoice = voices.find(voice => 
      voice.lang.includes('es') || voice.lang.includes('es-ES')
    )
    if (spanishVoice) {
      console.log('Using Spanish voice:', spanishVoice)
      utterance.voice = spanishVoice
    } else {
      console.log('No Spanish voice found, using default')
    }

    // Configure voice settings
    utterance.rate = 0.9 // Slightly slower for clarity
    utterance.pitch = 1.0 // Normal pitch
    utterance.volume = 1.0 // Full volume

    // Handle speech events
    utterance.onstart = () => {
      console.log('Speech synthesis started')
      setIsSpeaking(true)
    }
    utterance.onend = () => {
      console.log('Speech synthesis ended')
      setIsSpeaking(false)
    }
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event)
      setIsSpeaking(false)
    }

    // Speak
    synthRef.current.speak(utterance)
  }

  const handleUserInput = async (userMessage: string) => {
    try {
      console.log('Processing user input:', userMessage)
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      })

      const data = await res.json()
      console.log('Received response:', data)
      setResponse(data.response)
      
      if (data.shouldPlayNotification) {
        setShowNotification(true)
        setTimeout(() => setShowNotification(false), 1000)
      }

      // Speak the response
      speak(data.response)
    } catch (error) {
      console.error('Error processing user input:', error)
      setResponse("Lo siento, hubo un error al procesar tu solicitud.")
    }
  }

  const handleTranscript = (text: string) => {
    setTranscript(text)
    handleUserInput(text)
  }

  const handleError = (error: string) => {
    setError(error)
    if (error.includes('no soporta')) {
      setPermissionStatus('denied')
    }
  }

  const handlePermissionChange = (status: 'granted' | 'denied' | 'prompt') => {
    setPermissionStatus(status)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">SILVIA</h1>
          <p className="text-gray-600">Tu asistente virtual</p>
        </div>

        <NotificationSound play={showNotification} />

        <div className="w-full min-h-[200px] bg-white rounded-xl p-6 shadow-lg">
          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-600 rounded">
              <p>{error}</p>
            </div>
          )}
          {permissionStatus === 'denied' && (
            <div className="mb-4 p-2 bg-yellow-100 text-yellow-600 rounded">
              <p>Para usar SILVIA, necesitas permitir el acceso al micrófono. Por favor:</p>
              <ol className="list-decimal list-inside mt-2">
                <li>Haz clic en el ícono de candado o micrófono en la barra de direcciones</li>
                <li>Selecciona "Permitir" para el acceso al micrófono</li>
                <li>Actualiza la página</li>
              </ol>
            </div>
          )}
          {transcript && (
            <div className="mb-4">
              <p className="text-sm text-gray-500">Usted dijo:</p>
              <p className="text-gray-800">{transcript}</p>
            </div>
          )}
          {response && (
            <div>
              <p className="text-sm text-gray-500">SILVIA:</p>
              <p className="text-gray-800">{response}</p>
            </div>
          )}
        </div>

        {isClient && (
          <SpeechRecognitionComponent
            onTranscript={handleTranscript}
            onError={handleError}
            onPermissionChange={handlePermissionChange}
            isSpeaking={isSpeaking}
            isListening={isListening}
            setIsListening={setIsListening}
          />
        )}
      </div>
    </main>
  )
}
