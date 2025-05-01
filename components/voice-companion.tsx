"use client"

import { useEffect, useRef } from "react"

interface VoiceCompanionProps {
  isListening: boolean
  isSpeaking: boolean
}

export default function VoiceCompanion({ isListening, isSpeaking }: VoiceCompanionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let rotation = 0

    // Set canvas dimensions
    canvas.width = 280
    canvas.height = 280

    // Create the uneven circle points
    const points = 12 // Increase points for smoother circle
    const radiusBase = 80
    const radiusVariance = isListening ? 8 : isSpeaking ? 6 : 4 // Reduce variance for subtler unevenness
    const radiusValues: number[] = []

    for (let i = 0; i < points; i++) {
      // Create slightly different radius values for each point
      radiusValues[i] = radiusBase + Math.random() * radiusVariance
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Determine color based on state
      let color
      if (isListening) {
        color = "#3b82f6" // Blue when listening
      } else if (isSpeaking) {
        color = "#10b981" // Green when speaking
      } else {
        color = "#64748b" // Slate when idle
      }

      // Draw the slightly uneven circle
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(rotation)

      ctx.beginPath()

      // Add subtle oval distortion based on rotation
      const ovalFactor = 1 + Math.sin(rotation * 2) * 0.05 // Subtle oval effect

      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2
        const nextAngle = (((i + 1) % points) / points) * Math.PI * 2

        // Apply subtle variance to each point
        const variance = Math.sin(Date.now() / 2000 + i * 0.5) * radiusVariance
        const radius = radiusBase + variance

        // Apply oval distortion
        const xFactor = ovalFactor
        const yFactor = 1 / ovalFactor

        const x = Math.cos(angle) * radius * xFactor
        const y = Math.sin(angle) * radius * yFactor

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          // Use arcs instead of bezier curves for smoother, more circular shape
          const prevAngle = ((i - 1) / points) * Math.PI * 2
          const prevX = Math.cos(prevAngle) * (radiusBase + variance) * xFactor
          const prevY = Math.sin(prevAngle) * (radiusBase + variance) * yFactor

          // Use quadratic curves for subtle unevenness
          const cpX = (x + prevX) / 2 + Math.sin(angle * 3) * (radiusVariance / 2)
          const cpY = (y + prevY) / 2 + Math.cos(angle * 3) * (radiusVariance / 2)

          ctx.quadraticCurveTo(cpX, cpY, x, y)
        }
      }

      ctx.closePath()

      // Add a subtle gradient
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radiusBase * 1.5)
      gradient.addColorStop(0, color)
      gradient.addColorStop(1, color + "80") // Add transparency

      ctx.fillStyle = gradient
      ctx.fill()

      // Add a subtle glow effect
      ctx.shadowColor = color
      ctx.shadowBlur = 15
      ctx.lineWidth = 1.5
      ctx.strokeStyle = color
      ctx.stroke()

      ctx.restore()

      // Rotate slowly, faster when active
      const rotationSpeed = isListening || isSpeaking ? 0.002 : 0.0008
      rotation += rotationSpeed

      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isListening, isSpeaking])

  return (
    <div className="relative w-[280px] h-[280px] flex items-center justify-center">
      <canvas ref={canvasRef} className="absolute inset-0" width={280} height={280} />
      {isListening && <div className="z-10 text-white font-light">Listening...</div>}
    </div>
  )
}
