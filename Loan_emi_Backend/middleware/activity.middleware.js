import ActivityLog from "../models/activitylog.js";

export const logActivity = async ({
  action,
  entityType,
  entityId,
  user,
  description,
  meta = {}
}) => {
  try {
    await ActivityLog.create({
      action,
      entityType,
      entityId,
      user,
      description,
      meta
    });
  } catch (error) {
    console.error("Activity log error:", error.message);
  }
};
