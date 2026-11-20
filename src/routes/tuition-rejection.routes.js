
import { Router } from "express";
import { ObjectId } from "mongodb";

import { connectDB } from "../config/db.js";
import {
  requireAuth,
  requireRole,
} from "../middlewares/auth.middleware.js";

const router = Router();

// Only authenticated admin accounts can reject tuitions.
router.use(requireAuth, requireRole("admin"));

// PATCH /api/tuitions/:id/reject
router.patch("/:id/reject", async (req, res) => {
  const { id } = req.params;

  if (
    typeof id !== "string" ||
    !/^[0-9a-fA-F]{24}$/.test(id)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid tuition ID",
    });
  }

  try {
    const db = await connectDB();
    const collection = db.collection("tuitions");

    // Only pending submissions can be rejected.
    const updated = await collection.findOneAndUpdate(
      {
        _id: new ObjectId(id),
        status: "pending",
      },
      {
        $set: {
          status: "rejected",
          updatedAt: new Date(),
        },
      },
      {
        returnDocument: "after",
      }
    );

    if (!updated) {
      const existing = await collection.findOne({
        _id: new ObjectId(id),
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Tuition not found",
        });
      }

      return res.status(409).json({
        success: false,
        message:
          "Only pending tuitions can be rejected",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Tuition rejected successfully",
      tuition: {
        id: String(updated._id),
        title: updated.title,
        tutorId: updated.tutorId,
        subject: updated.subject,
        classLevel: updated.classLevel,
        location: updated.location,
        salary: updated.salary,
        requirements: updated.requirements || "",
        status: updated.status,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Reject tuition error:",
      error.name
    );

    return res.status(503).json({
      success: false,
      message: "Tuition rejection service unavailable",
    });
  }
});

export default router;
