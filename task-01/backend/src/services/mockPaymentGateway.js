/**
 * Simulates a third-party payment gateway. Real gateways are slow and
 * unpredictable, so this adds a short artificial delay before resolving.
 *
 * @param {"success"|"failure"|"timeout"|undefined} forcedOutcome
 *   Pass an explicit outcome for deterministic testing/demo purposes.
 *   Omit it to get a randomized outcome, weighted towards success like a
 *   real gateway would be.
 */
async function charge(amount, forcedOutcome) {
  await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 400));

  const outcome = forcedOutcome || weightedRandomOutcome();

  return { outcome, amount, processedAt: new Date().toISOString() };
}

function weightedRandomOutcome() {
  const r = Math.random();
  if (r < 0.75) return "success";
  if (r < 0.92) return "failure";
  return "timeout";
}

module.exports = { charge };
