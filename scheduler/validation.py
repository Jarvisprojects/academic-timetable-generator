import json
from datetime import time, datetime, timedelta
from typing import List, Dict, Set
from .data_classes import *


def parse_time(t_str: str) -> time:
    return datetime.strptime(t_str.strip(), "%I:%M %p").time()


def time_to_minutes(t: time) -> int:
    return t.hour * 60 + t.minute


def minutes_to_time_str(m: int) -> str:
    t = datetime(2000, 1, 1, 0, 0) + timedelta(minutes=m)
    return t.strftime("%I:%M %p").lstrip("0").replace(" 0", " ")


def validate_input(data: dict) -> dict:
    errors = []
    ts = data.get("time_settings")

    if not ts:
        raise ValueError("Time settings are missing. Please provide start time, end time, and slot duration.")

    try:
        day_start = parse_time(ts["day_start"])
        day_end = parse_time(ts["day_end"])
        slot_dur = ts["slot_duration_minutes"]

        if day_end <= day_start:
            errors.append(
                f"End time ({ts['day_end']}) must be after start time ({ts['day_start']})."
            )

        total_minutes = time_to_minutes(day_end) - time_to_minutes(day_start)

        # Removed the total minutes divisibility check per user request

        if ts.get("days", 0) <= 0 or ts.get("slots_per_day", 0) <= 0 or slot_dur <= 0:
            errors.append(
                "Days per week, periods per day, and period length must all be greater than zero."
            )

    except Exception as e:
        errors.append(f"Problem with time settings: {e}")

    # ---------------- YEARS ----------------
    years = data.get("years", [])
    if not years:
        errors.append("You haven't added any years. Please add at least one year.")
    year_set = set(years)

    # ---------------- BATCHES ----------------
    batches = []
    for b in data.get("batches", []):
        if b["year"] not in year_set:
            errors.append(
                f"Batch '{b['name']}' is for year '{b['year']}', but that year isn't in your year list."
            )
        batches.append(Batch(name=b["name"], year=b["year"]))

    seen_batches = set()
    for b in batches:
        key = (b.year, b.name)
        if key in seen_batches:
            errors.append(
                f"You have two batches named '{b.name}' in year '{b.year}'. Batch names must be different within the same year."
            )
        seen_batches.add(key)

    # ---------------- ROOMS ----------------
    rooms = []
    room_years = set()

    for r in data.get("rooms", []):
        if r["year"] not in year_set:
            errors.append(
                f"Room '{r['name']}' is assigned to year '{r['year']}', but that year hasn't been added."
            )

        if r["year"] in room_years:
            errors.append(
                f"Year '{r['year']}' already has a room ('{r['name']}'). Only one room per year is allowed."
            )

        room_years.add(r["year"])
        rooms.append(Room(name=r["name"], year=r["year"]))

    for y in years:
        if y not in room_years:
            errors.append(f"Year '{y}' doesn't have a room. Please assign a room to this year.")

    # ---------------- LABS ----------------
    labs = data.get("labs", [])
    lab_set = set()
    for lab in labs:
        if lab in lab_set:
            errors.append(f"Lab name '{lab}' appears more than once. Each lab name must be unique.")
        lab_set.add(lab)

    # ---------------- TEACHERS ----------------
    teachers_dict = {}
    for t in data.get("teachers", []):
        name = t["name"]
        if name in teachers_dict:
            errors.append(f"Teacher '{name}' is listed twice. Please remove the duplicate.")
        teachers_dict[name] = Teacher(
            name=name,
            max_lectures_per_day=t["max_lectures_per_day"],
            max_practicals_per_day=t["max_practicals_per_day"],
            enforce_limits=t["enforce_limits"],
        )

    # ---------------- SUBJECTS ----------------
    subjects = []
    for s in data.get("subjects", []):
        if s["year"] not in year_set:
            errors.append(
                f"Subject '{s['name']}' is for year '{s['year']}', but that year hasn't been added."
            )

        if s["teacher"] not in teachers_dict:
            errors.append(
                f"Subject '{s['name']}' uses teacher '{s['teacher']}', but that teacher isn't in your teacher list."
            )

        if s["lectures_per_week"] < 0 or s["practicals_per_week"] < 0:
            errors.append(
                f"Subject '{s['name']}' has a negative number of lectures or practicals. Use 0 or a positive number."
            )

        if s["lectures_per_week"] > 0 and s["lecture_duration_slots"] <= 0:
            errors.append(
                f"Subject '{s['name']}' has lectures but lecture length is 0. Set it to at least 1 period."
            )

        if s["practicals_per_week"] > 0 and s["practical_duration_slots"] <= 0:
            errors.append(
                f"Subject '{s['name']}' has practicals but practical length is 0. Set it to at least 1 period."
            )

        lab = s.get("lab")
        if lab is not None and lab not in labs:
            errors.append(
                f"Subject '{s['name']}' uses lab '{lab}', but that lab isn't in your lab list."
            )

        subjects.append(
            Subject(
                name=s["name"],
                year=s["year"],
                teacher=s["teacher"],
                lectures_per_week=s["lectures_per_week"],
                lecture_duration=s["lecture_duration_slots"],
                practicals_per_week=s["practicals_per_week"],
                practical_duration=s["practical_duration_slots"],
                lab=lab,
            )
        )

    # ---------------- BREAKS ----------------
    breaks_data = data.get("breaks", {})
    breaks_by_year = {y: [] for y in years}
    day_start_str = minutes_to_time_str(time_to_minutes(day_start))
    day_end_str = minutes_to_time_str(time_to_minutes(day_end))

    # Pre‑compute all valid slot start times for alignment messages
    slot_starts_for_alignment = []
    for m in range(0, total_minutes + 1, slot_dur):
        slot_starts_for_alignment.append(minutes_to_time_str(time_to_minutes(day_start) + m))

    for y, blist in breaks_data.items():
        if y not in year_set:
            errors.append(f"Breaks are set for year '{y}', but that year hasn't been added.")
            continue

        for b in blist:
            try:
                start = parse_time(b["start"])
                end = parse_time(b["end"])

                if end <= start:
                    errors.append(
                        f"In year '{y}', a break's end time ({b['end']}) must be after its start time ({b['start']})."
                    )

                start_min = time_to_minutes(start) - time_to_minutes(day_start)
                end_min = time_to_minutes(end) - time_to_minutes(day_start)

                if start_min < 0 or end_min > total_minutes:
                    errors.append(
                        f"A break in year '{y}' ({b['start']} to {b['end']}) is outside working hours ({day_start_str} to {day_end_str})."
                    )

                # Break start must align with slot boundaries
                if start_min % slot_dur != 0:
                    # Show first few valid start times
                    first_few = slot_starts_for_alignment[:6]
                    times_list = ", ".join(first_few)
                    if len(slot_starts_for_alignment) > 6:
                        times_list += ", …"

                    errors.append(
                        f"The break in year '{y}' starting at {b['start']} doesn't line up with class start times.\n"
                        f"Classes start at: {times_list}\n"
                        f"💡 Click the 'Snap to slot' button next to the break time to fix this automatically."
                    )

                breaks_by_year[y].append(Break(start=start, end=end))

            except Exception as e:
                errors.append(f"Problem with a break in year '{y}': {e}")

        breaks_by_year[y].sort(key=lambda br: br.start)

        for i in range(1, len(breaks_by_year[y])):
            if breaks_by_year[y][i - 1].end > breaks_by_year[y][i].start:
                prev = breaks_by_year[y][i - 1]
                curr = breaks_by_year[y][i]
                errors.append(
                    f"In year '{y}', two breaks overlap: {prev.start.strftime('%I:%M %p')} – {prev.end.strftime('%I:%M %p')} "
                    f"and {curr.start.strftime('%I:%M %p')} – {curr.end.strftime('%I:%M %p')}. Please adjust the times."
                )

    # ---------------- TEACHER UNAVAILABILITY ----------------
    teacher_unavail = []
    for u in data.get("teacher_unavailability", []):
        if u["teacher"] not in teachers_dict:
            errors.append(
                f"Teacher '{u['teacher']}' is marked as unavailable but isn't in your teacher list."
            )

        if u["day"] < 0 or u["day"] >= ts["days"]:
            errors.append(
                f"Unavailability for teacher '{u['teacher']}' uses an invalid day. Days are numbered 0 to {ts['days']-1}."
            )

        try:
            start = parse_time(u["start"])
            end = parse_time(u["end"])

            if end <= start:
                errors.append(
                    f"For teacher '{u['teacher']}', unavailable end time ({u['end']}) must be after start time ({u['start']})."
                )

            if start < day_start or end > day_end:
                errors.append(
                    f"For teacher '{u['teacher']}', unavailable period ({u['start']} – {u['end']}) is outside working hours ({day_start_str} – {day_end_str})."
                )

            teacher_unavail.append(
                Unavailability(
                    entity=u["teacher"],
                    day=u["day"],
                    start=start,
                    end=end,
                )
            )

        except Exception as e:
            errors.append(f"Problem with teacher unavailability for '{u['teacher']}': {e}")

    # ---------------- LAB UNAVAILABILITY ----------------
    lab_unavail = []
    for u in data.get("lab_unavailability", []):
        if u["lab"] not in labs:
            errors.append(
                f"Lab '{u['lab']}' is marked as unavailable but isn't in your lab list."
            )

        if u["day"] < 0 or u["day"] >= ts["days"]:
            errors.append(
                f"Unavailability for lab '{u['lab']}' uses an invalid day. Days are numbered 0 to {ts['days']-1}."
            )

        try:
            start = parse_time(u["start"])
            end = parse_time(u["end"])

            if end <= start:
                errors.append(
                    f"For lab '{u['lab']}', unavailable end time ({u['end']}) must be after start time ({u['start']})."
                )

            if start < day_start or end > day_end:
                errors.append(
                    f"For lab '{u['lab']}', unavailable period ({u['start']} – {u['end']}) is outside working hours ({day_start_str} – {day_end_str})."
                )

            lab_unavail.append(
                Unavailability(
                    entity=u["lab"],
                    day=u["day"],
                    start=start,
                    end=end,
                )
            )

        except Exception as e:
            errors.append(f"Problem with lab unavailability for '{u['lab']}': {e}")

    # ---------------- FINAL ----------------
    if errors:
        # Join errors with two newlines for readability between sections
        raise ValueError("\n\n".join(errors))

    time_settings = TimeSettings(
        days=ts["days"],
        slots_per_day=ts["slots_per_day"],
        slot_duration=slot_dur,
        day_start=day_start,
        day_end=day_end,
    )

    return {
        "time_settings": time_settings,
        "years": years,
        "batches": batches,
        "subjects": subjects,
        "teachers": teachers_dict,
        "rooms": rooms,
        "labs": labs,
        "breaks": breaks_by_year,
        "teacher_unavailability": teacher_unavail,
        "lab_unavailability": lab_unavail,
    }