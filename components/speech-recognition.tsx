"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff } from "lucide-react"

// Declare types for speech recognition
declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition
    SpeechRecognition: new () => SpeechRecognition
  }
}

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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  const [isButtonEnabled, setIsButtonEnabled] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [state, setState] = useState<'idle' | 'requesting_permission' | 'recording' | 'processing' | 'error'>('idle')

  // Update button state
  useEffect(() => {
    const enabled = !isSpeaking && !isProcessing && permissionStatus !== 'denied'
    setIsButtonEnabled(enabled)
    
    console.log('State update:', {
      isButtonEnabled: enabled,
      isSpeaking,
      isProcessing,
      permissionStatus
    })
  }, [isSpeaking, isProcessing, permissionStatus])

  const requestMicrophonePermission = async () => {
    console.log('Requesting microphone permission')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        }
      })
      console.log('Microphone permission granted')
      stream.getTracks().forEach(track => track.stop())
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

  const startRecording = async () => {
    try {
      setState('requesting_permission')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        }
      })
      console.log('Audio stream obtained')
      setState('recording')
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000
      })
      
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        console.log('Audio data available:', event.data.size)
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        console.log('MediaRecorder stopped')
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' })
        console.log('Audio blob created:', {
          size: audioBlob.size,
          type: audioBlob.type
        })
        
        const formData = new FormData()
        formData.append('audio', audioBlob, 'recording.webm')
        
        try {
          setState('processing')
          console.log('Sending audio to server...')
          const response = await fetch('/api/speech', {
            method: 'POST',
            body: formData,
          })
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error('Server error:', errorText)
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          
          const result = await response.json()
          console.log('Server response:', result)
          
          if (result.error) {
            throw new Error(result.error)
          }
          
          onTranscript(result.text)
          setState('idle')
        } catch (error) {
          console.error('Error processing audio:', error)
          setState('error')
          onError('Error processing audio. Please try again.')
        }
      }
      
      mediaRecorder.start(100) // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder
      console.log('MediaRecorder started')
    } catch (error) {
      console.error('Error starting recording:', error)
      setState('error')
    }
  }

  const stopRecording = () => {
    console.log('Stopping recording')
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
  }

  const handleVoiceInteraction = async () => {
    console.log('handleVoiceInteraction called:', {
      isSpeaking,
      isProcessing,
      permissionStatus,
      isListening
    })

    if (isSpeaking || isProcessing) {
      console.log('Cannot start listening while speaking or processing')
      return
    }

    if (permissionStatus === 'denied') {
      console.log('Microphone access denied')
      onError('El acceso al micrófono está bloqueado. Por favor, actualiza los permisos en la configuración de tu navegador.')
      return
    }

    if (permissionStatus === 'prompt') {
      console.log('Requesting microphone permission')
      const granted = await requestMicrophonePermission()
      if (!granted) return
    }

    if (isListening) {
      console.log('Stopping recording')
      stopRecording()
      setIsListening(false)
    } else {
      console.log('Starting recording')
      await startRecording()
      setIsListening(true)
    }
  }

  return (
    <Button
      onClick={handleVoiceInteraction}
      disabled={!isButtonEnabled}
      className={`w-24 h-24 rounded-full transition-all duration-300 ${
        isListening 
          ? 'bg-red-500 hover:bg-red-600 scale-110' 
          : !isButtonEnabled
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