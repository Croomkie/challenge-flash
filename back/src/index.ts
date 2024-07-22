import { Hono } from "hono";
import styles from "./routes/styles.js";
import auth from "./routes/auth.js";
import artists from "./routes/artists.js";
import { cors } from "hono/cors";
import reservations from "./routes/reservations.js";
import flashs from "./routes/flashs.js";
import { createServer } from "node:http2";
import { serve } from "@hono/node-server";
import { DbConnect } from "./db.js";

const app = new Hono();
await DbConnect();

app.use("/api/*", cors());

app.route("/api", styles);
app.route("/api", auth);
app.route("/api", artists);
app.route("/api", reservations);
app.route("/api", flashs);

app.all("*", (c) => {
  return c.json({ msg: "404 oups" });
});

const server = serve({
  fetch: app.fetch,
  createServer,
});
