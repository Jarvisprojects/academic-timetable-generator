document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------ Global Data ------------------------------
  window.yearsList = window.yearsList || [];
  window.teachersList = window.teachersList || [];
  window.labsList = window.labsList || [];

  // Helper: rebuild global arrays from DOM (for safety)
  function rebuildGlobalArrays() {
    const years = new Set();
    document.querySelectorAll('[name="year[]"]').forEach((y) => {
      if (y.value.trim()) years.add(y.value.trim());
    });
    window.yearsList = Array.from(years);

    const teacherObjs = [];
    document.querySelectorAll(".teacher-card").forEach((card) => {
      const name = card.querySelector('[name="teacher_name[]"]')?.value.trim();
      if (name) {
        teacherObjs.push({
          name: name,
          max_lectures_per_day:
            parseInt(card.querySelector('[name="max_lectures[]"]')?.value) || 0,
          max_practicals_per_day:
            parseInt(card.querySelector('[name="max_practicals[]"]')?.value) || 0,
          enforce_limits:
            card.querySelector('[name="enforce_limits[]"]')?.checked || false,
        });
      }
    });
    window.teachersList = teacherObjs;

    const labs = new Set();
    document.querySelectorAll('[name="lab[]"]').forEach((l) => {
      if (l.value.trim()) labs.add(l.value.trim());
    });
    window.labsList = Array.from(labs);
  }

  // ------------------------------ Helper Functions ------------------------------
  function format12Hour(hour, minute, ampm) {
    let h = parseInt(hour);
    let m = parseInt(minute);
    if (isNaN(h) || isNaN(m)) return null;
    if (ampm === "AM" && h === 12) h = 0;
    if (ampm === "PM" && h !== 12) h += 12;
    const minuteStr = m.toString().padStart(2, "0");
    let hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;
    return `${hour12}:${minuteStr} ${ampm}`;
  }

  function timeToMinutes(timeStr) {
    if (!timeStr) return null;
    const [time, ampm] = timeStr.split(" ");
    let [hour, minute] = time.split(":");
    hour = parseInt(hour);
    minute = parseInt(minute);
    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;
    return hour * 60 + minute;
  }

  function minutesToTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
  }

  function getCurrentTimeSettings() {
    const dayStart = format12Hour(
      document.querySelector(".start-hour").value,
      document.querySelector(".start-minute").value,
      document.querySelector(".start-ampm").value,
    );
    const dayEnd = format12Hour(
      document.querySelector(".end-hour").value,
      document.querySelector(".end-minute").value,
      document.querySelector(".end-ampm").value,
    );
    const slotDuration = parseInt(
      document.querySelector('[name="slot_duration"]').value,
    );
    const days = parseInt(document.querySelector('[name="days"]').value);
    return { dayStart, dayEnd, slotDuration, days };
  }

  function getSlotBoundaries(dayStartMinutes, slotDuration, dayEndMinutes) {
    const boundaries = [];
    let t = dayStartMinutes;
    while (t < dayEndMinutes) {
      boundaries.push(t);
      t += slotDuration;
    }
    return boundaries;
  }

  // ------------------------------ Real-time Validation ------------------------------
  let validationErrors = [];
  let validationWarnings = [];

  function updateErrorSummary() {
    const errorDiv = document.getElementById("error-summary");
    if (!errorDiv) return;

    if (validationErrors.length === 0 && validationWarnings.length === 0) {
      errorDiv.classList.add("hidden");
      return;
    }
    errorDiv.classList.remove("hidden");

    // Group by section
    const groupedErrors = {};
    const groupedWarnings = {};

    validationErrors.forEach((err) => {
      const section = err.section || "General";
      if (!groupedErrors[section]) groupedErrors[section] = [];
      groupedErrors[section].push(err);
    });
    validationWarnings.forEach((warn) => {
      const section = warn.section || "General";
      if (!groupedWarnings[section]) groupedWarnings[section] = [];
      groupedWarnings[section].push(warn);
    });

    let html = `<div class="font-bold mb-2 flex items-center gap-2">
                  <span class="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">${validationErrors.length} errors</span>
                  <span class="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs">${validationWarnings.length} warnings</span>
                </div>`;

    for (const [section, errors] of Object.entries(groupedErrors)) {
      html += `<div class="mt-3"><div class="font-semibold text-slate-700 text-sm mb-1">❌ ${section}</div><ul class="list-disc pl-5 text-sm space-y-1">`;
      errors.forEach((err) => {
        html += `<li class="text-red-600 cursor-pointer hover:underline error-item" data-error-idx="${validationErrors.indexOf(err)}">❌ ${err.message}</li>`;
      });
      html += `</ul></div>`;
    }

    for (const [section, warnings] of Object.entries(groupedWarnings)) {
      html += `<div class="mt-3"><div class="font-semibold text-slate-700 text-sm mb-1">⚠️ ${section}</div><ul class="list-disc pl-5 text-sm space-y-1">`;
      warnings.forEach((warn) => {
        html += `<li class="text-yellow-600 cursor-pointer hover:underline warning-item" data-warn-idx="${validationWarnings.indexOf(warn)}">⚠️ ${warn.message}</li>`;
      });
      html += `</ul></div>`;
    }

    errorDiv.innerHTML = html;

    // Attach click handlers for errors
    document.querySelectorAll(".error-item").forEach((li) => {
      li.addEventListener("click", () => {
        const idx = parseInt(li.getAttribute("data-error-idx"));
        const err = validationErrors[idx];
        if (err && err.element) {
          const yOffset = -80;
          const y = err.element.getBoundingClientRect().top + window.scrollY + yOffset;
          window.scrollTo({ top: y, behavior: "smooth" });
          err.element.style.transition = "box-shadow 0.2s";
          err.element.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.5)";
          setTimeout(() => (err.element.style.boxShadow = ""), 2000);
        }
      });
    });

    // Attach click handlers for warnings
    document.querySelectorAll(".warning-item").forEach((li) => {
      li.addEventListener("click", () => {
        const idx = parseInt(li.getAttribute("data-warn-idx"));
        const warn = validationWarnings[idx];
        if (warn && warn.element) {
          const yOffset = -80;
          const y = warn.element.getBoundingClientRect().top + window.scrollY + yOffset;
          window.scrollTo({ top: y, behavior: "smooth" });
          warn.element.style.transition = "box-shadow 0.2s";
          warn.element.style.boxShadow = "0 0 0 3px rgba(234,179,8,0.5)";
          setTimeout(() => (warn.element.style.boxShadow = ""), 2000);
        }
      });
    });
  }

  function clearValidation() {
    validationErrors = [];
    validationWarnings = [];
    document
      .querySelectorAll(".error-inline, .warning-inline")
      .forEach((el) => el.remove());
    updateErrorSummary();
  }

  function addError(fieldId, message, element, section = "General") {
    validationErrors.push({ section, field: fieldId, message, element });
    if (element && !element.parentElement.querySelector(".error-inline")) {
      const errSpan = document.createElement("div");
      errSpan.className = "error-inline text-red-500 text-xs mt-1";
      errSpan.innerText = message;
      element.parentElement.appendChild(errSpan);
    }
  }

  function addWarning(fieldId, message, element, section = "General") {
    validationWarnings.push({ section, field: fieldId, message, element });
    if (element && !element.parentElement.querySelector(".warning-inline")) {
      const warnSpan = document.createElement("div");
      warnSpan.className = "warning-inline text-yellow-600 text-xs mt-1";
      warnSpan.innerText = message;
      element.parentElement.appendChild(warnSpan);
    }
  }

  // ------------------------------ Validation Functions ------------------------------
  function validateTimeSettings() {
    const { dayStart, dayEnd, slotDuration, days } = getCurrentTimeSettings();
    if (!dayStart || !dayEnd) {
      addError(
        "time-settings",
        "Start and end times are required.",
        document.querySelector(".start-hour"),
        "Time Settings",
      );
      return false;
    }
    const startMin = timeToMinutes(dayStart);
    const endMin = timeToMinutes(dayEnd);
    if (endMin <= startMin) {
      addError(
        "time-settings",
        "End time must be after start time.",
        document.querySelector(".end-hour"),
        "Time Settings",
      );
      return false;
    }
    // Removed the multiple-of-slot-duration check per user request.
    if (slotDuration <= 0 || days <= 0) {
      addError(
        "time-settings",
        "Days and slot duration must be positive.",
        document.querySelector('[name="days"]'),
        "Time Settings",
      );
      return false;
    }
    return true;
  }

  function validateRooms() {
    const rooms = [];
    document.querySelectorAll(".room-card").forEach((card) => {
      const name = card.querySelector('[name="room_name[]"]')?.value.trim();
      const year = card.querySelector('[name="room_year[]"]')?.value.trim();
      if (name && year) rooms.push({ name, year, card });
    });
    const yearRooms = new Map();
    rooms.forEach((room) => {
      if (yearRooms.has(room.year)) {
        addWarning(
          "rooms",
          `Year "${room.year}" has multiple rooms. Only the first will be used.`,
          room.card,
          "Rooms",
        );
      } else {
        yearRooms.set(room.year, room.name);
      }
    });
    window.yearsList.forEach((year) => {
      if (!yearRooms.has(year)) {
        addError(
          "rooms",
          `Year "${year}" has no room assigned.`,
          document.getElementById("rooms-container"),
          "Rooms",
        );
      }
    });
  }

  function validateBreaks() {
    const { dayStart, dayEnd, slotDuration } = getCurrentTimeSettings();
    if (!dayStart || !dayEnd) return;
    const startMin = timeToMinutes(dayStart);
    const endMin = timeToMinutes(dayEnd);
    const boundaries = getSlotBoundaries(startMin, slotDuration, endMin);
    const breakCards = document.querySelectorAll(".break-card");
    breakCards.forEach((card) => {
      const year = card.querySelector('[name="break_year[]"]')?.value.trim();
      if (!year) return;
      const items = card.querySelectorAll(".break-item");
      items.forEach((item, idx) => {
        const start = getBreakTime(item, "start");
        const end = getBreakTime(item, "end");
        if (start && end) {
          const startMinVal = timeToMinutes(start);
          const endMinVal = timeToMinutes(end);
          if (!boundaries.includes(startMinVal)) {
            const nearest = getNearestSlotBoundary(startMinVal, boundaries);
            addWarning(
              `break-${year}-${idx}`,
              `Break starts at ${minutesToTime(startMinVal)} which is not a period start. Consider snapping to ${minutesToTime(nearest)}.`,
              item,
              "Breaks",
            );
          }
          if (startMinVal < startMin || endMinVal > endMin) {
            addError(
              `break-${year}-${idx}`,
              `Break outside working hours (${minutesToTime(startMin)} – ${minutesToTime(endMin)}).`,
              item,
              "Breaks",
            );
          }
          if (endMinVal <= startMinVal) {
            addError(
              `break-${year}-${idx}`,
              "End time must be after start time.",
              item,
              "Breaks",
            );
          }
          if (idx < items.length - 1) {
            const nextItem = items[idx + 1];
            const nextStart = getBreakTime(nextItem, "start");
            if (nextStart) {
              const nextStartMin = timeToMinutes(nextStart);
              if (endMinVal > nextStartMin) {
                addError(
                  `break-${year}-${idx}`,
                  `Overlaps with next break starting at ${minutesToTime(nextStartMin)}.`,
                  item,
                  "Breaks",
                );
              }
            }
          }
        }
      });
    });
  }

  function validateBatches() {
    const batchGroups = document.querySelectorAll(".batch-group");
    const seen = new Set();
    batchGroups.forEach((group) => {
      const name = group.querySelector('[name="batch_name[]"]')?.value.trim();
      const year = group.querySelector('[name="batch_year[]"]')?.value;
      if (name && year) {
        const key = `${year}|${name}`;
        if (seen.has(key)) {
          addError(
            "batches",
            `Duplicate batch "${name}" for year "${year}".`,
            group,
            "Years & Batches",
          );
        }
        seen.add(key);
      }
    });
  }

  function validateSubjects() {
    const subjects = document.querySelectorAll(".subject-card");
    subjects.forEach((card, idx) => {
      const name = card.querySelector('[name="subject_name[]"]')?.value.trim();
      const year = card.querySelector('[name="subject_year[]"]')?.value;
      const teacher = card.querySelector('[name="subject_teacher[]"]')?.value;
      const practicals =
        parseInt(card.querySelector('[name="practicals_per_week[]"]')?.value) || 0;
      const lab = card.querySelector('[name="subject_lab[]"]')?.value;
      if (!name) return;
      if (!year)
        addError(
          `subject-${idx}`,
          "Year is required.",
          card.querySelector('[name="subject_year[]"]'),
          "Subjects",
        );
      if (!teacher)
        addError(
          `subject-${idx}`,
          "Teacher is required.",
          card.querySelector('[name="subject_teacher[]"]'),
          "Subjects",
        );
      if (practicals > 0 && !lab) {
        addError(
          `subject-${idx}`,
          "Lab is required for practicals.",
          card.querySelector('[name="subject_lab[]"]'),
          "Subjects",
        );
      }
    });
  }

  // New uniqueness validations
  function validateUniqueYears() {
    const years = Array.from(document.querySelectorAll('[name="year[]"]')).map(i => i.value.trim()).filter(v => v);
    const duplicates = years.filter((item, index) => years.indexOf(item) !== index);
    if (duplicates.length) {
      addError("years", `Duplicate year name(s): ${[...new Set(duplicates)].join(', ')}`, document.getElementById("years-container"), "Years");
    }
  }

  function validateUniqueLabs() {
    const labs = Array.from(document.querySelectorAll('[name="lab[]"]')).map(i => i.value.trim()).filter(v => v);
    const duplicates = labs.filter((item, index) => labs.indexOf(item) !== index);
    if (duplicates.length) {
      addError("labs", `Duplicate lab name(s): ${[...new Set(duplicates)].join(', ')}`, document.getElementById("labs-container"), "Labs");
    }
  }

  function validateUniqueSubjects() {
    const subjects = document.querySelectorAll(".subject-card");
    const seen = new Map();
    subjects.forEach((card) => {
      const name = card.querySelector('[name="subject_name[]"]')?.value.trim();
      const year = card.querySelector('[name="subject_year[]"]')?.value;
      if (name && year) {
        const key = `${year}|${name}`;
        if (seen.has(key)) {
          addError("subjects", `Duplicate subject "${name}" in year "${year}".`, card, "Subjects");
        } else {
          seen.set(key, true);
        }
      }
    });
  }

  function runFullValidation() {
    rebuildGlobalArrays();
    clearValidation();
    validateTimeSettings();
    validateRooms();
    validateBreaks();
    validateBatches();
    validateSubjects();
    validateUniqueYears();
    validateUniqueLabs();
    validateUniqueSubjects();
    updateErrorSummary();
  }

  // ------------------------------ Break Helpers ------------------------------
  function getBreakTime(item, type) {
    const hour = item.querySelector(`.break-${type}-hour`)?.value;
    const minute = item.querySelector(`.break-${type}-minute`)?.value;
    const ampm = item.querySelector(`.break-${type}-ampm`)?.value;
    if (hour && minute && ampm) {
      return format12Hour(hour, minute, ampm);
    }
    return null;
  }

  function getNearestSlotBoundary(minutes, boundaries) {
    let nearest = boundaries[0];
    let minDist = Math.abs(minutes - nearest);
    for (let b of boundaries) {
      const dist = Math.abs(minutes - b);
      if (dist < minDist) {
        minDist = dist;
        nearest = b;
      }
    }
    return nearest;
  }

  function snapBreakToSlot(breakItem) {
    const { dayStart, slotDuration, dayEnd } = getCurrentTimeSettings();
    if (!dayStart || !dayEnd) return;
    const startMin = timeToMinutes(dayStart);
    const endMin = timeToMinutes(dayEnd);
    const boundaries = getSlotBoundaries(startMin, slotDuration, endMin);
    const currentStart = getBreakTime(breakItem, "start");
    if (!currentStart) return;
    const currentStartMin = timeToMinutes(currentStart);
    const nearest = getNearestSlotBoundary(currentStartMin, boundaries);
    const newTime = minutesToTime(nearest);
    const [hour, minute, ampm] = parseTimeComponents(newTime);
    breakItem.querySelector(".break-start-hour").value = hour;
    breakItem.querySelector(".break-start-minute").value = minute;
    breakItem.querySelector(".break-start-ampm").value = ampm;
    runFullValidation();
  }

  // ------------------------------ Card Creation Functions ------------------------------
  function attachBatchHandlers(batchDiv) {
    const removeBtn = batchDiv.querySelector(".remove-batch");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        batchDiv.remove();
        runFullValidation();
        if (window.updateJSONFromForm) window.updateJSONFromForm();
      });
    }
    batchDiv.querySelectorAll("input").forEach((inp) => {
      inp.addEventListener("change", () => {
        runFullValidation();
        if (window.updateJSONFromForm) window.updateJSONFromForm();
      });
    });
  }

  function attachYearHandlers(card) {
    const updateYear = () => {
      rebuildGlobalArrays();
      updateSubjectYearSelects();
      updateRoomYearSelects();
      runFullValidation();
      if (window.updateJSONFromForm) window.updateJSONFromForm();
    };

    const removeBtn = card.querySelector(".remove-year");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        card.remove();
        updateYear();
      });
    }

    const yearInput = card.querySelector('input[name="year[]"]');
    yearInput.addEventListener("input", function (e) {
      const newYear = e.target.value.trim();
      card.querySelectorAll('input[name="batch_year[]"]').forEach((inp) => {
        inp.value = newYear;
      });
      updateYear();
    });

    const addBatchBtn = card.querySelector(".add-batch");
    if (addBatchBtn) {
      addBatchBtn.addEventListener("click", () => {
        const batchContainer = card.querySelector(".batches-container");
        const batchDiv = document.createElement("div");
        batchDiv.className = "batch-group flex gap-2 mb-2";
        const year = card.querySelector('input[name="year[]"]').value;
        batchDiv.innerHTML = `
          <input type="text" name="batch_name[]" placeholder="Batch Name" class="border rounded-lg px-3 py-2 flex-1">
          <input type="text" name="batch_year[]" class="hidden" value="${escapeHtml(year)}">
          <button type="button" class="remove-batch text-red-500">Remove</button>
        `;
        batchContainer.appendChild(batchDiv);
        attachBatchHandlers(batchDiv);
        updateYear();
      });
    }
  }

  function addYearCard() {
    // Check for duplicate year before adding? We'll rely on validation to show errors,
    // but we can also prevent adding if a duplicate is detected immediately.
    const container = document.getElementById("years-container");
    const newCard = document.createElement("div");
    newCard.className = "year-card border rounded-lg p-4 mb-4 bg-slate-50";
    newCard.innerHTML = `
      <div class="flex justify-between items-start">
        <input type="text" name="year[]" placeholder="Year (e.g., FY)" class="w-full border rounded-lg px-3 py-2 mb-3" required>
        <button type="button" class="remove-year text-red-500 ml-2">✕</button>
      </div>
      <div class="batches-container">
        <div class="batch-group flex gap-2 mb-2">
          <input type="text" name="batch_name[]" placeholder="Batch Name" class="border rounded-lg px-3 py-2 flex-1">
          <input type="text" name="batch_year[]" class="hidden">
          <button type="button" class="remove-batch text-red-500">Remove</button>
        </div>
      </div>
      <button type="button" class="add-batch text-blue-600 text-sm mt-2">+ Add Batch</button>
    `;
    container.appendChild(newCard);
    attachYearHandlers(newCard);
    runFullValidation();
  }

  function attachTeacherHandlers(card) {
    const updateTeacher = () => {
      rebuildGlobalArrays();
      updateSubjectTeacherSelects();
      updateTeacherUnavailSelects();   // <-- new
      runFullValidation();
      if (window.updateJSONFromForm) window.updateJSONFromForm();
    };

    const removeBtn = card.querySelector(".remove-teacher");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        card.remove();
        updateTeacher();
      });
    }

    card.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", updateTeacher);
    });

    const enforceCheck = card.querySelector('input[name="enforce_limits[]"]');
    if (enforceCheck) {
      enforceCheck.addEventListener("change", updateTeacher);
    }
  }

  function addTeacherCard() {
    const container = document.getElementById("teachers-container");
    const newCard = document.createElement("div");
    newCard.className = "teacher-card border rounded-lg p-4 mb-4 bg-slate-50";
    newCard.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label class="block text-sm font-medium mb-1">Teacher Name</label><input type="text" name="teacher_name[]" placeholder="e.g., Dr. Smith" class="border rounded-lg px-3 py-2 w-full" required></div>
        <div><label class="block text-sm font-medium mb-1">Max Lectures/Day</label><input type="number" name="max_lectures[]" min="0" value="3" class="border rounded-lg px-3 py-2 w-full"></div>
        <div><label class="block text-sm font-medium mb-1">Max Practicals/Day</label><input type="number" name="max_practicals[]" min="0" value="2" class="border rounded-lg px-3 py-2 w-full"></div>
        <div class="flex items-center gap-2"><input type="checkbox" name="enforce_limits[]" checked><label class="text-sm font-medium">Enforce Limits</label></div>
      </div>
      <button type="button" class="remove-teacher text-red-500 text-sm mt-3">Remove Teacher</button>
    `;
    container.appendChild(newCard);
    attachTeacherHandlers(newCard);
    updateSubjectTeacherSelects();
    updateTeacherUnavailSelects();
    runFullValidation();
  }

  function attachLabHandlers(labDiv) {
    const updateLab = () => {
      rebuildGlobalArrays();
      updateSubjectLabSelects();
      updateLabUnavailSelects();   // <-- new
      runFullValidation();
      if (window.updateJSONFromForm) window.updateJSONFromForm();
    };

    const removeBtn = labDiv.querySelector(".remove-lab");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        labDiv.remove();
        updateLab();
      });
    }

    const input = labDiv.querySelector('input[name="lab[]"]');
    if (input) {
      input.addEventListener("input", updateLab);
    }
  }

  function addLabCard() {
    const container = document.getElementById("labs-container");
    const newLab = document.createElement("div");
    newLab.className = "lab-card flex gap-2 mb-2";
    newLab.innerHTML = `<input type="text" name="lab[]" placeholder="Lab Name" class="border rounded-lg px-3 py-2 flex-1" required><button type="button" class="remove-lab text-red-500">✕</button>`;
    container.appendChild(newLab);
    attachLabHandlers(newLab);
    updateSubjectLabSelects();
    updateLabUnavailSelects();
    runFullValidation();
  }

  function attachRoomHandlers(roomDiv) {
    const updateRoom = () => {
      runFullValidation();
      if (window.updateJSONFromForm) window.updateJSONFromForm();
    };

    const removeBtn = roomDiv.querySelector(".remove-room");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        roomDiv.remove();
        updateRoom();
      });
    }

    roomDiv.querySelectorAll("input, select").forEach((inp) => {
      inp.addEventListener("input", updateRoom);
      inp.addEventListener("change", updateRoom);
    });
  }

  function updateRoomYearSelects() {
    const yearOptions = window.yearsList
      .map((y) => `<option value="${escapeHtml(y)}">${escapeHtml(y)}</option>`)
      .join("");
    document.querySelectorAll('.room-card select[name="room_year[]"]').forEach((sel) => {
      const current = sel.value;
      sel.innerHTML = '<option value="">Select Year</option>' + yearOptions;
      if (current && window.yearsList.includes(current)) sel.value = current;
      else sel.value = "";
    });
  }

  function addRoomCard() {
    const container = document.getElementById("rooms-container");
    const newRoom = document.createElement("div");
    newRoom.className = "room-card flex gap-2 mb-2";
    const yearOptions = window.yearsList
      .map((y) => `<option value="${escapeHtml(y)}">${escapeHtml(y)}</option>`)
      .join("");
    newRoom.innerHTML = `
      <input type="text" name="room_name[]" placeholder="Room Name" class="border rounded-lg px-3 py-2 flex-1" required>
      <select name="room_year[]" class="border rounded-lg px-3 py-2 flex-1" required>
        <option value="">Select Year</option>
        ${yearOptions}
      </select>
      <button type="button" class="remove-room text-red-500">✕</button>
    `;
    container.appendChild(newRoom);
    attachRoomHandlers(newRoom);
    runFullValidation();
  }

  function attachSubjectHandlers(card) {
    const practicalsInput = card.querySelector('[name="practicals_per_week[]"]');
    if (practicalsInput) {
      practicalsInput.addEventListener("input", () => {
        toggleLabSelector(card);
        runFullValidation();
        if (window.updateJSONFromForm) window.updateJSONFromForm();
      });
      toggleLabSelector(card);
    }
    const removeBtn = card.querySelector(".remove-subject");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        card.remove();
        runFullValidation();
        if (window.updateJSONFromForm) window.updateJSONFromForm();
      });
    }
    card.querySelectorAll("input, select").forEach((input) => {
      input.addEventListener("change", () => {
        runFullValidation();
        if (window.updateJSONFromForm) window.updateJSONFromForm();
      });
      input.addEventListener("input", () => {
        runFullValidation();
        if (window.updateJSONFromForm) window.updateJSONFromForm();
      });
    });
    if (!card.querySelector(".clone-subject")) {
      const cloneBtn = document.createElement("button");
      cloneBtn.type = "button";
      cloneBtn.className = "clone-subject text-blue-500 text-xs ml-2";
      cloneBtn.innerText = "Clone";
      cloneBtn.addEventListener("click", () => {
        const newCard = card.cloneNode(true);
        const existingClone = newCard.querySelector(".clone-subject");
        if (existingClone) existingClone.remove();
        card.parentElement.insertBefore(newCard, card.nextSibling);
        attachSubjectHandlers(newCard);
        updateSubjectYearSelects();
        updateSubjectTeacherSelects();
        updateSubjectLabSelects();
        runFullValidation();
        if (window.updateJSONFromForm) window.updateJSONFromForm();
      });
      card.querySelector(".remove-subject").parentElement.appendChild(cloneBtn);
    }
  }

  function addSubjectCard() {
    const container = document.getElementById("subjects-container");
    const newCard = document.createElement("div");
    newCard.className = "subject-card border rounded-lg p-4 mb-4 bg-slate-50";
    newCard.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label class="block text-sm font-medium mb-1">Subject Name</label><input type="text" name="subject_name[]" placeholder="e.g., Mathematics" class="border rounded-lg px-3 py-2 w-full" required></div>
        <div><label class="block text-sm font-medium mb-1">Year</label><select name="subject_year[]" class="border rounded-lg px-3 py-2 w-full" required><option value="">Select Year</option></select></div>
        <div><label class="block text-sm font-medium mb-1">Teacher</label><select name="subject_teacher[]" class="border rounded-lg px-3 py-2 w-full" required><option value="">Select Teacher</option></select></div>
        <div><label class="block text-sm font-medium mb-1">Lectures per Week</label><input type="number" name="lectures_per_week[]" min="0" value="2" class="border rounded-lg px-3 py-2 w-full"></div>
        <input type="hidden" name="lecture_duration[]" value="1">
        <div><label class="block text-sm font-medium mb-1">Practicals per Week</label><input type="number" name="practicals_per_week[]" min="0" value="1" class="border rounded-lg px-3 py-2 w-full"></div>
        <input type="hidden" name="practical_duration[]" value="2">
        <div class="lab-select-container" style="display: none;">
          <label class="block text-sm font-medium mb-1">Lab *</label>
          <select name="subject_lab[]" class="border rounded-lg px-3 py-2 w-full"><option value="">Select Lab</option></select>
        </div>
      </div>
      <button type="button" class="remove-subject text-red-500 text-sm mt-3">Remove Subject</button>
    `;
    container.appendChild(newCard);
    attachSubjectHandlers(newCard);
    updateSubjectYearSelects();
    updateSubjectTeacherSelects();
    updateSubjectLabSelects();
    runFullValidation();
  }

  function attachBreakItemHandlers(item) {
    const removeBtn = item.querySelector(".remove-break-item");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        item.remove();
        runFullValidation();
        if (window.updateJSONFromForm) window.updateJSONFromForm();
      });
    }
    // Add snap button if not present
    if (!item.querySelector(".snap-break-btn")) {
      const snapBtn = document.createElement("button");
      snapBtn.type = "button";
      snapBtn.className = "snap-break-btn text-xs bg-gray-200 px-2 py-1 rounded ml-2";
      snapBtn.innerText = "Snap to slot";
      snapBtn.addEventListener("click", () => snapBreakToSlot(item));
      item.appendChild(snapBtn);
    }
    item.querySelectorAll("input, select").forEach((input) => {
      input.addEventListener("change", () => {
        runFullValidation();
        if (window.updateJSONFromForm) window.updateJSONFromForm();
      });
      input.addEventListener("input", () => {
        runFullValidation();
        if (window.updateJSONFromForm) window.updateJSONFromForm();
      });
    });
  }

  function attachBreakCardHandlers(card) {
    const addBtn = card.querySelector(".add-break-item");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        const breakItems = card.querySelector(".break-items");
        const newItem = document.createElement("div");
        newItem.className = "break-item flex flex-wrap gap-2 mb-2 items-center";
        newItem.innerHTML = `
          <div class="flex gap-1">
            <input type="number" class="break-start-hour w-16 border rounded-lg px-2 py-2" min="1" max="12" placeholder="Hour">
            <input type="number" class="break-start-minute w-16 border rounded-lg px-2 py-2" min="0" max="59" placeholder="Min">
            <select class="break-start-ampm border rounded-lg px-2 py-2"><option value="AM">AM</option><option value="PM">PM</option></select>
          </div>
          <span class="text-slate-400">→</span>
          <div class="flex gap-1">
            <input type="number" class="break-end-hour w-16 border rounded-lg px-2 py-2" min="1" max="12" placeholder="Hour">
            <input type="number" class="break-end-minute w-16 border rounded-lg px-2 py-2" min="0" max="59" placeholder="Min">
            <select class="break-end-ampm border rounded-lg px-2 py-2"><option value="AM">AM</option><option value="PM">PM</option></select>
          </div>
          <button type="button" class="remove-break-item text-red-500">✕</button>
        `;
        breakItems.appendChild(newItem);
        attachBreakItemHandlers(newItem);
        runFullValidation();
        if (window.updateJSONFromForm) window.updateJSONFromForm();
      });
    }
    const removeBtn = card.querySelector(".remove-break");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        card.remove();
        runFullValidation();
        if (window.updateJSONFromForm) window.updateJSONFromForm();
      });
    }
    const yearInput = card.querySelector('input[name="break_year[]"]');
    if (yearInput) {
      yearInput.addEventListener("input", () => {
        runFullValidation();
        if (window.updateJSONFromForm) window.updateJSONFromForm();
      });
    }
    const nameInput = card.querySelector('input[name="break_name[]"]');
    if (nameInput) {
      nameInput.addEventListener("input", () => {
        runFullValidation();
        if (window.updateJSONFromForm) window.updateJSONFromForm();
      });
    }
    card.querySelectorAll(".break-item").forEach(attachBreakItemHandlers);
  }

  function addBreakCard() {
    const container = document.getElementById("breaks-container");
    const newCard = document.createElement("div");
    newCard.className = "break-card border rounded-lg p-4 mb-4 bg-slate-50";
    newCard.innerHTML = `
      <div class="flex gap-2 mb-2">
        <input type="text" name="break_year[]" placeholder="Year" class="border rounded-lg px-3 py-2 flex-1" required>
        <input type="text" name="break_name[]" placeholder="Break Name (e.g., Lunch)" class="border rounded-lg px-3 py-2 flex-1">
        <button type="button" class="remove-break text-red-500">✕</button>
      </div>
      <div class="break-items">
        <div class="break-item flex flex-wrap gap-2 mb-2 items-center">
          <div class="flex gap-1">
            <input type="number" class="break-start-hour w-16 border rounded-lg px-2 py-2" min="1" max="12" placeholder="Hour">
            <input type="number" class="break-start-minute w-16 border rounded-lg px-2 py-2" min="0" max="59" placeholder="Min">
            <select class="break-start-ampm border rounded-lg px-2 py-2"><option value="AM">AM</option><option value="PM">PM</option></select>
          </div>
          <span class="text-slate-400">→</span>
          <div class="flex gap-1">
            <input type="number" class="break-end-hour w-16 border rounded-lg px-2 py-2" min="1" max="12" placeholder="Hour">
            <input type="number" class="break-end-minute w-16 border rounded-lg px-2 py-2" min="0" max="59" placeholder="Min">
            <select class="break-end-ampm border rounded-lg px-2 py-2"><option value="AM">AM</option><option value="PM">PM</option></select>
          </div>
          <button type="button" class="remove-break-item text-red-500">✕</button>
        </div>
      </div>
      <button type="button" class="add-break-item text-blue-600 text-sm mt-2">+ Add Break</button>
    `;
    container.appendChild(newCard);
    attachBreakCardHandlers(newCard);
    const firstItem = newCard.querySelector(".break-item");
    if (firstItem) attachBreakItemHandlers(firstItem);
    runFullValidation();
  }

  // ------------------------------ Teacher Unavailability with Dropdown ------------------------------
  function updateTeacherUnavailSelects() {
    const teacherOptions = window.teachersList
      .map((t) => `<option value="${escapeHtml(t.name)}">${escapeHtml(t.name)}</option>`)
      .join("");
    document.querySelectorAll('.teacher-unavail-card select[name="unavail_teacher[]"]').forEach((sel) => {
      const current = sel.value;
      sel.innerHTML = '<option value="">Select Teacher</option>' + teacherOptions;
      if (current && window.teachersList.some(t => t.name === current)) sel.value = current;
      else sel.value = "";
    });
  }

  function attachTeacherUnavailHandlers(item) {
    const removeBtn = item.querySelector(".remove-teacher-unavail");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        item.remove();
        runFullValidation();
        if (window.updateJSONFromForm) window.updateJSONFromForm();
      });
    }
    item.querySelectorAll("input, select").forEach((input) => {
      input.addEventListener("change", () => {
        runFullValidation();
        if (window.updateJSONFromForm) window.updateJSONFromForm();
      });
      input.addEventListener("input", () => {
        runFullValidation();
        if (window.updateJSONFromForm) window.updateJSONFromForm();
      });
    });
  }

  function addTeacherUnavailCard() {
    const container = document.getElementById("teacher-unavail-container");
    const daysCount = parseInt(document.querySelector('[name="days"]').value) || 5;
    const dayOptions = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      .slice(0, daysCount)
      .map((d, idx) => `<option value="${idx}">${d}</option>`)
      .join("");
    const teacherOptions = window.teachersList
      .map((t) => `<option value="${escapeHtml(t.name)}">${escapeHtml(t.name)}</option>`)
      .join("");
    const newItem = document.createElement("div");
    newItem.className = "teacher-unavail-card flex flex-wrap gap-3 mb-3 items-center";
    newItem.innerHTML = `
      <select name="unavail_teacher[]" class="border rounded-lg px-3 py-2 w-40" required>
        <option value="">Select Teacher</option>
        ${teacherOptions}
      </select>
      <select name="unavail_day[]" class="border rounded-lg px-3 py-2 w-24">${dayOptions}</select>
      <div class="flex gap-2">
        <input type="number" class="unavail-start-hour w-20 border rounded-lg px-2 py-2" min="1" max="12" placeholder="Hour">
        <input type="number" class="unavail-start-minute w-20 border rounded-lg px-2 py-2" min="0" max="59" placeholder="Min">
        <select class="unavail-start-ampm border rounded-lg px-2 py-2"><option value="AM">AM</option><option value="PM">PM</option></select>
      </div>
      <div class="flex gap-2">
        <input type="number" class="unavail-end-hour w-20 border rounded-lg px-2 py-2" min="1" max="12" placeholder="Hour">
        <input type="number" class="unavail-end-minute w-20 border rounded-lg px-2 py-2" min="0" max="59" placeholder="Min">
        <select class="unavail-end-ampm border rounded-lg px-2 py-2"><option value="AM">AM</option><option value="PM">PM</option></select>
      </div>
      <button type="button" class="remove-teacher-unavail text-red-500">✕</button>
    `;
    container.appendChild(newItem);
    attachTeacherUnavailHandlers(newItem);
    runFullValidation();
  }

  // ------------------------------ Lab Unavailability with Dropdown ------------------------------
  function updateLabUnavailSelects() {
    const labOptions = window.labsList
      .map((l) => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`)
      .join("");
    document.querySelectorAll('.lab-unavail-card select[name="unavail_lab[]"]').forEach((sel) => {
      const current = sel.value;
      sel.innerHTML = '<option value="">Select Lab</option>' + labOptions;
      if (current && window.labsList.includes(current)) sel.value = current;
      else sel.value = "";
    });
  }

  function attachLabUnavailHandlers(item) {
    const removeBtn = item.querySelector(".remove-lab-unavail");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        item.remove();
        runFullValidation();
        if (window.updateJSONFromForm) window.updateJSONFromForm();
      });
    }
    item.querySelectorAll("input, select").forEach((input) => {
      input.addEventListener("change", () => {
        runFullValidation();
        if (window.updateJSONFromForm) window.updateJSONFromForm();
      });
      input.addEventListener("input", () => {
        runFullValidation();
        if (window.updateJSONFromForm) window.updateJSONFromForm();
      });
    });
  }

  function addLabUnavailCard() {
    const container = document.getElementById("lab-unavail-container");
    const daysCount = parseInt(document.querySelector('[name="days"]').value) || 5;
    const dayOptions = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      .slice(0, daysCount)
      .map((d, idx) => `<option value="${idx}">${d}</option>`)
      .join("");
    const labOptions = window.labsList
      .map((l) => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`)
      .join("");
    const newItem = document.createElement("div");
    newItem.className = "lab-unavail-card flex flex-wrap gap-3 mb-3 items-center";
    newItem.innerHTML = `
      <select name="unavail_lab[]" class="border rounded-lg px-3 py-2 w-40" required>
        <option value="">Select Lab</option>
        ${labOptions}
      </select>
      <select name="unavail_lab_day[]" class="border rounded-lg px-3 py-2 w-24">${dayOptions}</select>
      <div class="flex gap-2">
        <input type="number" class="unavail-lab-start-hour w-20 border rounded-lg px-2 py-2" min="1" max="12" placeholder="Hour">
        <input type="number" class="unavail-lab-start-minute w-20 border rounded-lg px-2 py-2" min="0" max="59" placeholder="Min">
        <select class="unavail-lab-start-ampm border rounded-lg px-2 py-2"><option value="AM">AM</option><option value="PM">PM</option></select>
      </div>
      <div class="flex gap-2">
        <input type="number" class="unavail-lab-end-hour w-20 border rounded-lg px-2 py-2" min="1" max="12" placeholder="Hour">
        <input type="number" class="unavail-lab-end-minute w-20 border rounded-lg px-2 py-2" min="0" max="59" placeholder="Min">
        <select class="unavail-lab-end-ampm border rounded-lg px-2 py-2"><option value="AM">AM</option><option value="PM">PM</option></select>
      </div>
      <button type="button" class="remove-lab-unavail text-red-500">✕</button>
    `;
    container.appendChild(newItem);
    attachLabUnavailHandlers(newItem);
    runFullValidation();
  }

  // ------------------------------ Dropdown Update Functions ------------------------------
  function updateSubjectTeacherSelects() {
    const teacherOptions = window.teachersList
      .map((t) => `<option value="${escapeHtml(t.name)}">${escapeHtml(t.name)}</option>`)
      .join("");
    document
      .querySelectorAll('.subject-card select[name="subject_teacher[]"]')
      .forEach((sel) => {
        const current = sel.value;
        sel.innerHTML = '<option value="">Select Teacher</option>' + teacherOptions;
        if (current && window.teachersList.some((t) => t.name === current))
          sel.value = current;
        else sel.value = "";
      });
  }

  function updateSubjectYearSelects() {
    const yearOptions = window.yearsList
      .map((y) => `<option value="${escapeHtml(y)}">${escapeHtml(y)}</option>`)
      .join("");
    document
      .querySelectorAll('.subject-card select[name="subject_year[]"]')
      .forEach((sel) => {
        const current = sel.value;
        sel.innerHTML = '<option value="">Select Year</option>' + yearOptions;
        if (current && window.yearsList.includes(current)) sel.value = current;
        else sel.value = "";
      });
  }

  function updateSubjectLabSelects() {
    const labOptions = window.labsList
      .map((l) => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`)
      .join("");
    document
      .querySelectorAll('.subject-card select[name="subject_lab[]"]')
      .forEach((sel) => {
        const current = sel.value;
        sel.innerHTML = '<option value="">Select Lab</option>' + labOptions;
        if (current && window.labsList.includes(current)) sel.value = current;
        else sel.value = "";
      });
  }

  function toggleLabSelector(card) {
    const practicals = card.querySelector('[name="practicals_per_week[]"]');
    const labContainer = card.querySelector(".lab-select-container");
    if (labContainer) {
      const show = practicals && parseInt(practicals.value) > 0;
      labContainer.style.display = show ? "block" : "none";
      const labSelect = labContainer.querySelector("select");
      if (labSelect) {
        if (show) labSelect.setAttribute("required", "required");
        else labSelect.removeAttribute("required");
      }
    }
  }

  // ------------------------------ Form Data Builder ------------------------------
  function buildFormData() {
    const days = parseInt(document.querySelector('[name="days"]').value);
    const slotDuration = parseInt(document.querySelector('[name="slot_duration"]').value);
    const day_start = format12Hour(
      document.querySelector(".start-hour").value,
      document.querySelector(".start-minute").value,
      document.querySelector(".start-ampm").value,
    );
    const day_end = format12Hour(
      document.querySelector(".end-hour").value,
      document.querySelector(".end-minute").value,
      document.querySelector(".end-ampm").value,
    );
    if (!day_start || !day_end) throw new Error("Invalid start or end time");

    const startMin = timeToMinutes(day_start);
    const endMin = timeToMinutes(day_end);
    const totalMinutes = endMin - startMin;
    const slots_per_day = totalMinutes / slotDuration;

    const time_settings = {
      days,
      slots_per_day,
      slot_duration_minutes: slotDuration,
      day_start,
      day_end,
    };

    const formData = {
      time_settings,
      years: [],
      batches: [],
      subjects: [],
      teachers: window.teachersList,
      rooms: [],
      labs: window.labsList,
      breaks: {},
      teacher_unavailability: [],
      lab_unavailability: [],
    };

    document.querySelectorAll('[name="year[]"]').forEach((y) => {
      let v = y.value.trim();
      if (v) formData.years.push(v);
    });
    const batchNames = document.querySelectorAll('[name="batch_name[]"]'),
      batchYears = document.querySelectorAll('[name="batch_year[]"]');
    for (let i = 0; i < batchNames.length; i++)
      if (batchNames[i].value.trim())
        formData.batches.push({
          name: batchNames[i].value.trim(),
          year: batchYears[i].value.trim(),
        });
    const subjNames = document.querySelectorAll('[name="subject_name[]"]'),
      subjYears = document.querySelectorAll('select[name="subject_year[]"]'),
      subjTeachers = document.querySelectorAll('select[name="subject_teacher[]"]');
    const lecWeeks = document.querySelectorAll('[name="lectures_per_week[]"]'),
      lecDurs = document.querySelectorAll('[name="lecture_duration[]"]');
    const pracWeeks = document.querySelectorAll('[name="practicals_per_week[]"]'),
      pracDurs = document.querySelectorAll('[name="practical_duration[]"]'),
      subjLabs = document.querySelectorAll('select[name="subject_lab[]"]');
    for (let i = 0; i < subjNames.length; i++) {
      if (subjNames[i].value.trim()) {
        const year = subjYears[i].value,
          teacher = subjTeachers[i].value;
        if (!year || !teacher) continue;
        const practicals = parseInt(pracWeeks[i].value) || 0;
        const subj = {
          name: subjNames[i].value.trim(),
          year,
          teacher,
          lectures_per_week: parseInt(lecWeeks[i].value) || 0,
          lecture_duration_slots: parseInt(lecDurs[i].value) || 1,
          practicals_per_week: practicals,
          practical_duration_slots: parseInt(pracDurs[i].value) || 2,
        };
        if (practicals > 0) {
          const labValue = subjLabs[i]?.value;
          if (labValue) subj.lab = labValue;
        }
        formData.subjects.push(subj);
      }
    }
    const roomNames = document.querySelectorAll('[name="room_name[]"]'),
      roomYears = document.querySelectorAll('[name="room_year[]"]');
    for (let i = 0; i < roomNames.length; i++)
      if (roomNames[i].value.trim() && roomYears[i].value.trim())
        formData.rooms.push({
          name: roomNames[i].value.trim(),
          year: roomYears[i].value.trim(),
        });
    const breakCards = document.querySelectorAll(".break-card");
    breakCards.forEach((card) => {
      const year = card.querySelector('[name="break_year[]"]')?.value.trim();
      const breakName = card.querySelector('[name="break_name[]"]')?.value.trim() || "";
      if (!year) return;
      const breaksForYear = [];
      card.querySelectorAll(".break-item").forEach((item) => {
        const start = getBreakTime(item, "start");
        const end = getBreakTime(item, "end");
        if (start && end) breaksForYear.push({ name: breakName, start, end });
      });
      if (breaksForYear.length) {
        if (!formData.breaks[year]) formData.breaks[year] = [];
        formData.breaks[year].push(...breaksForYear);
      }
    });
    // Teacher unavailability
    const unavailTeachers = document.querySelectorAll('[name="unavail_teacher[]"]'),
      unavailDays = document.querySelectorAll('[name="unavail_day[]"]');
    const unavailStartHours = document.querySelectorAll(".unavail-start-hour"),
      unavailStartMinutes = document.querySelectorAll(".unavail-start-minute"),
      unavailStartAmPms = document.querySelectorAll(".unavail-start-ampm");
    const unavailEndHours = document.querySelectorAll(".unavail-end-hour"),
      unavailEndMinutes = document.querySelectorAll(".unavail-end-minute"),
      unavailEndAmPms = document.querySelectorAll(".unavail-end-ampm");
    for (let i = 0; i < unavailTeachers.length; i++) {
      if (
        unavailTeachers[i].value &&
        unavailStartHours[i].value &&
        unavailEndHours[i].value
      ) {
        const startTime = format12Hour(
          unavailStartHours[i].value,
          unavailStartMinutes[i].value,
          unavailStartAmPms[i].value,
        );
        const endTime = format12Hour(
          unavailEndHours[i].value,
          unavailEndMinutes[i].value,
          unavailEndAmPms[i].value,
        );
        if (startTime && endTime) {
          formData.teacher_unavailability.push({
            teacher: unavailTeachers[i].value.trim(),
            day: parseInt(unavailDays[i].value),
            start: startTime,
            end: endTime,
          });
        }
      }
    }
    // Lab unavailability
    const unavailLabs = document.querySelectorAll('[name="unavail_lab[]"]'),
      unavailLabDays = document.querySelectorAll('[name="unavail_lab_day[]"]');
    const unavailLabStartHours = document.querySelectorAll(".unavail-lab-start-hour"),
      unavailLabStartMinutes = document.querySelectorAll(".unavail-lab-start-minute"),
      unavailLabStartAmPms = document.querySelectorAll(".unavail-lab-start-ampm");
    const unavailLabEndHours = document.querySelectorAll(".unavail-lab-end-hour"),
      unavailLabEndMinutes = document.querySelectorAll(".unavail-lab-end-minute"),
      unavailLabEndAmPms = document.querySelectorAll(".unavail-lab-end-ampm");
    for (let i = 0; i < unavailLabs.length; i++) {
      if (
        unavailLabs[i].value &&
        unavailLabStartHours[i].value &&
        unavailLabEndHours[i].value
      ) {
        const startTime = format12Hour(
          unavailLabStartHours[i].value,
          unavailLabStartMinutes[i].value,
          unavailLabStartAmPms[i].value,
        );
        const endTime = format12Hour(
          unavailLabEndHours[i].value,
          unavailLabEndMinutes[i].value,
          unavailLabEndAmPms[i].value,
        );
        if (startTime && endTime) {
          formData.lab_unavailability.push({
            lab: unavailLabs[i].value.trim(),
            day: parseInt(unavailLabDays[i].value),
            start: startTime,
            end: endTime,
          });
        }
      }
    }
    return formData;
  }

  // ------------------------------ Populate Functions ------------------------------
  function populateYearsBatches(years, batches) {
    clearContainer("years-container");
    years.forEach((year) => {
      addYearCard();
      const card = document.querySelector("#years-container .year-card:last-child");
      card.querySelector('input[name="year[]"]').value = year;
      card.querySelector('input[name="year[]"]').dispatchEvent(new Event("input"));
      const yearBatches = batches.filter((b) => b.year === year);
      if (yearBatches.length) {
        const bc = card.querySelector(".batches-container");
        bc.innerHTML = "";
        yearBatches.forEach((batch) => {
          const div = document.createElement("div");
          div.className = "batch-group flex gap-2 mb-2";
          div.innerHTML = `<input type="text" name="batch_name[]" placeholder="Batch Name" class="border rounded-lg px-3 py-2 flex-1" value="${escapeHtml(batch.name)}"><input type="text" name="batch_year[]" class="hidden" value="${year}"><button type="button" class="remove-batch text-red-500">Remove</button>`;
          bc.appendChild(div);
          attachBatchHandlers(div);
        });
      }
    });
    updateSubjectYearSelects();
    updateRoomYearSelects();
  }

  function populateTeachers(teachers) {
    clearContainer("teachers-container");
    teachers.forEach((teacher) => {
      addTeacherCard();
      const card = document.querySelector("#teachers-container .teacher-card:last-child");
      card.querySelector('input[name="teacher_name[]"]').value = teacher.name;
      card.querySelector('input[name="max_lectures[]"]').value = teacher.max_lectures_per_day || 3;
      card.querySelector('input[name="max_practicals[]"]').value = teacher.max_practicals_per_day || 2;
      card.querySelector('input[name="enforce_limits[]"]').checked =
        teacher.enforce_limits !== undefined ? teacher.enforce_limits : true;
      card.querySelector('input[name="teacher_name[]"]').dispatchEvent(new Event("input"));
    });
    updateSubjectTeacherSelects();
    updateTeacherUnavailSelects();
  }

  function populateLabs(labs) {
    clearContainer("labs-container");
    labs.forEach((lab) => {
      addLabCard();
      const card = document.querySelector("#labs-container .lab-card:last-child");
      card.querySelector('input[name="lab[]"]').value = lab;
      card.querySelector('input[name="lab[]"]').dispatchEvent(new Event("input"));
    });
    updateSubjectLabSelects();
    updateLabUnavailSelects();
  }

  function populateRooms(rooms) {
    clearContainer("rooms-container");
    rooms.forEach((room) => {
      addRoomCard();
      const card = document.querySelector("#rooms-container .room-card:last-child");
      card.querySelector('input[name="room_name[]"]').value = room.name;
      const yearSelect = card.querySelector('select[name="room_year[]"]');
      if (yearSelect) yearSelect.value = room.year;
    });
  }

  function populateSubjects(subjects) {
    clearContainer("subjects-container");
    subjects.forEach((subject) => {
      addSubjectCard();
      const card = document.querySelector("#subjects-container .subject-card:last-child");
      card.querySelector('input[name="subject_name[]"]').value = subject.name;
      card.querySelector('select[name="subject_year[]"]').value = subject.year;
      card.querySelector('select[name="subject_teacher[]"]').value = subject.teacher;
      card.querySelector('input[name="lectures_per_week[]"]').value = subject.lectures_per_week;
      card.querySelector('input[name="lecture_duration[]"]').value = subject.lecture_duration_slots || 1;
      card.querySelector('input[name="practicals_per_week[]"]').value = subject.practicals_per_week;
      card.querySelector('input[name="practical_duration[]"]').value = subject.practical_duration_slots || 2;
      if (subject.lab) card.querySelector('select[name="subject_lab[]"]').value = subject.lab;
      const practicalsInput = card.querySelector('[name="practicals_per_week[]"]');
      if (practicalsInput) practicalsInput.dispatchEvent(new Event("input"));
    });
    updateSubjectYearSelects();
    updateSubjectTeacherSelects();
    updateSubjectLabSelects();
  }

  function populateBreaks(breaksObj) {
    clearContainer("breaks-container");
    for (const [year, breaksList] of Object.entries(breaksObj)) {
      addBreakCard();
      const card = document.querySelector("#breaks-container .break-card:last-child");
      card.querySelector('input[name="break_year[]"]').value = year;
      const breakName = breaksList[0]?.name || "";
      const nameInput = card.querySelector('input[name="break_name[]"]');
      if (nameInput) nameInput.value = breakName;
      const itemsContainer = card.querySelector(".break-items");
      itemsContainer.innerHTML = "";
      breaksList.forEach((br) => {
        const div = document.createElement("div");
        div.className = "break-item flex flex-wrap gap-2 mb-2 items-center";
        div.innerHTML = `
          <div class="flex gap-1">
            <input type="number" class="break-start-hour w-16 border rounded-lg px-2 py-2" min="1" max="12" placeholder="Hour">
            <input type="number" class="break-start-minute w-16 border rounded-lg px-2 py-2" min="0" max="59" placeholder="Min">
            <select class="break-start-ampm border rounded-lg px-2 py-2"><option value="AM">AM</option><option value="PM">PM</option></select>
          </div>
          <span class="text-slate-400">→</span>
          <div class="flex gap-1">
            <input type="number" class="break-end-hour w-16 border rounded-lg px-2 py-2" min="1" max="12" placeholder="Hour">
            <input type="number" class="break-end-minute w-16 border rounded-lg px-2 py-2" min="0" max="59" placeholder="Min">
            <select class="break-end-ampm border rounded-lg px-2 py-2"><option value="AM">AM</option><option value="PM">PM</option></select>
          </div>
          <button type="button" class="remove-break-item text-red-500">✕</button>
        `;
        itemsContainer.appendChild(div);
        attachBreakItemHandlers(div);
        const [startHour, startMinute, startAmpm] = parseTimeComponents(br.start);
        const [endHour, endMinute, endAmpm] = parseTimeComponents(br.end);
        div.querySelector(".break-start-hour").value = startHour;
        div.querySelector(".break-start-minute").value = startMinute;
        div.querySelector(".break-start-ampm").value = startAmpm;
        div.querySelector(".break-end-hour").value = endHour;
        div.querySelector(".break-end-minute").value = endMinute;
        div.querySelector(".break-end-ampm").value = endAmpm;
      });
    }
  }

  function parseTimeComponents(timeStr) {
    const [time, ampm] = timeStr.split(" ");
    let [hour, minute] = time.split(":");
    hour = parseInt(hour);
    minute = parseInt(minute);
    return [hour, minute, ampm];
  }

  function populateTeacherUnavailability(unavail) {
    clearContainer("teacher-unavail-container");
    unavail.forEach((item) => {
      addTeacherUnavailCard();
      const card = document.querySelector("#teacher-unavail-container .teacher-unavail-card:last-child");
      card.querySelector('select[name="unavail_teacher[]"]').value = item.teacher;
      card.querySelector('select[name="unavail_day[]"]').value = item.day;
      const [sh, sm, sa] = parseTimeComponents(item.start);
      const [eh, em, ea] = parseTimeComponents(item.end);
      card.querySelector(".unavail-start-hour").value = sh;
      card.querySelector(".unavail-start-minute").value = sm;
      card.querySelector(".unavail-start-ampm").value = sa;
      card.querySelector(".unavail-end-hour").value = eh;
      card.querySelector(".unavail-end-minute").value = em;
      card.querySelector(".unavail-end-ampm").value = ea;
    });
  }

  function populateLabUnavailability(unavail) {
    clearContainer("lab-unavail-container");
    unavail.forEach((item) => {
      addLabUnavailCard();
      const card = document.querySelector("#lab-unavail-container .lab-unavail-card:last-child");
      card.querySelector('select[name="unavail_lab[]"]').value = item.lab;
      card.querySelector('select[name="unavail_lab_day[]"]').value = item.day;
      const [sh, sm, sa] = parseTimeComponents(item.start);
      const [eh, em, ea] = parseTimeComponents(item.end);
      card.querySelector(".unavail-lab-start-hour").value = sh;
      card.querySelector(".unavail-lab-start-minute").value = sm;
      card.querySelector(".unavail-lab-start-ampm").value = sa;
      card.querySelector(".unavail-lab-end-hour").value = eh;
      card.querySelector(".unavail-lab-end-minute").value = em;
      card.querySelector(".unavail-lab-end-ampm").value = ea;
    });
  }

  function clearContainer(id) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = "";
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, (m) => (m === "&" ? "&amp;" : m === "<" ? "&lt;" : "&gt;"));
  }

  // ------------------------------ Two‑way Sync & Draft ------------------------------
  let syncing = false;
  let debounceTimeout;

  function updateJSONFromForm() {
    if (syncing) return;
    try {
      const formData = buildFormData();
      const fullData = {
        name: document.querySelector('[name="name"]').value,
        description: document.querySelector('[name="description"]').value,
        ...formData,
      };
      const jsonInput = document.getElementById("json-input");
      if (jsonInput) jsonInput.value = JSON.stringify(fullData, null, 2);
    } catch (err) {
      console.warn("Form incomplete:", err);
    }
  }

  function updateFormFromJSON() {
    if (syncing) return;
    syncing = true;
    try {
      const jsonInput = document.getElementById("json-input");
      const json = JSON.parse(jsonInput.value);
      clearContainer("years-container");
      clearContainer("teachers-container");
      clearContainer("labs-container");
      clearContainer("rooms-container");
      clearContainer("subjects-container");
      clearContainer("breaks-container");
      clearContainer("teacher-unavail-container");
      clearContainer("lab-unavail-container");

      if (json.time_settings) {
        document.querySelector('[name="days"]').value = json.time_settings.days;
        const slotDur = json.time_settings.slot_duration_minutes || json.time_settings.slot_duration || 60;
        document.querySelector('[name="slot_duration"]').value = slotDur;
        const [sh, sm, sa] = parseTimeComponents(json.time_settings.day_start);
        const [eh, em, ea] = parseTimeComponents(json.time_settings.day_end);
        document.querySelector(".start-hour").value = sh;
        document.querySelector(".start-minute").value = sm;
        document.querySelector(".start-ampm").value = sa;
        document.querySelector(".end-hour").value = eh;
        document.querySelector(".end-minute").value = em;
        document.querySelector(".end-ampm").value = ea;
      }

      populateYearsBatches(json.years, json.batches);
      populateTeachers(json.teachers);
      populateLabs(json.labs);
      populateRooms(json.rooms);
      populateSubjects(json.subjects);
      populateBreaks(json.breaks || {});
      populateTeacherUnavailability(json.teacher_unavailability || []);
      populateLabUnavailability(json.lab_unavailability || []);

      document.querySelector('[name="name"]').value = json.name || "";
      document.querySelector('[name="description"]').value = json.description || "";
      rebuildGlobalArrays();
      runFullValidation();
    } catch (err) {
      showError("Invalid JSON: " + err.message);
    } finally {
      syncing = false;
    }
  }

  let saveTimeout;
  function autoSaveDraft() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      try {
        const formData = buildFormData();
        const fullData = {
          name: document.querySelector('[name="name"]').value,
          description: document.querySelector('[name="description"]').value,
          ...formData,
        };
        localStorage.setItem("timetable_draft", JSON.stringify(fullData));
        console.log("Draft auto-saved");
      } catch (err) {
        console.warn("Auto-save failed", err);
      }
    }, 2000);
  }

  function saveDraft() {
    try {
      const formData = buildFormData();
      const fullData = {
        name: document.querySelector('[name="name"]').value,
        description: document.querySelector('[name="description"]').value,
        ...formData,
      };
      localStorage.setItem("timetable_draft", JSON.stringify(fullData));
      showSuccess("Draft saved!");
    } catch (err) {
      showError("Cannot save draft: " + err.message);
    }
  }

  function clearDraft() {
    localStorage.removeItem("timetable_draft");
    showSuccess("Draft cleared.");
  }

  function loadDraftIfExists() {
    const draft = localStorage.getItem("timetable_draft");
    if (draft) {
      try {
        const draftData = JSON.parse(draft);
        const jsonInput = document.getElementById("json-input");
        if (jsonInput) {
          jsonInput.value = JSON.stringify(draftData, null, 2);
          updateFormFromJSON();
          showSuccess("Draft loaded automatically.");
        }
      } catch (err) {
        console.error("Invalid draft", err);
      }
    }
  }

  function showError(msg) {
    const errDiv = document.getElementById("error");
    errDiv.innerHTML = `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg><span class="font-bold">${msg}</span>`;
    errDiv.classList.remove("hidden");
  }

  function showSuccess(msg) {
    const successDiv = document.getElementById("success");
    if (successDiv) {
      successDiv.innerHTML = msg;
      successDiv.classList.remove("hidden");
      setTimeout(() => successDiv.classList.add("hidden"), 3000);
    } else {
      alert(msg);
    }
  }

  // ------------------------------ Initialisation ------------------------------
  window.updateJSONFromForm = updateJSONFromForm;
  window.updateFormFromJSON = updateFormFromJSON;
  window.buildFormData = buildFormData;

  const formContainer = document.getElementById("form-container");
  const jsonContainer = document.getElementById("json-container");
  const jsonInput = document.getElementById("json-input");
  const radioForm = document.querySelector('input[value="form"]');
  const radioJson = document.querySelector('input[value="json"]');

  function toggleInputMode() {
    if (radioForm.checked) {
      formContainer.classList.remove("hidden");
      jsonContainer.classList.add("hidden");
    } else {
      formContainer.classList.add("hidden");
      jsonContainer.classList.remove("hidden");
    }
  }
  radioForm.addEventListener("change", toggleInputMode);
  radioJson.addEventListener("change", toggleInputMode);
  toggleInputMode();

  document.getElementById("copy-to-json").addEventListener("click", () => {
    try {
      const formData = buildFormData();
      const fullData = {
        name: document.querySelector('[name="name"]').value,
        description: document.querySelector('[name="description"]').value,
        ...formData,
      };
      jsonInput.value = JSON.stringify(fullData, null, 2);
      radioJson.checked = true;
      toggleInputMode();
    } catch (err) {
      showError("Cannot copy to JSON: " + err.message);
    }
  });

  const sampleJSON = {
    time_settings: {
      days: 5,
      slots_per_day: 8,
      slot_duration_minutes: 60,
      day_start: "9:00 AM",
      day_end: "5:00 PM",
    },
    years: ["Year1", "Year2"],
    batches: [
      { name: "A", year: "Year1" },
      { name: "B", year: "Year1" },
      { name: "A", year: "Year2" },
      { name: "B", year: "Year2" },
    ],
    rooms: [
      { name: "Room 101", year: "Year1" },
      { name: "Room 102", year: "Year2" },
    ],
    labs: ["Lab1", "Lab2", "Lab3", "Lab4", "Lab5"],
    teachers: [
      {
        name: "Dr. Adams",
        max_lectures_per_day: 3,
        max_practicals_per_day: 2,
        enforce_limits: true,
      },
      {
        name: "Prof. Baker",
        max_lectures_per_day: 3,
        max_practicals_per_day: 2,
        enforce_limits: true,
      },
    ],
    subjects: [
      {
        name: "Programming",
        year: "Year1",
        teacher: "Dr. Adams",
        lectures_per_week: 2,
        lecture_duration_slots: 1,
        practicals_per_week: 2,
        practical_duration_slots: 2,
        lab: "Lab1",
      },
    ],
    breaks: { Year1: [{ name: "Lunch", start: "12:00 PM", end: "12:45 PM" }] },
    teacher_unavailability: [],
    lab_unavailability: [],
  };
  document.getElementById("load-sample-json").addEventListener("click", () => {
    // Do not switch mode, just update JSON and sync form.
    jsonInput.value = JSON.stringify(sampleJSON, null, 2);
    updateFormFromJSON();
  });

  // Auto-save on any change
  document.addEventListener("change", (e) => {
    if (syncing) return;
    if (formContainer.contains(e.target) || e.target.closest("#form-container")) {
      updateJSONFromForm();
      autoSaveDraft();
      runFullValidation();
    }
  });
  document.addEventListener("input", (e) => {
    if (syncing) return;
    if (formContainer.contains(e.target) || e.target.closest("#form-container")) {
      updateJSONFromForm();
      autoSaveDraft();
      runFullValidation();
    }
  });
  jsonInput.addEventListener("input", () => {
    if (syncing) return;
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      updateFormFromJSON();
    }, 500);
  });

  window.addEventListener("beforeunload", () => {
    autoSaveDraft();
  });

  document.getElementById("save-draft-btn").addEventListener("click", saveDraft);
  document.getElementById("clear-draft-btn").addEventListener("click", clearDraft);

  document.getElementById("reset-form-btn").addEventListener("click", () => {
    if (confirm("This will clear all current data. Are you sure?")) {
      clearContainer("years-container");
      clearContainer("teachers-container");
      clearContainer("labs-container");
      clearContainer("rooms-container");
      clearContainer("subjects-container");
      clearContainer("breaks-container");
      clearContainer("teacher-unavail-container");
      clearContainer("lab-unavail-container");
      document.querySelector('[name="name"]').value = "";
      document.querySelector('[name="description"]').value = "";
      document.querySelector('[name="days"]').value = "5";
      document.querySelector('[name="slot_duration"]').value = "60";
      document.querySelector(".start-hour").value = "9";
      document.querySelector(".start-minute").value = "0";
      document.querySelector(".start-ampm").value = "AM";
      document.querySelector(".end-hour").value = "5";
      document.querySelector(".end-minute").value = "0";
      document.querySelector(".end-ampm").value = "PM";
      window.yearsList = [];
      window.teachersList = [];
      window.labsList = [];
      // No default cards added.
      updateJSONFromForm();
      runFullValidation();
      showSuccess("Form reset.");
    }
  });

  document.getElementById("preview-btn").addEventListener("click", () => {
    if (radioJson.checked) {
      try {
        console.log(JSON.parse(jsonInput.value));
        alert("JSON is valid. Check console.");
      } catch (e) {
        alert("Invalid JSON: " + e.message);
      }
    } else {
      try {
        const formData = buildFormData();
        console.log(JSON.stringify(formData, null, 2));
        alert("Preview saved to console (F12).");
      } catch (err) {
        showError(err.message);
      }
    }
  });

  document.getElementById("timetable-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    showError("");
    let inputJson;
    if (radioJson.checked) {
      try {
        inputJson = JSON.parse(jsonInput.value);
        if (!inputJson.years || !inputJson.rooms || !inputJson.teachers || !inputJson.subjects)
          throw new Error("Missing required fields");
      } catch (err) {
        showError("Invalid JSON: " + err.message);
        return;
      }
    } else {
      try {
        inputJson = buildFormData();
        if (!inputJson.years.length) throw new Error("At least one year is required");
        if (!inputJson.rooms.length) throw new Error("At least one room is required");
        if (!inputJson.teachers.length) throw new Error("At least one teacher is required");
        if (!inputJson.subjects.length) throw new Error("At least one subject is required");
      } catch (err) {
        showError(err.message);
        return;
      }
    }
    const submitBtn = document.getElementById("submit-btn");
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> Creating...';
    try {
      let name = document.querySelector('[name="name"]').value.trim();
      if (!name) name = "Timetable " + new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      const result = await apiFetch("/api/timetables", {
        method: "POST",
        body: JSON.stringify({
          name: name,
          description: document.querySelector('[name="description"]').value,
          inputJson: JSON.stringify(inputJson),
        }),
      });
      localStorage.removeItem("timetable_draft");
      window.location.href = `/processing?id=${result.id}`;
    } catch (err) {
      showError(err.message);
      submitBtn.disabled = false;
      submitBtn.innerHTML = "Create & Schedule";
    }
  });

  document.querySelectorAll(".section-header").forEach((header) => {
    header.addEventListener("click", () => {
      const content = header.nextElementSibling;
      content.classList.toggle("open");
      header.querySelector("svg").classList.toggle("rotate-180");
    });
  });

  document.getElementById("add-year").addEventListener("click", addYearCard);
  document.getElementById("add-teacher").addEventListener("click", addTeacherCard);
  document.getElementById("add-lab").addEventListener("click", addLabCard);
  document.getElementById("add-room").addEventListener("click", addRoomCard);
  document.getElementById("add-subject").addEventListener("click", addSubjectCard);
  document.getElementById("add-break-card").addEventListener("click", addBreakCard);
  document.getElementById("add-teacher-unavail").addEventListener("click", addTeacherUnavailCard);
  document.getElementById("add-lab-unavail").addEventListener("click", addLabUnavailCard);

  document.querySelector('[name="days"]').addEventListener("change", () => {
    const days = parseInt(document.querySelector('[name="days"]').value);
    const dayOptions = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      .slice(0, days)
      .map((d, idx) => `<option value="${idx}">${d}</option>`)
      .join("");
    document
      .querySelectorAll('select[name="unavail_day[]"], select[name="unavail_lab_day[]"]')
      .forEach((sel) => {
        const current = sel.value;
        sel.innerHTML = dayOptions;
        if (current < days) sel.value = current;
        else sel.value = "0";
      });
    runFullValidation();
  });

  (async () => {
    try {
      const user = await checkAuth();
      document.getElementById("username").textContent = `Hello, ${user.username}`;
    } catch (e) {}
    const urlParams = new URLSearchParams(window.location.search);
    const draftParam = urlParams.get("draft");
    if (draftParam) {
      loadDraftIfExists();
    } else {
      // Do NOT add default cards; start empty.
      loadDraftIfExists();
    }
    runFullValidation();
  })();
});