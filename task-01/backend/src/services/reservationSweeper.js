const orderService = require("./orderService");

let timer = null;

function startReservationSweeper() {
  const intervalMs = Number(process.env.RESERVATION_SWEEP_INTERVAL_MS || 15000);

  timer = setInterval(async () => {
    try {
      const count = await orderService.sweepExpiredReservations();
      if (count > 0) console.log(`[sweeper] expired ${count} reservation(s)`);
    } catch (err) {
      console.error("[sweeper] error:", err.message);
    }
  }, intervalMs);

  console.log(`Reservation sweeper running every ${intervalMs}ms`);
  return timer;
}

function stopReservationSweeper() {
  if (timer) clearInterval(timer);
}

module.exports = { startReservationSweeper, stopReservationSweeper };
