const RHYTHM_INFO = {
  'Normal Sinus': {
    description:
      'Regular atrial and ventricular depolarization. PR, QRS, and QT intervals within normal limits.',
    severity: 'normal',
  },
  'Atrial Fibrillation': {
    description:
      'Chaotic atrial activity replaces organized P waves with rapid irregular f-waves. Ventricular response is irregularly irregular — the hallmark of AFib.',
    severity: 'warning',
  },
  'Ventricular Tachycardia': {
    description:
      'Rapid wide-complex rhythm originating in the ventricles. No organized P waves. T wave is discordant (opposite direction) to the QRS. Hemodynamically unstable without treatment.',
    severity: 'danger',
  },
  'Ventricular Fibrillation': {
    description:
      'Completely disorganized ventricular activity. No identifiable P, QRS, or T waves. No effective cardiac output — immediately fatal without defibrillation.',
    severity: 'critical',
  },
  'First Degree Heart Block': {
    description:
      'PR interval consistently >200ms, indicating slowed conduction through the AV node. One-to-one AV conduction is preserved. Often benign.',
    severity: 'mild',
  },
  Bradycardia: {
    description:
      'Sinus rhythm below 60 bpm. Can be physiologic (athletes) or pathologic. Monitor for hemodynamic compromise or syncope.',
    severity: 'mild',
  },
  Tachycardia: {
    description:
      'Sinus rhythm above 100 bpm with normal morphology. Usually a response to physiologic stress — treat the underlying cause rather than the rate.',
    severity: 'mild',
  },
}

const SEVERITY_LABEL = {
  normal: 'Normal',
  mild: 'Mild',
  warning: 'Abnormal',
  danger: 'Dangerous',
  critical: 'Critical',
}

function getClinicalFindings(values) {
  const findings = []
  const { heartRate, prInterval, qrsDuration, qtInterval, stElevation } = values
  const qtc = Math.round(qtInterval / Math.sqrt(60000 / heartRate / 1000))

  if (prInterval > 200)
    findings.push({ text: `PR ${prInterval}ms (>200) → First-degree AV block`, type: 'warn' })
  if (prInterval < 120)
    findings.push({ text: `PR ${prInterval}ms (<120) → Pre-excitation / WPW pattern?`, type: 'warn' })
  if (qrsDuration > 120)
    findings.push({ text: `QRS ${qrsDuration}ms (>120) → Bundle branch block or ventricular origin`, type: 'warn' })
  if (heartRate > 100)
    findings.push({ text: `Rate ${heartRate} bpm → Tachycardia`, type: 'info' })
  if (heartRate < 60)
    findings.push({ text: `Rate ${heartRate} bpm → Bradycardia`, type: 'info' })
  if (stElevation >= 1)
    findings.push({ text: `ST +${stElevation.toFixed(1)}mm → Possible STEMI — emergent evaluation`, type: 'danger' })
  if (stElevation <= -0.5)
    findings.push({ text: `ST ${stElevation.toFixed(1)}mm → Ischemia / NSTEMI pattern`, type: 'danger' })
  if (qtc > 450)
    findings.push({ text: `QTc ${qtc}ms (>450) → Prolonged — risk of Torsades de Pointes`, type: 'warn' })

  return { findings, qtc }
}

function InfoPanel({ selectedPreset, values, quizMode, quiz, quizAnswered, onQuizAnswer, onNextQuiz }) {
  if (quizMode && quiz) {
    const { correct, choices } = quiz
    return (
      <aside className="info-panel" aria-label="Quiz panel">
        <h2>Quiz Mode</h2>
        <p className="info-description">Identify the rhythm shown on the monitor:</p>
        <div className="quiz-choices">
          {choices.map((choice) => {
            let cls = 'quiz-choice'
            if (quizAnswered) {
              if (choice === correct) cls += ' correct'
              else if (choice === quizAnswered && choice !== correct) cls += ' wrong'
            }
            return (
              <button
                key={choice}
                className={cls}
                onClick={() => !quizAnswered && onQuizAnswer(choice)}
                disabled={!!quizAnswered}
              >
                {choice}
              </button>
            )
          })}
        </div>
        {quizAnswered && (
          <div className="quiz-feedback">
            <p className={`feedback-result ${quizAnswered === correct ? 'correct-text' : 'wrong-text'}`}>
              {quizAnswered === correct ? '✓ Correct!' : `✗ Answer: ${correct}`}
            </p>
            <p className="info-description">{RHYTHM_INFO[correct]?.description}</p>
            <button className="tool-btn active next-btn" onClick={onNextQuiz}>
              Next Question →
            </button>
          </div>
        )}
      </aside>
    )
  }

  const info = RHYTHM_INFO[selectedPreset]
  const { findings, qtc } = getClinicalFindings(values)

  return (
    <aside className="info-panel" aria-label="ECG information panel">
      <div className="info-header">
        <h2>{selectedPreset}</h2>
        {info && (
          <span className={`severity-badge sev-${info.severity}`}>
            {SEVERITY_LABEL[info.severity]}
          </span>
        )}
      </div>

      {info && <p className="info-description">{info.description}</p>}

      {findings.length > 0 && (
        <div className="findings-list">
          <h3 className="findings-title">Clinical Findings</h3>
          {findings.map((f, i) => (
            <div key={i} className={`finding finding-${f.type}`}>
              {f.text}
            </div>
          ))}
        </div>
      )}

      <dl className="metric-grid">
        <div>
          <dt>Heart Rate</dt>
          <dd className={values.heartRate > 100 || values.heartRate < 60 ? 'abnormal' : ''}>
            {values.heartRate} bpm
          </dd>
        </div>
        <div>
          <dt>PR Interval</dt>
          <dd className={values.prInterval > 200 || values.prInterval < 120 ? 'abnormal' : ''}>
            {values.prInterval} ms
          </dd>
        </div>
        <div>
          <dt>QRS Duration</dt>
          <dd className={values.qrsDuration > 120 ? 'abnormal' : ''}>{values.qrsDuration} ms</dd>
        </div>
        <div>
          <dt>QT / QTc</dt>
          <dd className={qtc > 450 ? 'abnormal' : ''}>
            {values.qtInterval} / {qtc} ms
          </dd>
        </div>
        <div>
          <dt>ST Elevation</dt>
          <dd className={Math.abs(values.stElevation) >= 1 ? 'abnormal' : ''}>
            {values.stElevation.toFixed(1)} mm
          </dd>
        </div>
      </dl>
    </aside>
  )
}

export default InfoPanel
