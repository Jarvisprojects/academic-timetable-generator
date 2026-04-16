from typing import List, Dict
from ortools.sat.python import cp_model
from .constants import MINUTES_PER_DAY
from .data_classes import Activity, TimeSettings, SlotInfo
from .validation import minutes_to_time_str

def generate_output(
    solver: cp_model.CpSolver,
    activities: List[Activity],
    activity_vars: Dict,
    time_settings: TimeSettings,
    slots_per_year: Dict[str, List[SlotInfo]],
    room_by_year: Dict[str, str],
    labs: List[str]
) -> dict:
    events = []
    day_start_min = time_settings.day_start_minutes

    for act in activities:
        day = solver.Value(activity_vars[act.id]["day"])
        start_slot = solver.Value(activity_vars[act.id]["start"])
        slots = slots_per_year[act.year]
        slot_info = slots[start_slot]
        start_abs = day * MINUTES_PER_DAY + day_start_min + slot_info.start_minutes
        end_abs = start_abs + act.duration_minutes

        event = {
            "id": act.id,
            "type": act.type,
            "subject": act.subject,
            "year": act.year,
            "batch": act.batch,
            "teacher": act.teacher,
            "day": day,
            "start_slot": start_slot,
            "end_slot": start_slot + act.duration_slots - 1,
            "start_time": minutes_to_time_str(start_abs),
            "end_time": minutes_to_time_str(end_abs)
        }
        if act.type == "lecture":
            event["room"] = room_by_year[act.year]
        else:
            lab_idx = solver.Value(activity_vars[act.id]["lab"])
            event["lab"] = labs[lab_idx]
        events.append(event)

    slot_mapping = {}
    for year, slots in slots_per_year.items():
        day_map = {}
        for s in slots:
            day_map[str(s.index)] = [
                minutes_to_time_str(day_start_min + s.start_minutes),
                minutes_to_time_str(day_start_min + s.end_minutes)
            ]
        slot_mapping[year] = day_map

    return {
        "slot_mapping": slot_mapping,
        "events": events
    }