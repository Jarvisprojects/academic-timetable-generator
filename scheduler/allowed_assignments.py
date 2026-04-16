from typing import List, Tuple, Dict
from .constants import MINUTES_PER_DAY
from .data_classes import Activity, TimeSettings, SlotInfo, Unavailability

def build_allowed_assignments(
    activities: List[Activity],
    time_settings: TimeSettings,
    slots_per_year: Dict[str, List[SlotInfo]],
    teacher_unavail: List[Unavailability],
    lab_unavail: List[Unavailability],
    labs: List[str]
) -> Tuple[Dict[str, List[Tuple[int, int]]], Dict[str, List[Tuple[int, int, int]]]]:
    days = time_settings.days
    slot_duration = time_settings.slot_duration
    day_start_min = time_settings.day_start_minutes

    teacher_unavail_by_day = {}
    for u in teacher_unavail:
        teacher_unavail_by_day.setdefault(u.entity, {}).setdefault(u.day, []).append(u)

    lab_unavail_by_day = {}
    for u in lab_unavail:
        lab_unavail_by_day.setdefault(u.entity, {}).setdefault(u.day, []).append(u)

    lecture_allowed = {}
    practical_allowed = {}

    for act in activities:
        slots = slots_per_year[act.year]
        max_start = len(slots) - act.duration_slots
        if max_start < 0:
            # activity too long for the day (no slots) – will be caught later
            pass

        if act.type == "lecture":
            allowed = []
            for d in range(days):
                for start in range(max_start + 1):
                    forbidden = False
                    teacher_unavail_list = teacher_unavail_by_day.get(act.teacher, {}).get(d, [])
                    for slot_idx in range(start, start + act.duration_slots):
                        slot = slots[slot_idx]
                        slot_abs_start = d * MINUTES_PER_DAY + day_start_min + slot.start_minutes
                        slot_abs_end = slot_abs_start + slot_duration
                        for u in teacher_unavail_list:
                            u_abs_start = d * MINUTES_PER_DAY + u.start_minutes
                            u_abs_end = d * MINUTES_PER_DAY + u.end_minutes
                            if not (slot_abs_end <= u_abs_start or slot_abs_start >= u_abs_end):
                                forbidden = True
                                break
                        if forbidden:
                            break
                    if not forbidden:
                        allowed.append((d, start))
            lecture_allowed[act.id] = allowed

        else:  # practical
            allowed = []
            for d in range(days):
                for start in range(max_start + 1):
                    # Teacher unavailability check
                    teacher_forbidden = False
                    teacher_unavail_list = teacher_unavail_by_day.get(act.teacher, {}).get(d, [])
                    for slot_idx in range(start, start + act.duration_slots):
                        slot = slots[slot_idx]
                        slot_abs_start = d * MINUTES_PER_DAY + day_start_min + slot.start_minutes
                        slot_abs_end = slot_abs_start + slot_duration
                        for u in teacher_unavail_list:
                            u_abs_start = d * MINUTES_PER_DAY + u.start_minutes
                            u_abs_end = d * MINUTES_PER_DAY + u.end_minutes
                            if not (slot_abs_end <= u_abs_start or slot_abs_start >= u_abs_end):
                                teacher_forbidden = True
                                break
                        if teacher_forbidden:
                            break
                    if teacher_forbidden:
                        continue

                    # Determine which labs are allowed for this activity
                    if act.allowed_labs is not None:
                        # Only consider labs in the allowed list
                        lab_indices = [i for i, lab in enumerate(labs) if lab in act.allowed_labs]
                    else:
                        # All labs are allowed
                        lab_indices = range(len(labs))

                    for lab_idx in lab_indices:
                        lab = labs[lab_idx]
                        lab_forbidden = False
                        lab_unavail_list = lab_unavail_by_day.get(lab, {}).get(d, [])
                        for slot_idx in range(start, start + act.duration_slots):
                            slot = slots[slot_idx]
                            slot_abs_start = d * MINUTES_PER_DAY + day_start_min + slot.start_minutes
                            slot_abs_end = slot_abs_start + slot_duration
                            for u in lab_unavail_list:
                                u_abs_start = d * MINUTES_PER_DAY + u.start_minutes
                                u_abs_end = d * MINUTES_PER_DAY + u.end_minutes
                                if not (slot_abs_end <= u_abs_start or slot_abs_start >= u_abs_end):
                                    lab_forbidden = True
                                    break
                            if lab_forbidden:
                                break
                        if not lab_forbidden:
                            allowed.append((d, start, lab_idx))
            practical_allowed[act.id] = allowed

    return lecture_allowed, practical_allowed