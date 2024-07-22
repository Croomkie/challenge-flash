import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { DbConnect } from "./db";
import styles from "./routes/styles";
import auth from "./routes/auth";
import artists from "./routes/artists";
import { cors } from "hono/cors";
import reservations from "./routes/reservations";
import flashs from "./routes/flashs";
import { handle } from "@hono/node-server/vercel";

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

export default handle(app);
