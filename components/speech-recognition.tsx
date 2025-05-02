"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff } from "lucide-react"

interface SpeechRecognitionComponentProps {
  onTranscript: (text: string) => void
  onError: (error: string) => void
  onPermissionChange: (status: 'granted' | 'denied' | 'prompt') => void
  isSpeaking: boolean
  isListening: boolean
  setIsListening: (isListening: boolean) => void
}

const SpeechRecognitionComponent = ({
  onTranscript,
  onError,
  onPermissionChange,
  isSpeaking,
  isListening,
  setIsListening
}: SpeechRecognitionComponentProps) => {
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const isRecognitionActive = useRef(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const maxRetries = 3
  const initializationAttempted = useRef(false)

  // Initialize speech recognition
  useEffect(() => {
    if (isInitialized || initializationAttempted.current) return
    initializationAttempted.current = true

    const initializeSpeechRecognition = async () => {
      try {
        // Check if browser supports speech recognition
        if (!('webkitSpeechRecognition' in window)) {
          onError('Tu navegador no soporta reconocimiento de voz. Por favor, usa Chrome o Edge.')
          console.error('Speech recognition not supported')
          return
        }

        // Initialize speech recognition
        const recognition = new window.webkitSpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = 'es-ES' // Set to Spanish
        recognition.maxAlternatives = 1

        // Configure recognition settings
        recognition.onstart = () => {
          console.log('Speech recognition started')
          setIsListening(true)
          isRecognitionActive.current = true
          onError('')
        }

        recognition.onend = () => {
          console.log('Speech recognition ended')
          setIsListening(false)
          isRecognitionActive.current = false
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          console.log('Speech recognition result:', event)
          const transcript = event.results[0][0].transcript
          onTranscript(transcript)
        }

        recognition.onerror = (event: SpeechRecognitionError) => {
          console.error('Speech recognition error:', {
            error: event.error,
            message: event.message,
            type: event.type,
            timeStamp: event.timeStamp
          })

          if (event.error === 'not-allowed') {
            onError('Por favor, permite el acceso al micrófono para usar SILVIA.')
            setPermissionStatus('denied')
            onPermissionChange('denied')
          } else if (event.error === 'network') {
            if (retryCount < maxRetries) {
              const backoffTime = Math.pow(2, retryCount) * 1000 // Exponential backoff
              onError(`Error de conexión. Reintentando en ${backoffTime/1000} segundos...`)
              setIsRetrying(true)
              setRetryCount(prev => prev + 1)
              
              // Create a new recognition instance for retry
              const newRecognition = new window.webkitSpeechRecognition()
              newRecognition.continuous = false
              newRecognition.interimResults = false
              newRecognition.lang = 'es-ES'
              newRecognition.maxAlternatives = 1
              
              // Copy event handlers
              newRecognition.onstart = recognition.onstart
              newRecognition.onend = recognition.onend
              newRecognition.onresult = recognition.onresult
              newRecognition.onerror = recognition.onerror

              setTimeout(() => {
                if (recognitionRef.current) {
                  recognitionRef.current.stop()
                }
                recognitionRef.current = newRecognition
                setIsRetrying(false)
                handleVoiceInteraction()
              }, backoffTime)
            } else {
              onError('Error de conexión persistente. Por favor, verifica tu conexión a internet e intenta nuevamente más tarde.')
              setRetryCount(0)
            }
          } else {
            onError(`Error de reconocimiento: ${event.error}`)
          }
          
          setIsListening(false)
          isRecognitionActive.current = false
        }

        // Store the recognition instance
        recognitionRef.current = recognition
        setIsInitialized(true)
        console.log('Speech recognition initialized successfully')

      } catch (err) {
        console.error('Error initializing speech recognition:', err)
        onError('Error al inicializar el reconocimiento de voz')
        initializationAttempted.current = false
      }
    }

    initializeSpeechRecognition()

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        isRecognitionActive.current = false
      }
    }
  }, [onTranscript, onError, onPermissionChange, setIsListening, isInitialized, retryCount])

  const requestMicrophonePermission = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop()) // Stop the stream immediately
      setPermissionStatus('granted')
      onPermissionChange('granted')
      onError('')
      return true
    } catch (err) {
      console.error('Error requesting microphone permission:', err)
      setPermissionStatus('denied')
      onPermissionChange('denied')
      onError('No se pudo acceder al micrófono. Por favor, verifica los permisos en la configuración de tu navegador.')
      return false
    }
  }

  const handleVoiceInteraction = async () => {
    if (isSpeaking || isRetrying) {
      console.log('Cannot start listening while speaking or retrying')
      return
    }

    if (!recognitionRef.current) {
      console.error('Speech recognition not initialized')
      onError('El reconocimiento de voz no está inicializado')
      return
    }

    if (permissionStatus === 'denied') {
      onError('El acceso al micrófono está bloqueado. Por favor, actualiza los permisos en la configuración de tu navegador.')
      return
    }

    if (permissionStatus === 'prompt') {
      const granted = await requestMicrophonePermission()
      if (!granted) return
    }

    if (!isRecognitionActive.current) {
      console.log('Starting speech recognition')
      try {
        // Ensure any previous recognition is stopped
        if (recognitionRef.current) {
          recognitionRef.current.stop()
        }
        // Add a small delay before starting
        setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.start()
          }
        }, 1000) // Increased delay to 1 second
      } catch (err) {
        console.error('Error starting speech recognition:', err)
        onError('Error al iniciar el reconocimiento de voz')
      }
    } else {
      console.log('Stopping speech recognition')
      recognitionRef.current.stop()
    }
  }

  return (
    <Button
      onClick={handleVoiceInteraction}
      disabled={isSpeaking || !isInitialized}
      className={`w-24 h-24 rounded-full transition-all duration-300 ${
        isListening 
          ? 'bg-red-500 hover:bg-red-600 scale-110' 
          : !isInitialized
            ? 'bg-gray-400 cursor-not-allowed'
            : permissionStatus === 'denied'
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
      }`}
    >
      {isListening ? (
        <MicOff className="w-8 h-8 text-white" />
      ) : (
        <Mic className="w-8 h-8 text-white" />
      )}
    </Button>
  )
}

export default SpeechRecognitionComponent 