require("dotenv").config();
const express = require("express");
const path = require("path");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/api/auth");
const timetablesRoutes = require("./routes/api/timetables");
const adminRoutes = require("./routes/api/admin");
const Timetable = require("./models/Timetable");

const app = express();

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

// Auth routes (public)
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
