const sliderConfig = [
  {
    key: 'heartRate',
    label: 'Heart Rate',
    min: 40,
    max: 200,
    step: 1,
    unit: 'bpm',
  },
  {
    key: 'prInterval',
    label: 'PR Interval',
    min: 100,
    max: 300,
    step: 1,
    unit: 'ms',
  },
  {
    key: 'qrsDuration',
    label: 'QRS Duration',
    min: 60,
    max: 200,
    step: 1,
    unit: 'ms',
  },
  {
    key: 'qtInterval',
    label: 'QT Interval',
    min: 300,
    max: 600,
    step: 1,
    unit: 'ms',
  },
  {
    key: 'stElevation',
    label: 'ST Elevation',
    min: -2,
    max: 4,
    step: 0.1,
    unit: 'mm',
  },
]

function ControlPanel({ values, selectedPreset, onPresetChange, onValueChange }) {
  return (
    <section className="control-panel" aria-label="ECG controls">
      <div className="control-row preset-row">
        <label htmlFor="preset">Arrhythmia Preset</label>
        <select
          id="preset"
          value={selectedPreset}
          onChange={(event) => onPresetChange(event.target.value)}
        >
          <option value="Normal Sinus">Normal Sinus</option>
          <option value="Atrial Fibrillation">Atrial Fibrillation</option>
          <option value="Ventricular Tachycardia">Ventricular Tachycardia</option>
          <option value="First Degree Heart Block">First Degree Heart Block</option>
          <option value="Bradycardia">Bradycardia</option>
          <option value="Tachycardia">Tachycardia</option>
        </select>
      </div>

      {sliderConfig.map((slider) => {
        const value = values[slider.key]
        const displayValue =
          slider.key === 'stElevation' ? value.toFixed(1) : value.toString()

        return (
          <div className="control-row" key={slider.key}>
            <div className="control-label-row">
              <label htmlFor={slider.key}>{slider.label}</label>
              <span>
                {displayValue} {slider.unit}
              </span>
            </div>
            <input
              id={slider.key}
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={value}
              onChange={(event) =>
                onValueChange(slider.key, Number(event.target.value))
              }
            />
          </div>
        )
      })}
    </section>
  )
}

export default ControlPanel