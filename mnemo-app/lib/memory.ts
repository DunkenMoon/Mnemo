export interface MemoryState {
  strength: number;
  interval: number;
  easeFactor: number;
  repetitions: number;
  lastReviewedAt: Date | null;
}

export function calculateNextState(
  current: MemoryState,
  correct: boolean,
  responseQuality: number
): MemoryState {
  let { interval, easeFactor, repetitions } = current;

  if (!correct || responseQuality < 3) {
    repetitions = 0;
    interval = Math.max(1, Math.round(interval / 2));
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    interval = Math.round(interval * easeFactor);
    const qualityBonus = (responseQuality - 3) * 0.1;
    easeFactor = Math.min(2.5, easeFactor + 0.1 + qualityBonus);
    repetitions++;
  }

  let decayPenalty = 0;
  if (current.lastReviewedAt) {
    const daysSince = (Date.now() - current.lastReviewedAt.getTime()) / 86400000;
    if (daysSince > interval) {
      const overdueDays = daysSince - interval;
      decayPenalty = Math.min(0.5, overdueDays * 0.02);
    }
  }

  const accuracyBase = repetitions > 0 ? Math.min(1, repetitions / 10) : 0.2;
  const easeBoost = (easeFactor - 1.3) / 1.2;
  const strength = Math.max(0, Math.min(1, accuracyBase * 0.6 + easeBoost * 0.4 - decayPenalty));

  return {
    strength,
    interval,
    easeFactor,
    repetitions,
    lastReviewedAt: new Date(),
  };
}

export function predictStrength(state: MemoryState, daysFromNow: number): number {
  if (!state.lastReviewedAt) return state.strength;
  const overdueDays = Math.max(0, daysFromNow - state.interval);
  return Math.max(0, state.strength - overdueDays * 0.04);
}

export function priorityScore(state: MemoryState): number {
  const agePenalty = state.lastReviewedAt
    ? (Date.now() - state.lastReviewedAt.getTime()) / 86400000 / Math.max(state.interval, 1)
    : 999;
  return (1 - state.strength) * 0.6 + Math.min(agePenalty, 2) * 0.4;
}
