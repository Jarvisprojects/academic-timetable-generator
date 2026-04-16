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
  
  console.log(`[Timetable ${timetableId}] Starting solver...`);
  
  try {
    await fs.writeFile(tempFile, JSON.stringify(inputJson));
    console.log(`[Timetable ${timetableId}] Temp file written: ${tempFile}`);
  } catch (writeErr) {
    console.error(`Failed to write temp file for timetable ${timetableId}:`, writeErr);
    await Timetable.updateStatus(
      timetableId,
      "failed",
      null,
      "Failed to prepare scheduler input file",
    );
    return;
  }

  const pythonPath = PYTHON_PATH;
  const moduleName = SCHEDULER_MODULE;

  console.log(`[Timetable ${timetableId}] Python path: ${pythonPath}`);
  console.log(`[Timetable ${timetableId}] Running: ${pythonPath} -m ${moduleName} ${tempFile}`);

  try {
    const pythonProcess = spawn(pythonPath, ["-m", moduleName, tempFile], {
      cwd: PROJECT_ROOT,
      stdio: ["ignore", "pipe", "pipe"], // Separate stdout and stderr
    });

    console.log(`[Timetable ${timetableId}] Process spawned with PID:`, pythonProcess.pid);

    let output = "";
    let error = "";
    let processCompleted = false;
    
    // Set a timeout of 5 minutes for the solver
    const timeoutId = setTimeout(async () => {
      if (!processCompleted) {
        console.warn(`[Timetable ${timetableId}] Solver timeout - killing process`);
        pythonProcess.kill("SIGTERM");
        
        // Force kill after 10 seconds if SIGTERM doesn't work
        setTimeout(() => {
          if (!processCompleted && pythonProcess.exitCode === null) {
            console.error(`[Timetable ${timetableId}] Force killing process`);
            pythonProcess.kill("SIGKILL");
          }
        }, 10000);
      }
    }, 10 * 60 * 1000); // 10 minutes (increased for testing)

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString();
      console.log(`[Timetable ${timetableId}] Python stdout:`, data.toString().substring(0, 200));
    });

    pythonProcess.stderr.on("data", (data) => {
      error += data.toString();
      console.error(`[Timetable ${timetableId}] Python stderr:`, data.toString());
    });

    pythonProcess.on("error", async (spawnErr) => {
      console.error(`[Timetable ${timetableId}] Failed to spawn Python process:`, spawnErr);
      processCompleted = true;
      clearTimeout(timeoutId);
      await fs.unlink(tempFile).catch(() => {});
      try {
        await Timetable.updateStatus(
          timetableId,
          "failed",
          null,
          `Scheduler error: ${spawnErr.message}`,
        );
        console.log(`[Timetable ${timetableId}] Updated status to failed (spawn error)`);
      } catch (dbErr) {
        console.error(`[Timetable ${timetableId}] Failed to update database on spawn error:`, dbErr);
      }
    });

    pythonProcess.on("close", async (code, signal) => {
      processCompleted = true;
      clearTimeout(timeoutId);
      console.log(`[Timetable ${timetableId}] Python process exited with code ${code}, signal ${signal}`);
      await fs.unlink(tempFile).catch((unlinkErr) => {
        console.warn(`[Timetable ${timetableId}] Failed to delete temp file:`, unlinkErr);
      });

      try {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            if (result.error) {
              console.warn(`[Timetable ${timetableId}] Scheduler returned error:`, result.error);
              await Timetable.updateStatus(
                timetableId,
                "failed",
                null,
                result.error,
              );
              console.log(`[Timetable ${timetableId}] Updated status to failed (solver error)`);
            } else {
              console.log(`[Timetable ${timetableId}] Scheduler succeeded`);
              await Timetable.updateStatus(timetableId, "success", result);
              console.log(`[Timetable ${timetableId}] Updated status to success`);
            }
          } catch (parseErr) {
            console.error(`[Timetable ${timetableId}] Failed to parse Python output:`, parseErr);
            console.error(`[Timetable ${timetableId}] Raw output:`, output.substring(0, 500));
            await Timetable.updateStatus(
              timetableId,
              "failed",
              null,
              "Scheduler produced invalid output",
            );
            console.log(`[Timetable ${timetableId}] Updated status to failed (parse error)`);
          }
        } else if (signal === "SIGTERM" || signal === "SIGKILL") {
          const errorMsg = `Solver timeout (${signal})`;
          console.error(`[Timetable ${timetableId}] Solver timeout:`, errorMsg);
          await Timetable.updateStatus(
            timetableId,
            "failed",
            null,
            errorMsg,
          );
          console.log(`[Timetable ${timetableId}] Updated status to failed (timeout)`);
        } else {
          const errorMsg = error || `Solver exited with code ${code}${signal ? ` (${signal})` : ""}`;
          console.error(`[Timetable ${timetableId}] Solver failed:`, errorMsg);
          await Timetable.updateStatus(
            timetableId,
            "failed",
            null,
            errorMsg,
          );
          console.log(`[Timetable ${timetableId}] Updated status to failed (exit code ${code})`);
        }
      } catch (updateErr) {
        console.error(`[Timetable ${timetableId}] Failed to update status in close handler:`, updateErr);
      }
    });
  } catch (err) {
    console.error(`[Timetable ${timetableId}] Unexpected error in runSolver:`, err);
    await fs.unlink(tempFile).catch(() => {});
    try {
      await Timetable.updateStatus(
        timetableId,
        "failed",
        null,
        `Unexpected error: ${err.message}`,
      );
    } catch (dbErr) {
      console.error(`[Timetable ${timetableId}] Failed to update database:`, dbErr);
    }
  }
}

module.exports = { runSolver };
