from typing import List, Dict, Tuple
from ortools.sat.python import cp_model
from .constants import MINUTES_PER_DAY
from .data_classes import *

def build_model(
    activities: List[Activity],
    time_settings: TimeSettings,
    slots_per_year: Dict[str, List[SlotInfo]],
    lecture_allowed: Dict[str, List[Tuple[int, int]]],
    practical_allowed: Dict[str, List[Tuple[int, int, int]]],
    teachers: Dict[str, Teacher],
    labs: List[str],
    batches: List[Batch],
    subjects: List[Subject]
) -> Tuple[cp_model.CpModel, Dict, List]:
    model = cp_model.CpModel()
    days = time_settings.days
    day_start_min = time_settings.day_start_minutes

    # Variables
    activity_vars = {}
    for act in activities:
        if act.type == "lecture":
            day_var = model.NewIntVar(0, days-1, f"day_{act.id}")
            start_var = model.NewIntVar(0, len(slots_per_year[act.year]) - act.duration_slots, f"start_{act.id}")
            activity_vars[act.id] = {"day": day_var, "start": start_var}
            allowed = lecture_allowed.get(act.id, [])
            if not allowed:
                model.AddFalse()
            else:
                model.AddAllowedAssignments([day_var, start_var], allowed)
        else:
            day_var = model.NewIntVar(0, days-1, f"day_{act.id}")
            start_var = model.NewIntVar(0, len(slots_per_year[act.year]) - act.duration_slots, f"start_{act.id}")
            lab_var = model.NewIntVar(0, len(labs)-1, f"lab_{act.id}")
            activity_vars[act.id] = {"day": day_var, "start": start_var, "lab": lab_var}
            allowed = practical_allowed.get(act.id, [])
            if not allowed:
                model.AddFalse()
            else:
                model.AddAllowedAssignments([day_var, start_var, lab_var], allowed)

    # Intervals
    act_intervals = {}
    for act in activities:
        slots = slots_per_year[act.year]
        slot_starts = [s.start_minutes for s in slots]
        offset_var = model.NewIntVar(0, time_settings.day_end_minutes - time_settings.day_start_minutes, f"offset_{act.id}")
        model.AddElement(activity_vars[act.id]["start"], slot_starts, offset_var)

        start_abs = model.NewIntVar(0, days * MINUTES_PER_DAY, f"start_abs_{act.id}")
        model.Add(start_abs == activity_vars[act.id]["day"] * MINUTES_PER_DAY + day_start_min + offset_var)

        end_abs = model.NewIntVar(0, days * MINUTES_PER_DAY, f"end_abs_{act.id}")
        model.Add(end_abs == start_abs + act.duration_minutes)

        interval = model.NewIntervalVar(start_abs, act.duration_minutes, end_abs, f"interval_{act.id}")
        act_intervals[act.id] = interval

    # 1. Teacher non‑overlap
    teacher_to_intervals = {}
    for act in activities:
        teacher_to_intervals.setdefault(act.teacher, []).append(act_intervals[act.id])
    for teacher, intervals in teacher_to_intervals.items():
        model.AddNoOverlap(intervals)

    # 2. Lab non‑overlap (optional intervals)
    lab_optional_intervals = {i: [] for i in range(len(labs))}
    for act in [a for a in activities if a.type == "practical"]:
        slots = slots_per_year[act.year]
        day_var = activity_vars[act.id]["day"]
        start_var = activity_vars[act.id]["start"]
        lab_var = activity_vars[act.id]["lab"]
        slot_starts = [s.start_minutes for s in slots]

        for lab_idx in range(len(labs)):
            is_selected = model.NewBoolVar(f"{act.id}_lab_{lab_idx}")
            model.Add(lab_var == lab_idx).OnlyEnforceIf(is_selected)
            model.Add(lab_var != lab_idx).OnlyEnforceIf(is_selected.Not())

            offset_lab = model.NewIntVar(0, time_settings.day_end_minutes - time_settings.day_start_minutes, f"offset_{act.id}_lab{lab_idx}")
            model.AddElement(start_var, slot_starts, offset_lab).OnlyEnforceIf(is_selected)

            start_abs_lab = model.NewIntVar(0, days * MINUTES_PER_DAY, f"start_abs_{act.id}_lab{lab_idx}")
            model.Add(start_abs_lab == day_var * MINUTES_PER_DAY + day_start_min + offset_lab).OnlyEnforceIf(is_selected)

            end_abs_lab = model.NewIntVar(0, days * MINUTES_PER_DAY, f"end_abs_{act.id}_lab{lab_idx}")
            model.Add(end_abs_lab == start_abs_lab + act.duration_minutes).OnlyEnforceIf(is_selected)

            interval_lab = model.NewOptionalIntervalVar(
                start_abs_lab, act.duration_minutes, end_abs_lab, is_selected,
                f"interval_{act.id}_lab{lab_idx}")
            lab_optional_intervals[lab_idx].append(interval_lab)

    for lab_idx, intervals in lab_optional_intervals.items():
        model.AddNoOverlap(intervals)

    # 3. Batch non‑overlap
    batch_to_intervals = {}
    for act in activities:
        if act.type == "lecture":
            for b in [ba for ba in batches if ba.year == act.year]:
                key = (b.year, b.name)
                batch_to_intervals.setdefault(key, []).append(act_intervals[act.id])
        else:
            key = (act.year, act.batch)
            batch_to_intervals.setdefault(key, []).append(act_intervals[act.id])
    for batch_key, intervals in batch_to_intervals.items():
        model.AddNoOverlap(intervals)

    # 4. Teacher load limits
    day_indicators = {}
    for act in activities:
        for d in range(days):
            ind = model.NewBoolVar(f"{act.id}_day{d}")
            model.Add(activity_vars[act.id]["day"] == d).OnlyEnforceIf(ind)
            model.Add(activity_vars[act.id]["day"] != d).OnlyEnforceIf(ind.Not())
            day_indicators[(act.id, d)] = ind

    teacher_day_lectures = {}
    teacher_day_practicals = {}
    for act in activities:
        teacher = act.teacher
        t_obj = teachers[teacher]
        if not t_obj.enforce_limits:
            continue
        for d in range(days):
            ind = day_indicators[(act.id, d)]
            if act.type == "lecture":
                teacher_day_lectures.setdefault((teacher, d), []).append(ind)
            else:
                teacher_day_practicals.setdefault((teacher, d), []).append(ind)

    for (teacher, d), inds in teacher_day_lectures.items():
        model.Add(sum(inds) <= teachers[teacher].max_lectures_per_day)
    for (teacher, d), inds in teacher_day_practicals.items():
        model.Add(sum(inds) <= teachers[teacher].max_practicals_per_day)

    # Soft constraints – early slot preference
    objective_terms = []

    for act in activities:
        reward_var = model.NewIntVar(-1000, 0, f"reward_{act.id}")
        model.Add(reward_var == -activity_vars[act.id]["start"])
        objective_terms.append(reward_var)

    return model, activity_vars, objective_terms