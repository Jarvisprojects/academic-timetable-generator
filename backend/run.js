// backend/run.js
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs").promises;
const os = require("os");
const Timetable = require("./models/Timetable"); // ← corrected path
const { PYTHON_PATH, SCHEDULER_MODULE, PROJECT_ROOT } = require("./config");

async function runSolver(timetableId, inputJson) {
  const tempFile = path.join(
    os.tmpdir(),
    `timetable-${timetableId}-${Date.now()}.json`,
  );
  await fs.writeFile(tempFile, JSON.stringify(inputJson));

  const pythonPath = PYTHON_PATH;
  const moduleName = SCHEDULER_MODULE;

  console.log(`Running: ${pythonPath} -m ${moduleName} ${tempFile}`);

  const pythonProcess = spawn(pythonPath, ["-m", moduleName, tempFile], {
    cwd: PROJECT_ROOT,
  });

  let output = "";
  let error = "";

  pythonProcess.stdout.on("data", (data) => {
    output += data.toString();
    console.log("Python stdout:", data.toString());
  });

  pythonProcess.stderr.on("data", (data) => {
    error += data.toString();
    console.error("Python stderr:", data.toString());
  });

  pythonProcess.on("close", async (code) => {
    console.log(`Python process exited with code ${code}`);
    await fs.unlink(tempFile).catch(() => {});
    if (code === 0) {
      try {
        const result = JSON.parse(output);
        if (result.error) {
          await Timetable.updateStatus(
            timetableId,
            "failed",
            null,
            result.error,
          );
        } else {
          await Timetable.updateStatus(timetableId, "success", result);
        }
      } catch (e) {
        console.error("Failed to parse Python output:", e);
        await Timetable.updateStatus(
          timetableId,
          "failed",
          null,
          "Invalid output from solver",
        );
      }
    } else {
      await Timetable.updateStatus(
        timetableId,
        "failed",
        null,
        error || "Solver crashed",
      );
    }
  });
}

module.exports = { runSolver };
