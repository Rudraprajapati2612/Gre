import { describe, it, expect } from 'bun:test'
import { applyReview } from './srs'

const base = {
  status: 'new' as const,
  ease: 2.5,
  interval_days: 0,
  repetitions: 0,
  times_seen: 0,
  times_wrong: 0,
}

const TODAY = '2026-06-12'

describe('applyReview', () => {
  it('first correct → interval_days = 1, repetitions = 1, status = review', () => {
    const result = applyReview(base, 'good', TODAY)
    expect(result.repetitions).toBe(1)
    expect(result.interval_days).toBe(1)
    expect(result.status).toBe('review')
    expect(result.due_date).toBe('2026-06-13')
    expect(result.times_seen).toBe(1)
    expect(result.times_wrong).toBe(0)
  })

  it('second correct → interval_days = 6', () => {
    const after1 = applyReview(base, 'good', TODAY)
    const result = applyReview(after1, 'good', TODAY)
    expect(result.repetitions).toBe(2)
    expect(result.interval_days).toBe(6)
    expect(result.status).toBe('review')
  })

  it('third correct → interval_days = round(6 * ease)', () => {
    const after1 = applyReview(base, 'good', TODAY)
    const after2 = applyReview(after1, 'good', TODAY)
    const result = applyReview(after2, 'good', TODAY)
    expect(result.repetitions).toBe(3)
    // ease after two goods = 2.5 + (0.1 - 1 * (0.08 + 0.02)) = 2.5 + 0 = 2.5
    expect(result.interval_days).toBe(Math.round(6 * after2.ease))
    expect(result.status).toBe('review')
  })

  it('lapse resets repetitions to 0, interval to 1, status to learning', () => {
    const after1 = applyReview(base, 'good', TODAY)
    const after2 = applyReview(after1, 'good', TODAY)
    const result = applyReview(after2, 'again', TODAY)
    expect(result.repetitions).toBe(0)
    expect(result.interval_days).toBe(1)
    expect(result.status).toBe('learning')
    expect(result.times_wrong).toBe(1)
  })

  it('hard grade (q=3) still counts as correct', () => {
    const result = applyReview(base, 'hard', TODAY)
    expect(result.repetitions).toBe(1)
    expect(result.times_wrong).toBe(0)
  })

  it('ease floor is 1.3 after repeated lapses', () => {
    let prog = base
    for (let i = 0; i < 20; i++) prog = applyReview(prog, 'again', TODAY) as any
    // Force past the floor
    // Give a good to trigger ease update
    const result = applyReview(prog, 'good', TODAY)
    expect(result.ease).toBeGreaterThanOrEqual(1.3)
  })

  it('mastered threshold: interval_days >= 21 → status mastered', () => {
    // Build up enough repetitions to get interval ≥ 21
    let prog = { ...base }
    // Manually set to a state where next interval will be >= 21
    prog = { ...prog, repetitions: 5, interval_days: 15, ease: 2.5, status: 'review' as const }
    const result = applyReview(prog, 'good', TODAY)
    // interval = round(15 * 2.5) = 38 → mastered
    expect(result.interval_days).toBeGreaterThanOrEqual(21)
    expect(result.status).toBe('mastered')
  })

  it('times_seen increments on every review', () => {
    const r1 = applyReview(base, 'good', TODAY)
    const r2 = applyReview(r1, 'again', TODAY)
    expect(r1.times_seen).toBe(1)
    expect(r2.times_seen).toBe(2)
  })

  it('easy grade accelerates ease more than good', () => {
    const resultGood = applyReview(base, 'good', TODAY)
    const resultEasy = applyReview(base, 'easy', TODAY)
    expect(resultEasy.ease).toBeGreaterThan(resultGood.ease)
  })
})
