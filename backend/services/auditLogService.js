const AuditLog = require("../models/AuditLog");

const createAuditLog = async ({
  userId,
  action,
  entityType,
  entityId = null,
  description,
  metadata = {},
  ipAddress = null,
}) => {
  try {
    await AuditLog.create({
      userId,
      action,
      entityType,
      entityId,
      description,
      metadata,
      ipAddress,
    });
  } catch (error) {
    console.error("Audit log creation failed:", error.message);
  }
};

module.exports = {
  createAuditLog,
};