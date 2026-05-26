import { describe, it, expect } from 'vitest';
import { canTransition } from '../lib/state-machine.js';

describe('order state machine', () => {
  it('allows forward transitions through the happy path', () => {
    expect(canTransition('pending', 'accepted')).toBe(true);
    expect(canTransition('accepted', 'in_progress')).toBe(true);
    expect(canTransition('in_progress', 'completed')).toBe(true);
  });

  it('allows cancellation from non-terminal states', () => {
    expect(canTransition('pending', 'cancelled')).toBe(true);
    expect(canTransition('accepted', 'cancelled')).toBe(true);
    expect(canTransition('in_progress', 'cancelled')).toBe(true);
  });

  it('rejects backwards transitions', () => {
    expect(canTransition('accepted', 'pending')).toBe(false);
    expect(canTransition('in_progress', 'accepted')).toBe(false);
    expect(canTransition('completed', 'in_progress')).toBe(false);
  });

  it('rejects transitions out of terminal states', () => {
    expect(canTransition('completed', 'cancelled')).toBe(false);
    expect(canTransition('cancelled', 'pending')).toBe(false);
  });

  it('rejects skipping required intermediate states', () => {
    expect(canTransition('pending', 'completed')).toBe(false);
    expect(canTransition('pending', 'in_progress')).toBe(false);
  });
});
