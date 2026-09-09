const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const expenditureRoutes = require("./routes/expenditureRoutes");
const monitoringRoutes = require("./routes/monitoringRoutes");
const alertRoutes = require("./routes/alertRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");
const userRoutes = require("./routes/userRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reportRoutes = require("./routes/reportRoutes");
const thresholdRoutes = require("./routes/thresholdRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use(
  "/uploads",
  express.static(
    path.join(
      __dirname,
      "uploads"
    )
  )
);

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/departments",
  departmentRoutes
);

app.use(
  "/api/budgets",
  budgetRoutes
);

app.use(
  "/api/expenditures",
  expenditureRoutes
);

app.use(
  "/api/monitoring",
  monitoringRoutes
);

app.use(
  "/api/alerts",
  alertRoutes
);

app.use(
  "/api/audit-logs",
  auditLogRoutes
);

app.use(
  "/api/users",
  userRoutes
);

app.use(
  "/api/dashboard",
  dashboardRoutes
);

app.use(
  "/api/reports",
  reportRoutes
);

app.use(
  "/api/thresholds",
  thresholdRoutes
);

app.get("/", (req, res) => {
  res.json({
    message:
      "AI Budget Utilization Monitoring System API is running",
  });
});

const PORT =
  process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(
      PORT,
      () => {
        console.log(
          `Server running on port ${PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      "Failed to start server:",
      error.message
    );

    process.exit(1);
  }
};

startServer();