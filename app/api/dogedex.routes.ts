import { Router, type Request, type Response } from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import { SightingModel } from "../models/sighting.model.js";
import { createLogger } from "../../lib/logger.js";

const logger = createLogger("DogedexRoutes");
const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const UPLOADER_BASE_URL = "https://api-micro-uploader.quantumbyte.ai";
const AGENTIC_SERVICE_URL = "https://api-micro-agentic.quantumbyte.ai";

function keyspace() {
  return process.env._KEYSPACE ?? "";
}

function scaffolderKey() {
  return process.env.QB_SCAFFOLDER_KEY ?? "";
}

// POST /api/dogedex/sightings — create a sighting (upload photo + AI identify)
router.post(
  "/dogedex/sightings",
  upload.single("photo"),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ success: false, message: "photo is required" });
      }

      // 1. Upload photo to storage
      const form = new FormData();
      form.append("keyspace", keyspace());
      form.append("file", file.buffer, {
        filename: file.originalname || "dog.jpg",
        contentType: file.mimetype || "image/jpeg",
      });

      let photoUrl = "";
      let photoPath = "";

      try {
        const uploadRes = await axios.post(`${UPLOADER_BASE_URL}/files`, form, {
          headers: {
            "x-api-key": scaffolderKey(),
            ...form.getHeaders(),
          },
          timeout: 60_000,
          maxBodyLength: Infinity,
        });
        const { file_id, url } = uploadRes.data.result;
        photoPath = file_id;
        photoUrl = url || `/api/uploader/document/${file_id}`;
      } catch (uploadErr) {
        logger.error("Photo upload failed", uploadErr);
        // Continue without upload — store placeholder
        photoUrl = "";
        photoPath = "local";
      }

      // 2. AI breed identification
      let breedName = "Unknown Breed";
      let breedConfidence = 0;
      let breedAlternatives: Array<{ breed: string; confidence: number }> = [];

      const ks = keyspace();
      const key = scaffolderKey();

      if (ks && key) {
        try {
          const llmForm = new FormData();
          const schema = JSON.stringify({
            type: "object",
            properties: {
              breed: { type: "string" },
              confidence: { type: "number" },
              alternatives: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    breed: { type: "string" },
                    confidence: { type: "number" },
                  },
                  required: ["breed", "confidence"],
                },
              },
              is_dog: { type: "boolean" },
            },
            required: ["breed", "confidence", "alternatives", "is_dog"],
          });

          llmForm.append(
            "message",
            "Identify the dog breed in this image. Return the primary breed name with a confidence score (0-1), plus up to 3 alternative breeds with their confidence scores. If no dog is in the image, set is_dog to false and breed to 'Unknown'.",
          );
          llmForm.append("schema", schema);
          llmForm.append(
            "system_prompt",
            "You are an expert dog breed identifier. Analyze the image carefully and return accurate breed identification results in JSON format.",
          );
          llmForm.append("files", file.buffer, {
            filename: file.originalname || "dog.jpg",
            contentType: file.mimetype || "image/jpeg",
          });

          const llmRes = await axios.post(`${AGENTIC_SERVICE_URL}/api/llm`, llmForm, {
            headers: {
              "x-id-keyspace": ks,
              Authentication: key,
              ...llmForm.getHeaders(),
            },
            timeout: 60_000,
          });

          const llmData = llmRes.data?.response;
          if (llmData?.is_dog !== false) {
            breedName = llmData?.breed || "Unknown Breed";
            breedConfidence = Math.min(1, Math.max(0, llmData?.confidence ?? 0));
            breedAlternatives = (llmData?.alternatives || []).slice(0, 3);
          }
        } catch (aiErr) {
          logger.error("AI breed identification failed", aiErr);
          // Non-fatal — continue with unknown breed
        }
      }

      // 3. Parse location
      let lat: number | null = null;
      let lng: number | null = null;
      let locationLabel: string | null = null;

      if (req.body?.lat) lat = parseFloat(req.body.lat);
      if (req.body?.lng) lng = parseFloat(req.body.lng);
      if (req.body?.locationLabel) locationLabel = req.body.locationLabel;

      // 4. Save sighting
      const sighting = await SightingModel.create({
        photoUrl,
        photoPath,
        breedName,
        breedConfidence,
        breedAlternatives,
        location: { lat, lng, label: locationLabel },
        notes: req.body?.notes || "",
        dogName: req.body?.dogName || "",
        shared: false,
      });

      return res.status(201).json({ success: true, data: sighting });
    } catch (err) {
      logger.error("Create sighting failed", err);
      return res.status(500).json({ success: false, message: "Failed to create sighting" });
    }
  },
);

// GET /api/dogedex/sightings — list sightings. Pass ?shared=true to only
// return sightings the user has shared (used by the global Map tab).
router.get("/dogedex/sightings", async (req: Request, res: Response) => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.shared === "true") filter.shared = true;
    const sightings = await SightingModel.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: sightings });
  } catch (err) {
    logger.error("List sightings failed", err);
    return res.status(500).json({ success: false, message: "Failed to fetch sightings" });
  }
});

// GET /api/dogedex/sightings/:id
router.get("/dogedex/sightings/:id", async (req: Request, res: Response) => {
  try {
    const sighting = await SightingModel.findById(req.params.id).lean();
    if (!sighting) {
      return res.status(404).json({ success: false, message: "Sighting not found" });
    }
    return res.json({ success: true, data: sighting });
  } catch (err) {
    logger.error("Get sighting failed", err);
    return res.status(500).json({ success: false, message: "Failed to fetch sighting" });
  }
});

// PATCH /api/dogedex/sightings/:id — update notes, dogName, breedName, shared
router.patch("/dogedex/sightings/:id", async (req: Request, res: Response) => {
  try {
    const { notes, dogName, breedName, shared } = req.body ?? {};
    const update: Record<string, unknown> = {};
    if (notes !== undefined) update.notes = notes;
    if (dogName !== undefined) update.dogName = dogName;
    if (breedName !== undefined) update.breedName = breedName;
    if (shared !== undefined) update.shared = shared;

    const sighting = await SightingModel.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true },
    ).lean();

    if (!sighting) {
      return res.status(404).json({ success: false, message: "Sighting not found" });
    }
    return res.json({ success: true, data: sighting });
  } catch (err) {
    logger.error("Update sighting failed", err);
    return res.status(500).json({ success: false, message: "Failed to update sighting" });
  }
});

// DELETE /api/dogedex/sightings/:id
router.delete("/dogedex/sightings/:id", async (req: Request, res: Response) => {
  try {
    await SightingModel.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    logger.error("Delete sighting failed", err);
    return res.status(500).json({ success: false, message: "Failed to delete sighting" });
  }
});

// GET /api/dogedex/collection — unique breeds spotted
router.get("/dogedex/collection", async (_req: Request, res: Response) => {
  try {
    const breeds = await SightingModel.aggregate([
      {
        $group: {
          _id: "$breedName",
          count: { $sum: 1 },
          firstSeen: { $min: "$createdAt" },
          lastSeen: { $max: "$createdAt" },
          photoUrl: { $first: "$photoUrl" },
          sightingId: { $first: "$_id" },
        },
      },
      { $sort: { firstSeen: -1 } },
    ]);
    return res.json({ success: true, data: breeds });
  } catch (err) {
    logger.error("Collection failed", err);
    return res.status(500).json({ success: false, message: "Failed to fetch collection" });
  }
});

export default router;
