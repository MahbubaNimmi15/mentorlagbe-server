
import { Router } from "express";
import { ObjectId } from "mongodb";

import { connectDB } from "../config/db.js";
import {
  requireAuth,
  requireRole,
} from "../middlewares/auth.middleware.js";

const router = Router();

// Only logged-in tutors can manage activation.
router.use(requireAuth, requireRole("tutor"));

// PATCH /api/tuitions/:id/activation
// Body: { "isActive": true } or { "isActive": false }

router.patch("/:id/activation", async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body || {};

  if (
    typeof id !== "string" ||
    !/^[0-9a-fA-F]{24}$/.test(id)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid tuition ID",
    });
  }

  if (typeof isActive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "isActive must be true or false",
    });
  }

  try {
    const db = await connectDB();
    const tuitions = db.collection("tuitions");

    const filter = {
      _id: new ObjectId(id),
      tutorId: req.user.id,
    };

    const existing = await tuitions.findOne(filter);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Tuition not found or access denied",
      });
    }

    if (existing.status !== "approved") {
      return res.status(409).json({
        success: false,
        message:
          "Only approved tuitions can be activated or deactivated",
      });
    }

    const updated = await tuitions.findOneAndUpdate(
      {
        ...filter,
        status: "approved",
      },
      {
        $set: {
          isActive,
          updatedAt: new Date(),
        },
      },
      {
        returnDocument: "after",
      }
    );

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: "Tuition status changed. Refresh and try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Tuition activated successfully"
        : "Tuition deactivated successfully",
      tuition: {
        id: String(updated._id),
        title: updated.title,
        subject: updated.subject,
        classLevel: updated.classLevel,
        location: updated.location,
        salary: updated.salary,
        requirements: updated.requirements || "",
        tutorId: updated.tutorId,
        status: updated.status,
        isActive: updated.isActive,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Tuition activation failed:",
      error.name
    );

    return res.status(503).json({
      success: false,
      message: "Tuition activation service unavailable",
    });
  }
});

export default router;
