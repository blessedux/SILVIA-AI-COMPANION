"use client"

import { useState } from "react"
import VoiceCompanion from "@/components/voice-companion"
import EmergencyButton from "@/components/emergency-button"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")

  // Simulate voice recognition
  const startListening = () => {
    setIsListening(true)
    // In a real implementation, this would connect to a speech recognition API
    setTimeout(() => {
      setIsListening(false)
      setIsSpeaking(true)
      setTranscript("What benefits am I eligible for as a senior?")

      // Simulate AI response
      setTimeout(() => {
        setResponse(
          "As a senior citizen, you may be eligible for Medicare, Social Security benefits, property tax exemptions, and local transportation discounts. Would you like me to explain any of these in more detail?",
        )
        setIsSpeaking(false)
      }, 2000)
    }, 3000)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 bg-slate-50">
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-8">
        <div className="mt-12 text-center">
          <h1 className="text-3xl font-light text-slate-800">Silvia AI</h1>
          <p className="text-slate-500 mt-2">Your companion and assistant</p>
        </div>

        <VoiceCompanion isListening={isListening} isSpeaking={isSpeaking} />

        <div className="w-full min-h-[100px] bg-white rounded-xl p-4 shadow-sm">
          {transcript && (
            <div className="mb-4">
              <p className="text-sm text-slate-500">You said:</p>
              <p className="text-slate-800">{transcript}</p>
            </div>
          )}

          {response && (
            <div>
              <p className="text-sm text-slate-500">Silvia:</p>
              <p className="text-slate-800">{response}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 w-full">
          <Button
            onClick={startListening}
            disabled={isListening || isSpeaking}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-full py-6"
          >
            {isListening ? "Listening..." : isSpeaking ? "Silvia is speaking..." : "Hold to speak"}
          </Button>

          <EmergencyButton />
        </div>
      </div>
    </main>
  )
}
