import { useEffect, useRef } from 'react'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function ECGCanvas({
  heartRate = 75,
  prInterval = 160,
  qrsDuration = 100,
  qtInterval = 420,
  stElevation = 0,
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    const hr = clamp(heartRate, 40, 200)
    const pr = clamp(prInterval, 100, 300)
    const qrs = clamp(qrsDuration, 60, 200)
    const qt = clamp(qtInterval, 300, 600)
    const st = clamp(stElevation, -2, 4)

    const beatMs = 60000 / hr
    const qrsStart = Math.min(pr, beatMs - qrs - 80)
    const qrsEnd = qrsStart + qrs

    const pDuration = clamp(qrsStart * 0.55, 60, 120)
    const pEnd = Math.max(30, pDuration)

    const qtEnd = Math.min(beatMs - 30, qrsStart + qt)
    const repolarizationMs = Math.max(90, qtEnd - qrsEnd)
    const stDuration = clamp(repolarizationMs * 0.35, 40, 220)
    const tStart = qrsEnd + stDuration
    const tDuration = Math.max(60, qtEnd - tStart)

    const stOffsetMv = st * 0.1
    const pixelsPerSecond = 130
    const pxPerMs = pixelsPerSecond / 1000
    const gainPxPerMv = 52

    let width = 0
    let height = 0
    let centerY = 0
    let animationFrameId = 0

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()

      width = Math.max(1, Math.floor(rect.width))
      height = Math.max(1, Math.floor(rect.height))
      centerY = height * 0.52

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }

    const ecgValueMvAt = (timeMs) => {
      const phase = ((timeMs % beatMs) + beatMs) % beatMs

      // Baseline respiratory drift keeps the waveform from looking perfectly static.
      let value = 0.015 * Math.sin((2 * Math.PI * timeMs) / 8000)

      if (phase < pEnd) {
        const u = phase / pEnd
        value += 0.12 * Math.sin(Math.PI * u)
        return value
      }

      if (phase < qrsStart) {
        return value
      }

      if (phase < qrsEnd) {
        const u = (phase - qrsStart) / qrs
        const qWave = -0.18 * Math.exp(-Math.pow((u - 0.18) / 0.07, 2))
        const rWave = 1.35 * Math.exp(-Math.pow((u - 0.32) / 0.05, 2))
        const sWave = -0.35 * Math.exp(-Math.pow((u - 0.52) / 0.08, 2))
        return value + qWave + rWave + sWave
      }

      if (phase < tStart) {
        return value + stOffsetMv
      }

      if (phase < tStart + tDuration) {
        const u = (phase - tStart) / tDuration
        const tWave = 0.32 * Math.sin(Math.PI * u)
        return value + stOffsetMv + tWave
      }

      return value
    }

    const draw = (timestamp) => {
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, width, height)

      const nowMs = timestamp
      ctx.beginPath()

      for (let x = 0; x < width; x += 1) {
        const sampleTime = nowMs - (width - x) / pxPerMs
        const y = centerY - ecgValueMvAt(sampleTime) * gainPxPerMv

        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.strokeStyle = '#39ff14'
      ctx.lineWidth = 2
      ctx.shadowColor = '#39ff14'
      ctx.shadowBlur = 8
      ctx.stroke()
      ctx.shadowBlur = 0

      animationFrameId = window.requestAnimationFrame(draw)
    }

    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)

    animationFrameId = window.requestAnimationFrame(draw)

    return () => {
      window.cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
    }
  }, [heartRate, prInterval, qrsDuration, qtInterval, stElevation])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '240px',
        display: 'block',
        backgroundColor: '#0a0a0a',
      }}
      aria-label="Real-time ECG waveform"
    />
  )
}

export default ECGCanvas