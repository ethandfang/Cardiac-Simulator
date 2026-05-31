const presetNotes = {
  'Normal Sinus':
    'Regular atrial and ventricular depolarization with expected intervals and stable ST segment.',
  'Atrial Fibrillation':
    'Irregular rhythm pattern with reduced organized atrial activity and variable ventricular response.',
  'Ventricular Tachycardia':
    'Rapid wide-complex rhythm simulation with shortened cycle length and broader ventricular depolarization.',
  'First Degree Heart Block':
    'Consistent PR prolongation while preserving one-to-one atrioventricular conduction.',
  Bradycardia:
    'Sinus rhythm at a slower rate with longer R-R intervals and otherwise near-normal morphology.',
  Tachycardia:
    'Sinus rhythm at an elevated rate with shorter R-R intervals and compressed cycle timing.',
}

function InfoPanel({ selectedPreset, values }) {
  return (
    <aside className="info-panel" aria-label="ECG information panel">
      <h2>Rhythm Snapshot</h2>
      <p className="info-description">{presetNotes[selectedPreset]}</p>

      <dl className="metric-grid">
        <div>
          <dt>Heart Rate</dt>
          <dd>{values.heartRate} bpm</dd>
        </div>
        <div>
          <dt>PR Interval</dt>
          <dd>{values.prInterval} ms</dd>
        </div>
        <div>
          <dt>QRS Duration</dt>
          <dd>{values.qrsDuration} ms</dd>
        </div>
        <div>
          <dt>QT Interval</dt>
          <dd>{values.qtInterval} ms</dd>
        </div>
        <div>
          <dt>ST Elevation</dt>
          <dd>{values.stElevation.toFixed(1)} mm</dd>
        </div>
      </dl>

      <p className="info-footnote">
        This simulator demonstrates ECG morphology concepts and parameter interactions.
      </p>
    </aside>
  )
}

export default InfoPanel