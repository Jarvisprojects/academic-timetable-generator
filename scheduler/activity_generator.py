from typing import List
from .data_classes import Subject, Batch, Activity, TimeSettings

def generate_activities(subjects: List[Subject], batches: List[Batch], time_settings: TimeSettings) -> List[Activity]:
    activities = []
    counter = 0
    batches_by_year = {}
    for b in batches:
        batches_by_year.setdefault(b.year, []).append(b)

    for s in subjects:
        # Lectures
        for i in range(s.lectures_per_week):
            activities.append(Activity(
                id=f"LEC_{s.name}_{counter}",
                type="lecture",
                subject=s.name,
                year=s.year,
                batch=None,
                teacher=s.teacher,
                duration_slots=s.lecture_duration,
                duration_minutes=s.lecture_duration * time_settings.slot_duration
                # allowed_labs remains None for lectures
            ))
            counter += 1

        # Practicals
        # Determine allowed labs list from subject's lab field
        allowed_labs = None
        if s.lab is not None:
            # If lab is a string, wrap in list; could also support list directly
            allowed_labs = [s.lab]

        for batch in batches_by_year.get(s.year, []):
            for i in range(s.practicals_per_week):
                activities.append(Activity(
                    id=f"PRAC_{s.name}_{batch.year}_{batch.name}_{counter}",
                    type="practical",
                    subject=s.name,
                    year=s.year,
                    batch=batch.name,
                    teacher=s.teacher,
                    duration_slots=s.practical_duration,
                    duration_minutes=s.practical_duration * time_settings.slot_duration,
                    allowed_labs=allowed_labs   # attach lab restriction
                ))
                counter += 1

    return activities