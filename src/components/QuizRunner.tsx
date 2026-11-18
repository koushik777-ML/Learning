import { ArrowLeft, ArrowRight, Check, ChevronDown, CircleHelp, Flag, RotateCcw, X } from 'lucide-react'
import { useState } from 'react'
import type { ModuleProgress, Question, QuizAnswer } from '../types/curriculum'
import { activeStatus, quizSummary } from '../utils/progress'
import { InlineMarkdown, MarkdownBody } from './MarkdownBody'
import type { UpdateModule } from './ModuleTracking'
import { ProgressBar } from './ProgressDisplay'

const emptyAnswer: QuizAnswer = { choice: null, response: '', grade: null, checked: false }
type QuizMode = 'all' | 'missed' | 'flagged'

interface QuizProps {
  questions: Question[]
  value: ModuleProgress
  update: UpdateModule
}

export function QuizRunner({ questions, value, update }: QuizProps) {
  const [mode, setMode] = useState<QuizMode>('all')
  const [reviewIds, setReviewIds] = useState<string[]>([])
  const [position, setPosition] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const summary = quizSummary(questions, value)
  const flagged = questions.filter(({ id }) => value.flagged.includes(id)).map(({ id }) => id)
  const queue = mode === 'all' ? questions : questions.filter(({ id }) => reviewIds.includes(id))
  const question = queue[Math.min(position, queue.length - 1)]
  if (!question) return null

  const answer = value.answers[question.id] ?? emptyAnswer
  const isFlagged = value.flagged.includes(question.id)
  const hasOptions = question.options.length > 0
  const autoGrade = question.correctChoice !== null
  const canReveal = (!autoGrade || answer.checked) && Boolean(question.explanation)

  function navigate(index: number) {
    setPosition(index)
    setRevealed(false)
  }

  function selectMode(nextMode: QuizMode) {
    setMode(nextMode)
    const ids = nextMode === 'missed' ? summary.missed : flagged
    setReviewIds(ids)
    navigate(0)
    if (nextMode !== 'missed') return
    update((current) => ({
      ...current,
      answers: {
        ...current.answers,
        ...Object.fromEntries(ids.map((id) => [id, { ...emptyAnswer, grade: current.answers[id]?.grade ?? null }])),
      },
    }))
  }

  function setAnswer(change: Partial<QuizAnswer>) {
    update((current) => ({
      ...current,
      status: activeStatus(current.status),
      answers: { ...current.answers, [question.id]: { ...(current.answers[question.id] ?? emptyAnswer), ...change } },
    }))
  }

  function toggleFlag() {
    update((current) => ({
      ...current,
      flagged: current.flagged.includes(question.id)
        ? current.flagged.filter((id) => id !== question.id)
        : [...current.flagged, question.id],
    }))
  }

  return (
    <div className="quiz">
      <div className="quiz-overview">
        <div>
          <strong>{summary.graded} / {questions.length} questions graded</strong>
          <p>{summary.graded ? `${summary.correct} correct · ${summary.percent}% mastery` : 'Your score updates as you check answers.'}</p>
        </div>
        <span className="quiz-icon tone-violet"><CircleHelp size={23} /></span>
        <ProgressBar value={summary.graded / questions.length * 100} label="Quiz questions graded" />
      </div>
      <div className="quiz-controls">
        <div className="question-nav" aria-label="Jump to question">
          {queue.map((item, index) => {
            const grade = value.answers[item.id]?.grade
            const status = value.flagged.includes(item.id) ? ' · flagged' : ''
            const className = grade === true ? 'question-correct' : grade === false ? 'question-missed' : ''
            return (
              <button key={item.id} type="button" onClick={() => navigate(index)}
                className={className} aria-current={question.id === item.id ? 'step' : undefined}
                aria-label={`Question ${questions.indexOf(item) + 1}${status}`}>
                {questions.indexOf(item) + 1}{status && <span className="question-flag-dot" />}
              </button>
            )
          })}
        </div>
        <div className="quiz-review-actions">
          {mode === 'all' ? <>
            <button className="text-button" disabled={summary.missed.length === 0} onClick={() => selectMode('missed')}>
              <RotateCcw size={14} /> Retry missed
            </button>
            <button className="text-button" disabled={flagged.length === 0} onClick={() => selectMode('flagged')}>
              <Flag size={14} /> Review flagged
            </button>
          </> : <button className="text-button" onClick={() => selectMode('all')}>Back to all questions</button>}
        </div>
      </div>

      <section className="question-card" aria-label={`Question ${questions.indexOf(question) + 1}`}>
        <div className="question-heading">
          <span>{mode === 'missed' ? 'Retry missed' : mode === 'flagged' ? 'Flagged review' : hasOptions ? 'Scenario question' : 'Short response'}</span>
          <button className={`button button-neutral flag-button ${isFlagged ? 'flagged' : ''}`} aria-pressed={isFlagged}
            onClick={toggleFlag}><Flag size={14} />{isFlagged ? 'Flagged for review' : 'Flag for review'}</button>
        </div>
        <MarkdownBody markdown={question.prompt} />
        {hasOptions ? (
          <fieldset className="quiz-options">
            <legend className="sr-only">Answer choices</legend>
            {question.options.map((option, index) => {
              const selected = answer.choice === index
              const correct = answer.checked && question.correctChoice === index
              const missed = answer.checked && autoGrade && selected && answer.grade === false
              return (
                <label key={option.letter} className={`quiz-option ${selected ? 'option-selected' : ''} ${correct ? 'option-correct' : ''} ${missed ? 'option-missed' : ''}`}>
                  <input type="radio" name={question.id} checked={selected} disabled={answer.checked}
                    onChange={() => setAnswer({ choice: index })} />
                  <span className="option-letter">{option.letter}</span>
                  <InlineMarkdown markdown={option.text} />
                  {correct && <Check size={17} />}
                  {missed && <X size={17} />}
                </label>
              )
            })}
          </fieldset>
        ) : <textarea className="field-input quiz-response" aria-label="Your answer" placeholder="Write your response…"
          value={answer.response} onChange={(event) => setAnswer({ response: event.target.value })} disabled={answer.checked} />}

        <div className="question-actions">
          {autoGrade && !answer.checked && (
            <button className="button button-primary" disabled={answer.choice === null}
              onClick={() => setAnswer({ grade: answer.choice === question.correctChoice, checked: true })}>Check answer</button>
          )}
          {answer.checked && <span className={`quiz-result ${answer.grade ? 'result-correct' : 'result-missed'}`} role="status">
            {answer.grade ? <Check size={16} /> : <X size={16} />}{answer.grade ? 'Correct' : 'Needs review'}
          </span>}
          {canReveal && <button className="button button-neutral" aria-expanded={revealed}
            onClick={() => setRevealed(!revealed)}>{revealed ? 'Hide explanation' : 'Reveal explanation'}<ChevronDown size={14} /></button>}
          {!autoGrade && !question.explanation && <p className="field-hint">This question has no answer key.</p>}
        </div>
        {revealed && canReveal && (
          <div className="quiz-explanation">
            <h4>Answer &amp; explanation</h4>
            <MarkdownBody markdown={question.explanation} compact />
            {!autoGrade && !answer.checked && <div className="self-grade">
              <button className="button button-tinted" onClick={() => setAnswer({ grade: true, checked: true })}>My answer matched</button>
              <button className="button button-neutral" onClick={() => setAnswer({ grade: false, checked: true })}>I missed this</button>
            </div>}
          </div>
        )}
      </section>

      <div className="quiz-pagination">
        <button className="button button-neutral" disabled={position <= 0} onClick={() => navigate(position - 1)}><ArrowLeft size={15} /> Previous</button>
        <span>{position + 1} of {queue.length}</span>
        <button className="button button-neutral" disabled={position >= queue.length - 1} onClick={() => navigate(position + 1)}>Next <ArrowRight size={15} /></button>
      </div>
    </div>
  )
}
