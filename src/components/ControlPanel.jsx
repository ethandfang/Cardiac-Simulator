const sliderConfig = [
  { key: 'heartRate', label: 'Heart Rate', min: 40, max: 200, step: 1, unit: 'bpm' },
  { key: 'prInterval', label: 'PR Interval', min: 100, max: 300, step: 1, unit: 'ms' },
  { key: 'qrsDuration', label: 'QRS Duration', min: 60, max: 200, step: 1, unit: 'ms' },
  { key: 'qtInterval', label: 'QT Interval', min: 300, max: 600, step: 1, unit: 'ms' },
  { key: 'stElevation', label: 'ST Elevation', min: -2, max: 4, step: 0.1, unit: 'mm' },
]

const PRESET_NAMES = [
  'Normal Sinus',
  'Atrial Fibrillation',
  'Ventricular Tachycardia',
  'Ventricular Fibrillation',
  'First Degree Heart Block',
  'Bradycardia',
  'Tachycardia',
]

function ControlPanel({ values, selectedPreset, onPresetChange, onValueChange }) {
  return (
    <section className="control-panel" aria-label="ECG controls">
      <div className="control-row preset-row">
        <label htmlFor="preset">Arrhythmia Preset</label>
        <select id="preset" value={selectedPreset} onChange={(e) => onPresetChange(e.target.value)}>
          {PRESET_NAMES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {sliderConfig.map(({ key, label, min, max, step, unit }) => {
        const value = values[key]
        const display = key === 'stElevation' ? value.toFixed(1) : value.toString()
        return (
          <div className="control-row" key={key}>
            <div className="control-label-row">
              <label htmlFor={key}>{label}</label>
              <span className="slider-value">{display} {unit}</span>
            </div>
            <input
              id={key}
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={(e) => onValueChange(key, Number(e.target.value))}
            />
          </div>
        )
      })}
    </section>
  )
}

export default ControlPanel
