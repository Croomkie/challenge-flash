import { Hono } from "hono";
import { Reservation } from "../../../models/reservations";
import { Artist } from "../../../models/artists";
import { decode } from "hono/jwt";
import { handle } from "hono/vercel";
import type { PageConfig } from "next";

export const config: PageConfig = {
  runtime: "edge",
};

const api = new Hono().basePath("/reservations");

api.get("/", async (c) => {
  const { date } = c.req.query();
  const userId = c.req.query("userId");
  if (!date) {
    return c.json(await Reservation.find());
  }

  if (date && userId) {
    const dateFilter = new Date(date).setHours(0, 0, 0, 0);
    const reservations = await Reservation.find({
      start_date: {
        $gte: dateFilter,
        $lt: new Date(dateFilter).setDate(new Date(dateFilter).getDate() + 1),
      },
      artist: userId,
    });
    return c.json(reservations);
  }

  //Get token from headers
  const bearer = c.req.header("Authorization");
  if (!bearer) {
    return c.json({ msg: "Unauthorized" }, 401);
  }

  //Get GoogleId from token
  const token = bearer.split(" ")[1];

  //Get GoogleId from token
  const { payload: decoded }: any = decode(token);

  //Get artistId from GoogleId
  const artistId = await Artist.findOne({ google_id: decoded.sub });

  const dateFilter = new Date(date).setHours(0, 0, 0, 0);
  const reservations = await Reservation.find({
    start_date: {
      $gte: dateFilter,
      $lt: new Date(dateFilter).setDate(new Date(dateFilter).getDate() + 1),
    },
    artist: artistId,
  });
  return c.json(reservations);
});

api.post("/", async (c) => {
  const body = await c.req.json();
  console.log(body);
  try {
    const newReservation = new Reservation(body);
    const saveReservation = await newReservation.save();
    return c.json(saveReservation, 201);
  } catch (error: any) {
    return c.json(error._message, 400);
  }
});

api.put("/:id", async (c) => {
  const _id = c.req.param("id");
  const body = await c.req.json();
  const q = {
    _id,
  };
  const updateQuery = {
    ...body,
  };
  const tryToUpdate = await Reservation.findOneAndUpdate(q, updateQuery, {
    new: true,
  });
  return c.json(tryToUpdate, 200);
});

api.delete("/:id", async (c) => {
  const _id = c.req.param("id");
  const tryToDelete = await Reservation.deleteOne({ _id });
  const { deletedCount } = tryToDelete;
  if (deletedCount) {
    return c.json({ msg: "DELETE done" });
  }
  return c.json({ msg: "not found" }, 404);
});

export default handle(api);
