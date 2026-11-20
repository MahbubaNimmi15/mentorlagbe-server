
import { Router } from "express";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { connectDB } from "../config/db.js";
import {
  requireAuth,
  requireRole,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth, requireRole("tutor"));

const editSchema = z
  .object({
    title: z.string().trim().min(5).max(150),
    subject: z.string().trim().min(2).max(100),
    classLevel: z.string().trim().min(1).max(100),
    location: z.string().trim().min(2).max(200),
    salary: z.number().positive().max(1000000),
    requirements: z.string().trim().max(2000),
  })
  .partial()
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required"
  );

function validId(id) {
  return (
    typeof id === "string" &&
    /^[0-9a-fA-F]{24}$/.test(id)
  );
}

function publicTuition(tuition) {
  return {
    id: String(tuition._id),
    title: tuition.title,
    subject: tuition.subject,
    classLevel: tuition.classLevel,
    location: tuition.location,
    salary: tuition.salary,
    requirements: tuition.requirements || "",
    tutorId: tuition.tutorId,
    status: tuition.status,
    createdAt: tuition.createdAt,
    updatedAt: tuition.updatedAt,
  };
}

// PATCH /api/tuitions/:id
// Tutor can edit only their own tuition.
router.patch("/:id", async (req, res) => {
  const id = req.params.id;

  if (!validId(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid tuition ID",
    });
  }

  const parsed = editSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid tuition information",
      errors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const db = await connectDB();
    const collection = db.collection("tuitions");

    const filter = {
      _id: new ObjectId(id),
      tutorId: req.user.id,
    };

    const existing = await collection.findOne(filter);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Tuition not found",
      });
    }

    const updated = await collection.findOneAndUpdate(
      filter,
      {
        $set: {
          ...parsed.data,
          status: "pending",
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Tuition not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Tuition updated and submitted for approval",
      tuition: publicTuition(updated),
    });
  } catch (error) {
    console.error("Update tuition error:", error.name);

    return res.status(503).json({
      success: false,
      message: "Tuition update service unavailable",
    });
  }
});

// DELETE /api/tuitions/:id
// Tutor can delete only their own tuition.
router.delete("/:id", async (req, res) => {
  const id = req.params.id;

  if (!validId(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid tuition ID",
    });
  }

  try {
    const db = await connectDB();
    const collection = db.collection("tuitions");

    const result = await collection.deleteOne({
      _id: new ObjectId(id),
      tutorId: req.user.id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Tuition not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Tuition deleted successfully",
    });
  } catch (error) {
    console.error("Delete tuition error:", error.name);

    return res.status(503).json({
      success: false,
      message: "Tuition delete service unavailable",
    });
  }
});

export default router;
