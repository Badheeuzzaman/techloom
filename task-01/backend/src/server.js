require("dotenv").config();

const app = require("./app");
const { connectDatabase } = require("./config/db");
const { startReservationSweeper } = require("./services/reservationSweeper");

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDatabase(); // fail fast if MongoDB isn't reachable
    startReservationSweeper();
    app.listen(PORT, () => console.log(`POS API listening on port ${PORT}`));
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

start();
