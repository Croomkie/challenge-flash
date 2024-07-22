import { Hono } from "hono";
import { decode, sign } from "hono/jwt";
import { Artist } from "../models/artists";

const api = new Hono().basePath("/auth");

api.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { payload: decoded }: any = decode(body.credential);

    const artist = await Artist.findOne({ google_id: decoded.sub });
    if (!artist) {
      const newArtist = new Artist({
        google_id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        profile_img: decoded.picture,
      });
      await newArtist.save();
    }

    const payload = {
      sub: decoded.sub,
      role: "artist",
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // Token expires in 24 hours
    };
    const secret = "pouetpouetpouet";
    const token = await sign(payload, secret);

    return c.json({ token });
  } catch (error: any) {
    console.error(error);
    return c.json(error._message, 400);
  }
});

api.get("/me", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1] ?? "";
    const { payload: decoded } = decode(token);
    const artist = await Artist.findOne({ google_id: decoded.sub });
    return c.json(artist);
  } catch (error: any) {
    console.error(error);
    return c.json(error._message, 400);
  }
});

export default api;
