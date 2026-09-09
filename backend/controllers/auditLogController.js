const AuditLog = require("../models/AuditLog");

const getAuditLogs = async (req, res) => {
  try {
    const auditLogs = await AuditLog.find()
      .populate("userId", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: auditLogs.length,
      auditLogs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch audit logs",
      error: error.message,
    });
  }
};

module.exports = {
  getAuditLogs,
};