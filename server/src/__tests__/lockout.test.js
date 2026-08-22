import { describe, it, expect, beforeEach } from 'vitest'
import { isLocked, recordFailure, recordSuccess, _resetLockout } from '../lockout.js'

beforeEach(() => {
  _resetLockout()
})

describe('account lockout', () => {
  it('returns null when key never failed', () => {
    expect(isLocked('a@test.com')).toBeNull()
  })

  it('does not lock below threshold', () => {
    recordFailure('a@test.com')
    recordFailure('a@test.com')
    recordFailure('a@test.com')
    expect(isLocked('a@test.com')).toBeNull()
  })

  it('locks after max consecutive failures', () => {
    for (let i = 0; i < 5; i++) recordFailure('a@test.com')
    const minutes = isLocked('a@test.com')
    expect(minutes).toBeGreaterThanOrEqual(14)
    expect(minutes).toBeLessThanOrEqual(15)
  })

  it('keys are isolated per email', () => {
    for (let i = 0; i < 5; i++) recordFailure('a@test.com')
    expect(isLocked('b@test.com')).toBeNull()
  })

  it('success resets the counter', () => {
    recordFailure('a@test.com')
    recordFailure('a@test.com')
    recordFailure('a@test.com')
    recordSuccess('a@test.com')
    for (let i = 0; i < 4; i++) recordFailure('a@test.com')
    expect(isLocked('a@test.com')).toBeNull()
  })

  it('is case-insensitive by caller convention (key normalized upstream)', () => {
    for (let i = 0; i < 5; i++) recordFailure('A@TEST.COM')
    expect(isLocked('A@TEST.COM')).not.toBeNull()
  })
})
