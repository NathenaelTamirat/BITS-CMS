// Upload media
// Accepts files from authenticated users
// Restricts file types to safe, allowed formats
// Stores the file in the database as binary data
// Returns a media ID and a URL for later access


// Serve media
// Fetches a file by its ID
// Sends the raw file bytes back with the correct Content-Type
// Lets the browser display or download the file directly

import { Router } from "express";
import multer from "multer";
import { authenticate } from "../Middleware/auth.js";
import { insertMedia, getMediaById } from "../DB/media.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { badRequest, notFound } from "../Utils/errors.js";

const router = Router();

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "application/pdf",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(badRequest("Unsupported file type"));
  },
});

router.post(
  "/upload",
  authenticate,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw badRequest("No file provided");
    }

    const uploaded = await insertMedia({
      mimeType: req.file.mimetype,
      fileData: req.file.buffer,
      uploadedBy: req.user?.sub ?? null,
    });

    res.status(201).json({
      data: {
        mediaId: uploaded.mediaId,
        url: `/api/media/${uploaded.mediaId}`,
        mimeType: uploaded.mimeType,
      },
      message: "OK",
    });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const mediaId = Number(req.params.id);

    if (!Number.isInteger(mediaId) || mediaId <= 0) {
      throw badRequest("Media id must be a positive integer");
    }

    const media = await getMediaById(mediaId);

    if (!media) {
      throw notFound("Media not found");
    }

    const total = media.fileData.length;
    res.set("Content-Type", media.mimeType);
    res.set("Cache-Control", "public, max-age=86400");
    res.set("Accept-Ranges", "bytes");

    const rangeHeader = req.headers.range;
    if (!rangeHeader) {
      res.set("Content-Length", String(total));
      res.send(media.fileData);
      return;
    }

    // Parse "bytes=START-END" (END optional)
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
    if (!match) {
      res.status(416).set("Content-Range", `bytes */${total}`).end();
      return;
    }

    const startStr = match[1];
    const endStr = match[2];
    let start = startStr === "" ? 0 : Number(startStr);
    let end = endStr === "" ? total - 1 : Number(endStr);

    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start > end ||
      start < 0 ||
      end >= total
    ) {
      end = Math.min(end, total - 1);
      if (start > end || start < 0) {
        res.status(416).set("Content-Range", `bytes */${total}`).end();
        return;
      }
    }

    const chunk = media.fileData.subarray(start, end + 1);
    res.status(206);
    res.set("Content-Range", `bytes ${start}-${end}/${total}`);
    res.set("Content-Length", String(chunk.length));
    res.send(chunk);
  }),
);

export default router;
