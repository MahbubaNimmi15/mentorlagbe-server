
import "dotenv/config";

import app from "./index.js";

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `MentorLagbe API running at http://localhost:${PORT}`
  );

  console.log(
    "MongoDB is disabled for preview deployment"
  );
});

function shutdown() {
  console.log("Closing MentorLagbe API...");

  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
