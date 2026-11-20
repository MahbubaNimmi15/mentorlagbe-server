
import { Router } from "express";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { connectDB } from "../config/db.js";
import {
  requireAuth,
  requireRole,
} from "../middlewares/auth.middleware.js";

const router = Router();

// Validate tuition information.
const tuitionSchema = z.object({
  title: z.string().trim().min(5).max(150),

  subject: z.string().trim().min(2).max(100),

  classLevel: z.string().trim().min(1).max(100),

  location: z.string().trim().min(2).max(200),

  salary: z.coerce.number().positive().max(1000000),

  requirements: z.string().trim().max(2000).optional(),
}).strict();

// MongoDB collection.
async function getTuitionsCollection() {
  const db = await connectDB();
  return db.collection("tuitions");
}

// Convert MongoDB document to a safe API response.
function publicTuition(tuition) {
  return {
    id: String(tuition._id),
    title: tuition.title,
    subject: tuition.subject,
    classLevel: tuition.classLevel,
    location: tuition.location,
    salary: tuition.salary,
    requirements: tuition.requirements,
    tutorId: tuition.tutorId,
    status: tuition.status,
    createdAt: tuition.createdAt,
    updatedAt: tuition.updatedAt,
  };
}

// POST /api/tuitions
// Only tutors can create tuition posts.
router.post(
  "/",
  requireAuth,
  requireRole("tutor"),
  async (req, res) => {
    const result = tuitionSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid tuition information",
        errors: result.error.flatten().fieldErrors,
      });
    }

    try {
      const tuitions = await getTuitionsCollection();

      const now = new Date();

      const newTuition = {
        ...result.data,

        requirements: result.data.requirements || "",

        tutorId: req.user.id,

        status: "pending",

        createdAt: now,
        updatedAt: now,
      };

      const insertResult = await tuitions.insertOne(
        newTuition
      );

      const tuition = {
        ...newTuition,
        _id: insertResult.insertedId,
      };

      return res.status(201).json({
        success: true,
        message: "Tuition submitted for admin approval",
        tuition: publicTuition(tuition),
      });
    } catch (error) {
      console.error("Create tuition failed:", error.name);

      return res.status(503).json({
        success: false,
        message: "Tuition service unavailable",
      });
    }
  }
);

// GET /api/tuitions/my
// Tutors can see their own tuition posts.
router.get(
  "/my",
  requireAuth,
  requireRole("tutor"),
  async (req, res) => {
    try {
      const tuitions = await getTuitionsCollection();

      const records = await tuitions
        .find({ tutorId: req.user.id })
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json({
        success: true,
        total: records.length,
        tuitions: records.map(publicTuition),
      });
    } catch (error) {
      console.error("Get my tuitions failed:", error.name);

      return res.status(503).json({
        success: false,
        message: "Tuition service unavailable",
      });
    }
  }
);

// GET /api/tuitions
// Public users can see approved tuition posts.
router.get("/", async (req, res) => {
  try {
    const tuitions = await getTuitionsCollection();

    const records = await tuitions
      .find({ status: "approved" })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return res.status(200).json({
      success: true,
      total: records.length,
      tuitions: records.map(publicTuition),
    });
  } catch (error) {
    console.error("Get tuitions failed:", error.name);

    return res.status(503).json({
      success: false,
      message: "Tuition service unavailable",
    });
  }
});

// GET /api/tuitions/admin/all
// Only admins can see every tuition post.
router.get(
  "/admin/all",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const tuitions = await getTuitionsCollection();

      const records = await tuitions
        .find({})
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();

      return res.status(200).json({
        success: true,
        total: records.length,
        tuitions: records.map(publicTuition),
      });
    } catch (error) {
      console.error("Admin tuition list failed:", error.name);

      return res.status(503).json({
        success: false,
        message: "Tuition service unavailable",
      });
    }
  }
);

// PATCH /api/tuitions/:id/approve
// Only admins can approve pending tuition posts.
router.patch(
  "/:id/approve",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tuition ID",
      });
    }

    try {
      const tuitions = await getTuitionsCollection();

      const result = await tuitions.findOneAndUpdate(
        {
          _id: new ObjectId(req.params.id),
          status: "pending",
        },
        {
          $set: {
            status: "approved",
            updatedAt: new Date(),
          },
        },
        {
          returnDocument: "after",
        }
      );

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Pending tuition not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Tuition approved successfully",
        tuition: publicTuition(result),
      });
    } catch (error) {
      console.error("Approve tuition failed:", error.name);

      return res.status(503).json({
        success: false,
        message: "Tuition approval unavailable",
      });
    }
  }
);

export default router;
