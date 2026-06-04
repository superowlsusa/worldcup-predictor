export function outcome(home: number, away: number): 'H' | 'A' | 'D' {
  if (home > away) return 'H';
  if (away > home) return 'A';
  return 'D';
}

export function calculatePoints(predHome: number, predAway: number, actualHome: number, actualAway: number): number {
  if (predHome === actualHome && predAway === actualAway) return 3;
  return outcome(predHome, predAway) === outcome(actualHome, actualAway) ? 1 : 0;
}

export function isPredictionLocked(kickoffUtc: string, now = new Date()): boolean {
  const kickoff = new Date(kickoffUtc).getTime();
  return now.getTime() >= kickoff - 60 * 60 * 1000;
}
