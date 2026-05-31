import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function afibRR(idx, meanMs) {
  return meanMs * (0.65 + 0.7 * hash(idx))
}

const ECGCanvas = forwardRef(function ECGCanvas(
  {
    heartRate = 75,
    prInterval = 160,
    qrsDuration = 100,
    qtInterval = 420,
    stElevation = 0,
    arrhythmiaType = 'normal',
    showGrid = true,
    showAnnotations = false,
    pixelsPerSecond = 130,
    caliperActive = false,
  },
  ref,
) {
  const canvasRef = useRef(null)
  const t0Ref = useRef(null)
  const caliperRef = useRef({ x1: null, x2: null, locked: false })
  const [caliperStage, setCaliperStage] = useState('idle')

  const showGridRef = useRef(showGrid)
  showGridRef.current = showGrid
  const showAnnotationsRef = useRef(showAnnotations)
  showAnnotationsRef.current = showAnnotations
  const caliperActiveRef = useRef(caliperActive)
  caliperActiveRef.current = caliperActive

  useImperativeHandle(ref, () => ({
    exportPNG() {
      const canvas = canvasRef.current
      if (!canvas) return
      const a = document.createElement('a')
      a.download = 'ecg-strip.png'
      a.href = canvas.toDataURL('image/png')
      a.click()
    },
  }))

  useEffect(() => {
    if (!caliperActive) {
      caliperRef.current = { x1: null, x2: null, locked: false }
      setCaliperStage('idle')
    }
  }, [caliperActive])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')

    const hr = clamp(heartRate, 40, 300)
    const pr = clamp(prInterval, 100, 300)
    const qrs = clamp(qrsDuration, 60, 200)
    const qt = clamp(qtInterval, 300, 600)
    const st = clamp(stElevation, -2, 4)
    const beatMs = 60000 / hr
    const pxPerMs = pixelsPerSecond / 1000
    const gainPxPerMv = 52

    const qrsStart = clamp(pr, 80, beatMs * 0.45)
    const qrsEnd = qrsStart + qrs
    const pEnd = Math.max(30, clamp(qrsStart * 0.55, 60, 120))
    const qtEnd = Math.min(beatMs - 30, qrsStart + qt)
    const stDur = clamp(Math.max(90, qtEnd - qrsEnd) * 0.35, 40, 220)
    const tStart = qrsEnd + stDur
    const tDur = Math.max(60, qtEnd - tStart)
    const stMv = st * 0.1

    const TIME_PRE = 120000
    const beatTable = []
    if (arrhythmiaType === 'afib') {
      let t = -TIME_PRE
      beatTable.push(t)
      while (t < TIME_PRE) {
        t += afibRR(beatTable.length - 1, beatMs)
        beatTable.push(t)
      }
    }

    function ensureAfibBeats(untilMs) {
      while (beatTable[beatTable.length - 1] < untilMs + beatMs) {
        beatTable.push(beatTable[beatTable.length - 1] + afibRR(beatTable.length - 1, beatMs))
      }
    }

    function getAfibBeat(relMs) {
      ensureAfibBeats(relMs)
      let lo = 0,
        hi = beatTable.length - 1
      while (lo < hi - 1) {
        const mid = (lo + hi) >> 1
        if (beatTable[mid] <= relMs) lo = mid
        else hi = mid
      }
      return { phase: relMs - beatTable[lo], rrMs: beatTable[lo + 1] - beatTable[lo] }
    }

    function normalQRS(u) {
      return (
        -0.18 * Math.exp(-Math.pow((u - 0.18) / 0.07, 2)) +
         1.35 * Math.exp(-Math.pow((u - 0.32) / 0.05, 2)) +
        -0.35 * Math.exp(-Math.pow((u - 0.52) / 0.08, 2))
      )
    }

    function vtachQRS(u) {
      return (
        1.6 * Math.exp(-Math.pow((u - 0.42) / 0.3, 2)) +
       -0.45 * Math.exp(-Math.pow((u - 0.68) / 0.09, 2))
      )
    }

    function ecgAt(relMs) {
      const wander = 0.04 * Math.sin(relMs * 0.00105) + 0.015 * Math.sin(relMs * 0.00057)

      if (arrhythmiaType === 'vfib') {
        const t = relMs * 0.001
        return (
          0.55 * Math.sin(t * 28.27) +
          0.4 * Math.sin(t * 37.7 + 1.2) +
          0.3 * Math.sin(t * 44.41 + 2.7) +
          0.25 * Math.sin(t * 52.16 + 0.4) +
          0.2 * Math.sin(t * 31.42 + 1.9) +
          0.15 * Math.sin(t * 62.83 + 3.1) +
          0.12 * Math.sin(t * 21.99 + 0.9)
        )
      }

      if (arrhythmiaType === 'afib') {
        const fWave =
          0.07 * Math.sin(relMs * 0.0377) +
          0.05 * Math.sin(relMs * 0.044 + hash(Math.floor(relMs / 250)) * 6.28) +
          0.03 * Math.sin(relMs * 0.0503 + hash(Math.floor(relMs / 200)) * 6.28)

        const { phase, rrMs } = getAfibBeat(relMs)
        const lqrsStart = rrMs * 0.15
        const lqrsDur = Math.min(qrs, rrMs * 0.25)
        const lqrsEnd = lqrsStart + lqrsDur
        const ltStart = lqrsEnd + rrMs * 0.15
        const ltDur = Math.min(tDur, rrMs * 0.28)

        if (phase < lqrsStart) return wander + fWave
        if (phase < lqrsEnd) return wander + normalQRS((phase - lqrsStart) / lqrsDur) + fWave * 0.2
        if (phase < ltStart) return wander + stMv + fWave * 0.3
        if (phase < ltStart + ltDur) {
          return wander + stMv + 0.28 * Math.sin(Math.PI * ((phase - ltStart) / ltDur)) + fWave * 0.2
        }
        return wander + fWave
      }

      if (arrhythmiaType === 'vtach') {
        const phase = ((relMs % beatMs) + beatMs) % beatMs
        const vtQrsStart = beatMs * 0.08
        const vtQrsEnd = vtQrsStart + qrs
        const vtTStart = vtQrsEnd + 30
        const vtTDur = Math.min(tDur, beatMs * 0.28)

        if (phase < vtQrsStart) return wander
        if (phase < vtQrsEnd) return wander + vtachQRS((phase - vtQrsStart) / qrs)
        if (phase < vtTStart) return wander + stMv
        if (phase < vtTStart + vtTDur)
          return wander + stMv - 0.45 * Math.sin(Math.PI * ((phase - vtTStart) / vtTDur))
        return wander
      }

      const phase = ((relMs % beatMs) + beatMs) % beatMs
      if (phase < pEnd) return wander + 0.12 * Math.sin(Math.PI * (phase / pEnd))
      if (phase < qrsStart) return wander
      if (phase < qrsEnd) return wander + normalQRS((phase - qrsStart) / qrs)
      if (phase < tStart) return wander + stMv
      if (phase < tStart + tDur) return wander + stMv + 0.32 * Math.sin(Math.PI * ((phase - tStart) / tDur))
      return wander
    }

    let width = 0,
      height = 0,
      centerY = 0,
      animId = 0

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

    function drawGrid() {
      const mmPx = pixelsPerSecond / 25
      const smallSq = mmPx
      const largeSq = 5 * mmPx
      const vSmall = gainPxPerMv / 10
      const vLarge = gainPxPerMv / 2

      ctx.beginPath()
      ctx.strokeStyle = 'rgba(220, 60, 60, 0.12)'
      ctx.lineWidth = 0.4
      for (let x = 0; x <= width; x += smallSq) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
      }
      for (let y = centerY % vSmall; y <= height; y += vSmall) {
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
      }
      ctx.stroke()

      ctx.beginPath()
      ctx.strokeStyle = 'rgba(220, 60, 60, 0.28)'
      ctx.lineWidth = 0.7
      for (let x = 0; x <= width; x += largeSq) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
      }
      for (let y = centerY % vLarge; y <= height; y += vLarge) {
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
      }
      ctx.stroke()
    }

    function drawAnnotations(relNow) {
      if (arrhythmiaType !== 'normal') return
      const windowMs = width / pxPerMs
      const lastBeatPhase = relNow % beatMs
      const bt = relNow - lastBeatPhase - beatMs
      if (relNow - bt > windowMs) return

      const annotate = (relMs, label, yOff) => {
        const x = width - (relNow - relMs) * pxPerMs
        if (x < 14 || x > width - 14) return
        const ecgY = centerY - ecgAt(relMs) * gainPxPerMv
        ctx.save()
        ctx.font = '11px monospace'
        ctx.textAlign = 'center'
        ctx.fillStyle = '#facc15'
        ctx.fillText(label, x, ecgY + yOff)
        ctx.strokeStyle = 'rgba(250,204,21,0.5)'
        ctx.lineWidth = 0.8
        ctx.setLineDash([2, 3])
        ctx.beginPath()
        ctx.moveTo(x, ecgY + yOff + (yOff < 0 ? 10 : -10))
        ctx.lineTo(x, ecgY)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.restore()
      }

      annotate(bt + pEnd * 0.5, 'P', -22)
      annotate(bt + qrsStart + qrs * 0.32, 'R', -32)
      annotate(bt + tStart + tDur * 0.5, 'T', -22)

      const prX1 = width - (relNow - (bt + pEnd)) * pxPerMs
      const prX2 = width - (relNow - (bt + qrsStart)) * pxPerMs
      if (prX1 > 10 && prX2 < width - 10) {
        ctx.save()
        ctx.strokeStyle = 'rgba(34,197,94,0.5)'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.moveTo(prX1, centerY)
        ctx.lineTo(prX2, centerY)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.font = '10px monospace'
        ctx.fillStyle = 'rgba(34,197,94,0.7)'
        ctx.textAlign = 'center'
        ctx.fillText('PR', (prX1 + prX2) / 2, centerY - 6)
        ctx.restore()
      }
    }

    function drawCaliper() {
      if (!caliperActiveRef.current) return
      const cal = caliperRef.current
      if (cal.x1 === null) return

      ctx.save()
      ctx.strokeStyle = '#60a5fa'
      ctx.fillStyle = '#60a5fa'
      ctx.lineWidth = 1.5

      ctx.beginPath()
      ctx.moveTo(cal.x1, 0)
      ctx.lineTo(cal.x1, height)
      ctx.stroke()

      if (cal.x2 !== null) {
        ctx.beginPath()
        ctx.moveTo(cal.x2, 0)
        ctx.lineTo(cal.x2, height)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(cal.x1, height / 2)
        ctx.lineTo(cal.x2, height / 2)
        ctx.stroke()

        const ms = Math.abs(cal.x2 - cal.x1) / pxPerMs
        const bpm = ms > 0 ? Math.round(60000 / ms) : 0
        const midX = (cal.x1 + cal.x2) / 2
        ctx.font = 'bold 13px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(`${Math.round(ms)} ms`, midX, height / 2 - 16)
        ctx.font = '11px monospace'
        ctx.fillStyle = 'rgba(96,165,250,0.7)'
        ctx.fillText(`≈ ${bpm} bpm if RR`, midX, height / 2 - 3)
      }
      ctx.restore()
    }

    const draw = (timestamp) => {
      if (t0Ref.current === null) t0Ref.current = timestamp
      const relNow = timestamp - t0Ref.current

      ctx.fillStyle = '#050505'
      ctx.fillRect(0, 0, width, height)

      if (showGridRef.current) drawGrid()

      ctx.beginPath()
      for (let x = 0; x <= width; x++) {
        const relMs = relNow - (width - x) / pxPerMs
        const y = centerY - ecgAt(relMs) * gainPxPerMv
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = '#39ff14'
      ctx.lineWidth = 2
      ctx.shadowColor = '#39ff14'
      ctx.shadowBlur = 6
      ctx.stroke()
      ctx.shadowBlur = 0

      if (showAnnotationsRef.current) drawAnnotations(relNow)
      drawCaliper()

      animId = requestAnimationFrame(draw)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    animId = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [heartRate, prInterval, qrsDuration, qtInterval, stElevation, arrhythmiaType, pixelsPerSecond])

  const handleClick = (e) => {
    if (!caliperActiveRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const cal = caliperRef.current
    if (cal.x1 === null || cal.locked) {
      caliperRef.current = { x1: x, x2: null, locked: false }
      setCaliperStage('measuring')
    } else {
      cal.x2 = x
      cal.locked = true
      setCaliperStage('locked')
    }
  }

  const handleMouseMove = (e) => {
    if (!caliperActiveRef.current) return
    const cal = caliperRef.current
    if (cal.x1 === null || cal.locked) return
    const rect = canvasRef.current.getBoundingClientRect()
    caliperRef.current.x2 = e.clientX - rect.left
  }

  const hintText =
    caliperStage === 'idle'
      ? 'Click to place jaw 1'
      : caliperStage === 'measuring'
        ? 'Click to place jaw 2'
        : 'Click to reset'

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '300px',
          display: 'block',
          cursor: caliperActive ? 'crosshair' : 'default',
        }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        aria-label="Real-time ECG waveform"
      />
      {caliperActive && <div className="caliper-hint">{hintText}</div>}
    </div>
  )
})

export default ECGCanvas
