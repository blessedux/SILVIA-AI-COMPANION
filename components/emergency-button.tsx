"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PhoneCall, X } from "lucide-react"

export default function EmergencyButton() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [calling, setCalling] = useState(false)

  const handleEmergencyClick = () => {
    if (calling) return
    setShowConfirm(true)
  }

  const confirmEmergency = () => {
    setCalling(true)
    // In a real implementation, this would initiate an emergency call
    setTimeout(() => {
      setCalling(false)
      setShowConfirm(false)
    }, 3000)
  }

  const cancelEmergency = () => {
    setShowConfirm(false)
  }

  if (showConfirm) {
    return (
      <div className="w-full bg-red-50 rounded-xl p-4 border border-red-200 animate-pulse">
        <p className="text-center text-red-800 mb-4">
          {calling ? "Llamando a servicios de emergencia..." : "¿Está seguro de que desea llamar a servicios de emergencia?"}
        </p>
        <div className="flex gap-2">
          <Button
            onClick={cancelEmergency}
            disabled={calling}
            variant="outline"
            className="flex-1 border-red-300 text-red-700"
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button
            onClick={confirmEmergency}
            disabled={calling}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            <PhoneCall className="mr-2 h-4 w-4" />
            Confirmar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Button onClick={handleEmergencyClick} variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
      <PhoneCall className="mr-2 h-4 w-4" />
      Asistencia de Emergencia
    </Button>
  )
}
