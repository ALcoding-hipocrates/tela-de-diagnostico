export function applyLR(priorProb: number, lr: number): number {
  const p = Math.max(0.001, Math.min(0.999, priorProb));
  const priorOdds = p / (1 - p);
  const postOdds = priorOdds * lr;
  return postOdds / (1 + postOdds);
}

export function bayesianDelta(currentPct: number, lr: number): number {
  const prior = currentPct / 100;
  const post = applyLR(prior, lr);
  return Math.round(post * 100) - currentPct;
}
