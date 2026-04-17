require("dotenv").config();
const express = require("express");
const path = require("path");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const { validateEnvironment } = require("./config");
const authRoutes = require("./routes/api/auth");
const timetablesRoutes = require("./routes/api/timetables");
const adminRoutes = require("./routes/api/admin");
const Timetable = require("./models/Timetable");

// ========== ENVIRONMENT VALIDATION ==========
const { errors, warnings } = validateEnvironment();

if (errors.length > 0) {
    console.error("\n❌ CRITICAL CONFIGURATION ERRORS:");
    errors.forEach(err => console.error(`   - ${err}`));
    console.error("\n📝 Please fix the following and restart:");
    console.error("   1. Copy .env.example to .env");
    console.error("   2. Update all environment variables");
    console.error("   3. npm run setup (to initialize database)\n");
    process.exit(1);
}

if (warnings.length > 0) {
    console.warn("\n⚠️  CONFIGURATION WARNINGS:");
    warnings.forEach(warn => console.warn(`   - ${warn}`));
    console.warn("");
}

const app = express();

// Required when running behind reverse proxies (e.g., Codespaces) so rate limiting can resolve client IP safely.
app.set('trust proxy', 1);

// ========== SECURITY MIDDLEWARE ==========
// Add all HTTP headers for security (must be early)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://fonts.googleapis.com"],
            scriptSrcAttr: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
        },
    },
    frameguard: { action: 'deny' },
    xssFilter: true,
    noSniff: true,
}));

// Rate limiting: General 200 requests per 15 minutes
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
});

// Apply general rate limiter to all routes
app.use(generalLimiter);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "../frontend")));

console.log("JWT_SECRET in use:", process.env.JWT_SECRET);

function authenticate(req, res, next) {
  let token = req.cookies?.token;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }
  if (!token) {
    console.log(`[${req.url}] No token – redirect`);
    if (req.path.startsWith("/api/")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    return res.redirect("/login");
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`[${req.url}] ✅ Token verified for ${decoded.username}`);
    req.user = decoded;
    next();
  } catch (err) {
    console.error(`[${req.url}] ❌ Token error: ${err.message}`);
    if (req.path.startsWith("/api/")) {
      return res.status(401).json({ error: "Invalid token" });
    }
    return res.redirect("/login");
  }
}

function requireTimetableAccess(req, res, next) {
  if (req.user.is_admin) {
    return res.redirect("/admin");
  }
  next();
}

// Public
app.get("/", (req, res) => res.render("index"));
app.get("/login", (req, res) => res.render("login"));

// Auth routes (public) with rate limiting for login endpoint
app.use("/api/auth", authRoutes);

// Protect all other API routes
app.use("/api", authenticate);
app.use("/api/timetables", timetablesRoutes);
app.use("/api/admin", adminRoutes);

// Page routes
app.get("/dashboard", authenticate, requireTimetableAccess, (req, res) => {
  console.log("Rendering dashboard for:", req.user.username);
  res.render("dashboard");
});
app.get("/new", authenticate, requireTimetableAccess, (req, res) =>
  res.render("new"),
);
app.get("/processing", authenticate, requireTimetableAccess, (req, res) =>
  res.render("processing"),
);
app.get("/view", authenticate, requireTimetableAccess, (req, res) =>
  res.render("view"),
);
app.get("/failed", authenticate, requireTimetableAccess, (req, res) =>
  res.render("failed"),
);

app.get("/admin", authenticate, (req, res) => {
  if (!req.user.is_admin) return res.status(403).send("Forbidden");
  res.render("admin");
});

// Grid routes
app.get("/grid", authenticate, requireTimetableAccess, async (req, res) => {
  const id = req.query.id;
  if (!id) return res.redirect("/dashboard");
  try {
    const timetable = await Timetable.findById(id);
    if (!timetable || timetable.user_id !== req.user.id)
      return res.status(404).send("Not found");
    if (timetable.status !== "success")
      return res.redirect(`/processing?id=${id}`);
    if (typeof timetable.input_json === "string")
      timetable.input_json = JSON.parse(timetable.input_json);
    if (typeof timetable.output_json === "string")
      timetable.output_json = JSON.parse(timetable.output_json);
    res.render("grid", { timetable });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.get(
  "/teacher-grid",
  authenticate,
  requireTimetableAccess,
  async (req, res) => {
    const id = req.query.id;
    const teacher = req.query.teacher;
    if (!id) return res.redirect("/dashboard");
    try {
      const timetable = await Timetable.findById(id);
      if (!timetable || timetable.user_id !== req.user.id)
        return res.status(404).send("Not found");
      if (timetable.status !== "success")
        return res.redirect(`/processing?id=${id}`);
      if (typeof timetable.input_json === "string")
        timetable.input_json = JSON.parse(timetable.input_json);
      if (typeof timetable.output_json === "string")
        timetable.output_json = JSON.parse(timetable.output_json);
      if (!teacher) {
        const teachersSet = new Set();
        timetable.output_json.events.forEach((ev) =>
          teachersSet.add(ev.teacher),
        );
        const teachers = Array.from(teachersSet).sort();
        return res.render("teacher-list", { timetable, teachers });
      }
      const events = timetable.output_json.events.filter(
        (ev) => ev.teacher === teacher,
      );
      const slotMapping = timetable.output_json.slot_mapping;
      const daysCount = timetable.input_json.time_settings.days;
      res.render("teacher-grid", {
        timetable,
        teacher,
        events,
        slotMapping,
        daysCount,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  },
);

app.get(
  "/batch-grid",
  authenticate,
  requireTimetableAccess,
  async (req, res) => {
    const id = req.query.id;
    const batch = req.query.batch;
    if (!id) return res.redirect("/dashboard");
    try {
      const timetable = await Timetable.findById(id);
      if (!timetable || timetable.user_id !== req.user.id)
        return res.status(404).send("Not found");
      if (timetable.status !== "success")
        return res.redirect(`/processing?id=${id}`);
      if (typeof timetable.input_json === "string")
        timetable.input_json = JSON.parse(timetable.input_json);
      if (typeof timetable.output_json === "string")
        timetable.output_json = JSON.parse(timetable.output_json);
      if (!batch) {
        const batches = timetable.input_json.batches.map((b) => ({
          name: b.name,
          year: b.year,
        }));
        return res.render("batch-list", { timetable, batches });
      }
      const [year, batchName] = batch.split("-");
      const events = timetable.output_json.events.filter((ev) => {
        if (ev.type === "lecture") return ev.year === year;
        if (ev.type === "practical")
          return ev.batch === batchName && ev.year === year;
        return false;
      });
      const slotMapping = timetable.output_json.slot_mapping[year];
      if (!slotMapping) return res.status(404).send("Year not found");
      const daysCount = timetable.input_json.time_settings.days;
      res.render("batch-grid", {
        timetable,
        batch,
        year,
        batchName,
        events,
        slotMapping,
        daysCount,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  },
);

app.get(
  "/year-grid",
  authenticate,
  requireTimetableAccess,
  async (req, res) => {
    const id = req.query.id;
    const year = req.query.year;
    if (!id) return res.redirect("/dashboard");
    try {
      const timetable = await Timetable.findById(id);
      if (!timetable || timetable.user_id !== req.user.id)
        return res.status(404).send("Not found");
      if (timetable.status !== "success")
        return res.redirect(`/processing?id=${id}`);
      if (typeof timetable.input_json === "string")
        timetable.input_json = JSON.parse(timetable.input_json);
      if (typeof timetable.output_json === "string")
        timetable.output_json = JSON.parse(timetable.output_json);
      if (!year) {
        const years = timetable.input_json.years;
        return res.render("year-list", { timetable, years });
      }
      const slotMapping = timetable.output_json.slot_mapping[year];
      if (!slotMapping) return res.status(404).send("Year not found");
      const events = timetable.output_json.events.filter(
        (ev) => ev.year === year,
      );
      const daysCount = timetable.input_json.time_settings.days;
      res.render("year-grid", {
        timetable,
        year,
        events,
        slotMapping,
        daysCount,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  },
);

// Favicon route to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).send();
});

const PORT = process.env.PORT || 3000;

// ========== SETUP WIZARD ==========
// Run setup wizard on first start (if no admin exists)
const { runSetupWizard } = require('./setup-wizard');

(async () => {
    try {
        await runSetupWizard();
        app.listen(PORT, () => console.log(`\n🚀 Server running on port ${PORT}\n`));
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
})();
