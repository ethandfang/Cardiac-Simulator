import { useState } from 'react'
import './App.css'
import ControlPanel from './components/ControlPanel'
import ECGCanvas from './components/ECGCanvas'
import InfoPanel from './components/InfoPanel'

const PRESETS = {
  'Normal Sinus': {
    heartRate: 75,
    prInterval: 160,
    qrsDuration: 100,
    qtInterval: 420,
    stElevation: 0,
  },
  'Atrial Fibrillation': {
    heartRate: 120,
    prInterval: 130,
    qrsDuration: 90,
    qtInterval: 380,
    stElevation: 0,
  },
  'Ventricular Tachycardia': {
    heartRate: 170,
    prInterval: 120,
    qrsDuration: 170,
    qtInterval: 360,
    stElevation: 1.5,
  },
  'First Degree Heart Block': {
    heartRate: 70,
    prInterval: 240,
    qrsDuration: 100,
    qtInterval: 430,
    stElevation: 0,
  },
  Bradycardia: {
    heartRate: 48,
    prInterval: 180,
    qrsDuration: 100,
    qtInterval: 450,
    stElevation: 0,
  },
  Tachycardia: {
    heartRate: 130,
    prInterval: 150,
    qrsDuration: 100,
    qtInterval: 390,
    stElevation: 0,
  },
}

function App() {
  const [selectedPreset, setSelectedPreset] = useState('Normal Sinus')
  const [ecgParams, setEcgParams] = useState(PRESETS['Normal Sinus'])

  const handlePresetChange = (presetName) => {
    setSelectedPreset(presetName)
    setEcgParams(PRESETS[presetName])
  }

  const handleValueChange = (key, value) => {
    setEcgParams((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>Heart Rhythm Simulator</h1>
      </header>

      <section className="monitor-shell" aria-label="ECG monitor display">
        <ECGCanvas {...ecgParams} />
      </section>

      <section className="dashboard-grid" aria-label="Simulator controls and details">
        <aside className="left-column">
          <ControlPanel
            values={ecgParams}
            selectedPreset={selectedPreset}
            onPresetChange={handlePresetChange}
            onValueChange={handleValueChange}
          />
        </aside>

        <InfoPanel selectedPreset={selectedPreset} values={ecgParams} />
      </section>

      <p className="disclaimer">
        Educational use only - not for clinical decisions.
      </p>
    </main>
  )
}

export default App
