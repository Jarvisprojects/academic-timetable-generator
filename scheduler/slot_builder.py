from typing import Dict, List
from .data_classes import TimeSettings, Break, SlotInfo

def build_slots_per_year(time_settings: TimeSettings, breaks_by_year: Dict[str, List[Break]]) -> Dict[str, List[SlotInfo]]:
    slot_duration = time_settings.slot_duration
    day_start_min = time_settings.day_start_minutes
    day_end_min = time_settings.day_end_minutes
    day_length = day_end_min - day_start_min

    slots_per_year = {}
    for year, breaks in breaks_by_year.items():
        # Convert breaks to relative minutes
        rel_breaks = []
        for b in breaks:
            rel_start = b.start_minutes - day_start_min
            rel_end = b.end_minutes - day_start_min
            if rel_start < 0 or rel_end > day_length:
                continue
            rel_breaks.append((rel_start, rel_end))
        # Sort breaks (they should already be sorted and non‑overlapping from validation)
        rel_breaks.sort()

        # Build free intervals
        free_intervals = []
        current = 0
        for br_start, br_end in rel_breaks:
            if current < br_start:
                free_intervals.append((current, br_start))
            current = max(current, br_end)
        if current < day_length:
            free_intervals.append((current, day_length))

        # Create slots within free intervals
        slots = []
        for start, end in free_intervals:
            slot_start = start
            while slot_start + slot_duration <= end:
                slots.append(SlotInfo(
                    year=year,
                    index=len(slots),
                    start_minutes=slot_start,
                    end_minutes=slot_start + slot_duration
                ))
                slot_start += slot_duration
        slots_per_year[year] = slots
    return slots_per_year