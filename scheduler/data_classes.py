from dataclasses import dataclass, field
from datetime import time
from typing import Optional, List

@dataclass
class TimeSettings:
    days: int
    slots_per_day: int
    slot_duration: int
    day_start: time
    day_end: time
    day_start_minutes: int = field(init=False)
    day_end_minutes: int = field(init=False)

    def __post_init__(self):
        self.day_start_minutes = self.day_start.hour * 60 + self.day_start.minute
        self.day_end_minutes = self.day_end.hour * 60 + self.day_end.minute

@dataclass
class Batch:
    name: str
    year: str

@dataclass
class Subject:
    name: str
    year: str
    teacher: str
    lectures_per_week: int
    lecture_duration: int
    practicals_per_week: int
    practical_duration: int
    lab: Optional[str] = None          # NEW: lab restriction (single lab name)

@dataclass
class Teacher:
    name: str
    max_lectures_per_day: int
    max_practicals_per_day: int
    enforce_limits: bool

@dataclass
class Room:
    name: str
    year: str

@dataclass
class Break:
    start: time
    end: time
    start_minutes: int = field(init=False)
    end_minutes: int = field(init=False)

    def __post_init__(self):
        self.start_minutes = self.start.hour * 60 + self.start.minute
        self.end_minutes = self.end.hour * 60 + self.end.minute

@dataclass
class Unavailability:
    entity: str
    day: int
    start: time
    end: time
    start_minutes: int = field(init=False)
    end_minutes: int = field(init=False)

    def __post_init__(self):
        self.start_minutes = self.start.hour * 60 + self.start.minute
        self.end_minutes = self.end.hour * 60 + self.end.minute

@dataclass
class SlotInfo:
    year: str
    index: int
    start_minutes: int
    end_minutes: int

@dataclass
class Activity:
    id: str
    type: str
    subject: str
    year: str
    batch: Optional[str]
    teacher: str
    duration_slots: int
    duration_minutes: int
    allowed_labs: Optional[List[str]] = None   # NEW: list of allowed lab names