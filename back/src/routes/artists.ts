import { Hono } from "hono";
import { Artist } from "../models/artists";
import { isValidObjectId } from "mongoose";
import { decode } from "hono/jwt";
import { Flash } from "../models/flashs";
import { SaveOnS3 } from "../aws-s3";
import { handle } from "hono/vercel";

const api = new Hono().basePath("/artists");

api.get("/", async (c) => {
  let filter = {} as any;
  const populate = [];

  const styleQuery = c.req.query("style");
  const locationQuery = c.req.query("location");
  const populateQuery = c.req.query("populate");
  let googleId = c.req.query("googleId") ?? "";
  const bearer = c.req.header("Authorization");

  if (bearer) {
    const token = bearer.split(" ")[1];
    googleId = decode(token).payload.sub as unknown as string;
    populate.push({ path: "flashs" });
  }

  if (styleQuery) {
    filter["styles"] = { $in: styleQuery + "" };
  }
  populate.push({ path: "styles" });

  if (populateQuery) {
    populate.push({ path: populateQuery + "" });
  }

  if (googleId) {
    filter["google_id"] = googleId;
  }

  if (locationQuery) {
    filter = {
      $and: [
        { ...filter },
        {
          $or: [
            { address: { $regex: locationQuery, $options: "i" } },
            {
              name: {
                $regex: locationQuery,
                $options: "i",
              },
            },
          ],
        },
      ],
    };
  }

  console.log("🍱 ====>", filter);

  return c.json(await Artist.find(filter).populate([...populate]));
});

api.get("/:id", async (c) => {
  const _id = c.req.param("id");

  if (isValidObjectId(_id)) {
    const oneArt = await Artist.findOne({ _id }).populate("flashs styles");
    return c.json(oneArt);
  }
  return c.json({ msg: "ObjectId malformed" }, 400);
});

api.get("/flash/:id", async (c) => {
  const _id = c.req.param("id");

  if (!_id) {
    return c.json({ msg: "ObjectId malformed" }, 400);
  }

  const oneArtist = await Artist.findOne({
    flashs: { $in: _id },
  });

  return c.json(oneArtist);
});

api.post("/", async (c) => {
  const body = await c.req.json();
  try {
    const newArt = new Artist(body);
    const saveArt = await newArt.save();
    return c.json(saveArt, 201);
  } catch (error: any) {
    return c.json(error._message, 400);
  }
});

api.post("/flashs", async (c) => {
  const bearer = c.req.header("Authorization");
  const body = await c.req.parseBody();
  body.img = await SaveOnS3(body["img"] as File);

  if (!bearer) return c.json({ msg: "Unauthorized" }, 401);

  const token = bearer.split(" ")[1];
  const artistId = decode(token).payload.sub as unknown as string;

  const newFlash = new Flash(body);
  const saveFlash = await newFlash.save();
  const { _id } = saveFlash;

  const updateQuery = {
    $addToSet: {
      flashs: _id,
      styles: body.style,
    },
  };
  const tryToUpdate = await Artist.findOneAndUpdate(
    {
      google_id: artistId,
    },
    updateQuery,
    {
      new: true,
    }
  );
  return c.json(tryToUpdate);
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
  const tryToUpdate = await Artist.findOneAndUpdate(q, updateQuery, {
    new: true,
  });
});

api.patch("/:id", async (c) => {
  const _id = c.req.param("id");
  const body = await c.req.json();
  const { styles, flashs, ...rest } = body;

  const tryToUpdate = await Artist.findOneAndUpdate(
    {
      _id,
    },
    {
      $addToSet: {
        styles: styles,
        flashs: flashs,
      },
      $set: { ...rest },
    },
    {
      new: true,
    }
  );
  return c.json(tryToUpdate, 200);
});

api.delete("/:id", async (c) => {
  const _id = c.req.param("id");
  const tryToDelete = await Artist.deleteOne({ _id });
  const { deletedCount } = tryToDelete;
  if (deletedCount) {
    return c.json({ msg: "DELETE done" });
  }
  return c.json({ msg: "not found" }, 404);
});

export const GET = handle(api);
export const POST = handle(api);
