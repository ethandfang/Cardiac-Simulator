import { useRef, useState } from 'react'
import './App.css'
import ControlPanel from './components/ControlPanel'
import ECGCanvas from './components/ECGCanvas'
import InfoPanel from './components/InfoPanel'

const PRESETS = {
  'Normal Sinus': { heartRate: 75, prInterval: 160, qrsDuration: 100, qtInterval: 420, stElevation: 0 },
  'Atrial Fibrillation': { heartRate: 110, prInterval: 160, qrsDuration: 90, qtInterval: 380, stElevation: 0 },
  'Ventricular Tachycardia': { heartRate: 170, prInterval: 120, qrsDuration: 160, qtInterval: 360, stElevation: 1.5 },
  'Ventricular Fibrillation': { heartRate: 300, prInterval: 160, qrsDuration: 100, qtInterval: 420, stElevation: 0 },
  'First Degree Heart Block': { heartRate: 70, prInterval: 240, qrsDuration: 100, qtInterval: 430, stElevation: 0 },
  Bradycardia: { heartRate: 48, prInterval: 180, qrsDuration: 100, qtInterval: 450, stElevation: 0 },
  Tachycardia: { heartRate: 130, prInterval: 150, qrsDuration: 100, qtInterval: 390, stElevation: 0 },
}

const ARRHYTHMIA_TYPE = {
  'Normal Sinus': 'normal',
  'Atrial Fibrillation': 'afib',
  'Ventricular Tachycardia': 'vtach',
  'Ventricular Fibrillation': 'vfib',
  'First Degree Heart Block': 'normal',
  Bradycardia: 'normal',
  Tachycardia: 'normal',
}

const ALL_PRESETS = Object.keys(PRESETS)

function pickQuiz() {
  const correct = ALL_PRESETS[Math.floor(Math.random() * ALL_PRESETS.length)]
  const others = ALL_PRESETS.filter((p) => p !== correct)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
  const choices = [correct, ...others].sort(() => Math.random() - 0.5)
  return { correct, choices }
}

function App() {
  const [selectedPreset, setSelectedPreset] = useState('Normal Sinus')
  const [ecgParams, setEcgParams] = useState(PRESETS['Normal Sinus'])
  const [showGrid, setShowGrid] = useState(true)
  const [showAnnotations, setShowAnnotations] = useState(false)
  const [caliperActive, setCaliperActive] = useState(false)
  const [pixelsPerSecond, setPixelsPerSecond] = useState(130)
  const [quizMode, setQuizMode] = useState(false)
  const [quiz, setQuiz] = useState(null)
  const [quizAnswered, setQuizAnswered] = useState(null)
  const ecgRef = useRef(null)

  const handlePresetChange = (name) => {
    setSelectedPreset(name)
    setEcgParams(PRESETS[name])
  }

  const handleValueChange = (key, value) => {
    setEcgParams((prev) => ({ ...prev, [key]: value }))
  }

  const startQuiz = () => {
    const q = pickQuiz()
    setSelectedPreset(q.correct)
    setEcgParams(PRESETS[q.correct])
    setQuiz(q)
    setQuizAnswered(null)
    setQuizMode(true)
    setShowAnnotations(false)
    setCaliperActive(false)
  }

  const nextQuiz = () => {
    const q = pickQuiz()
    setSelectedPreset(q.correct)
    setEcgParams(PRESETS[q.correct])
    setQuiz(q)
    setQuizAnswered(null)
  }

  const exitQuiz = () => {
    setQuizMode(false)
    setQuiz(null)
    setQuizAnswered(null)
    handlePresetChange('Normal Sinus')
  }

  const arrhythmiaType = ARRHYTHMIA_TYPE[selectedPreset] || 'normal'
  const canAnnotate = arrhythmiaType === 'normal'

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <h1>Heart Rhythm Simulator</h1>
          <p className="app-subtitle">Educational ECG visualization</p>
        </div>
      </header>

      <div className="monitor-toolbar">
        <div className="toolbar-group">
          <button
            className={`tool-btn ${showGrid ? 'active' : ''}`}
            onClick={() => setShowGrid((g) => !g)}
            title="Toggle ECG grid"
          >
            Grid
          </button>
          <button
            className={`tool-btn ${showAnnotations ? 'active' : ''}`}
            onClick={() => setShowAnnotations((a) => !a)}
            disabled={!canAnnotate}
            title={canAnnotate ? 'Toggle waveform labels' : 'Labels only available for normal rhythms'}
          >
            Labels
          </button>
          <button
            className={`tool-btn ${caliperActive ? 'active' : ''}`}
            onClick={() => setCaliperActive((c) => !c)}
            title="Caliper tool — click on waveform to measure intervals"
          >
            Caliper
          </button>
        </div>

        <div className="toolbar-group">
          <select
            className="speed-select"
            value={pixelsPerSecond}
            onChange={(e) => setPixelsPerSecond(Number(e.target.value))}
            title="Paper speed"
          >
            <option value={130}>25 mm/s</option>
            <option value={260}>50 mm/s</option>
          </select>
          <button
            className="tool-btn"
            onClick={() => ecgRef.current?.exportPNG()}
            title="Export current view as PNG"
          >
            Export PNG
          </button>
          <button
            className={`tool-btn ${quizMode ? 'active quiz-exit' : 'quiz-btn'}`}
            onClick={quizMode ? exitQuiz : startQuiz}
          >
            {quizMode ? 'Exit Quiz' : 'Quiz Mode'}
          </button>
        </div>
      </div>

      <section className="monitor-shell" aria-label="ECG monitor display">
        <ECGCanvas
          ref={ecgRef}
          {...ecgParams}
          arrhythmiaType={arrhythmiaType}
          showGrid={showGrid}
          showAnnotations={showAnnotations}
          pixelsPerSecond={pixelsPerSecond}
          caliperActive={caliperActive}
        />
      </section>

      <section className={`dashboard-grid${quizMode ? ' quiz-active' : ''}`}>
        {!quizMode && (
          <aside className="left-column">
            <ControlPanel
              values={ecgParams}
              selectedPreset={selectedPreset}
              onPresetChange={handlePresetChange}
              onValueChange={handleValueChange}
            />
          </aside>
        )}
        <InfoPanel
          selectedPreset={selectedPreset}
          values={ecgParams}
          quizMode={quizMode}
          quiz={quiz}
          quizAnswered={quizAnswered}
          onQuizAnswer={setQuizAnswered}
          onNextQuiz={nextQuiz}
        />
      </section>

      <p className="disclaimer">Educational use only — not for clinical decisions.</p>
    </main>
  )
}

export default App
