import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { DbConnect } from "./db";
import styles from "./pages/api/routes/styles";
import auth from "./pages/api/routes/auth";
import artists from "./pages/api/routes/artists";
import { cors } from "hono/cors";
import reservations from "./pages/api/routes/reservations";
import flashs from "./pages/api/routes/flashs";
import { handle } from "@hono/node-server/vercel";
import type { PageConfig } from "next";

export const config: PageConfig = {
  api: {
    bodyParser: false,
  },
};

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
