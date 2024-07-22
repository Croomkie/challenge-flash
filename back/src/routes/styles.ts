import { Hono } from "hono";
import { Style } from "../models/styles";
import { isValidObjectId } from "mongoose";
import { SaveOnS3 } from "../aws-s3";

const api = new Hono().basePath("/styles");

api.get("/", async (c) => {
  return c.json(await Style.find().sort({ name: 1 }));
});

api.get("/:id", async (c) => {
  const _id = c.req.param("id");

  if (isValidObjectId(_id)) {
    const oneStyle = await Style.findOne({ _id });
    return c.json(oneStyle);
  }
  return c.json({ msg: "ObjectId malformed" }, 400);
});

api.post("/", async (c) => {
  const body = await c.req.parseBody();
  try {
    body.image = await SaveOnS3(body["image"] as File);
    const newStyle = new Style(body);
    const saveStyle = await newStyle.save();
    return c.json(saveStyle, 201);
  } catch (error: any) {
    return c.json(error._message, 400);
  }
});

api.put("/:id", async (c) => {
  const _id = c.req.param("id");
  const body = await c.req.json();
  const tryToUpdate = await Style.findOneAndUpdate(
    {
      _id,
    },
    body,
    {
      new: true,
    }
  );
  return c.json(tryToUpdate, 200);
});

api.delete("/:id", async (c) => {
  const _id = c.req.param("id");
  const tryToDelete = await Style.deleteOne({ _id });
  const { deletedCount } = tryToDelete;
  if (deletedCount) {
    return c.json({ msg: "DELETE done" });
  }
  return c.json({ msg: "not found" }, 404);
});

export default api;
