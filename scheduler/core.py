import json
import sys
from .validation import validate_input
from .slot_builder import build_slots_per_year
from .activity_generator import generate_activities
from .allowed_assignments import build_allowed_assignments
from .model_builder import build_model
from .output_generator import generate_output   

def solve_timetable(json_input: dict) -> dict:
    try:
        data = validate_input(json_input)
        time_settings = data["time_settings"]
        batches = data["batches"]
        subjects = data["subjects"]
        teachers = data["teachers"]
        rooms = data["rooms"]
        labs = data["labs"]
        breaks = data["breaks"]
        teacher_unavail = data["teacher_unavailability"]
        lab_unavail = data["lab_unavailability"]

        slots_per_year = build_slots_per_year(time_settings, breaks)
        activities = generate_activities(subjects, batches, time_settings)

        lecture_allowed, practical_allowed = build_allowed_assignments(
            activities, time_settings, slots_per_year,
            teacher_unavail, lab_unavail, labs
        )

        for act in activities:
            if act.type == "lecture":
                if not lecture_allowed.get(act.id):
                    return {"error": f"No feasible slots for {act.id}"}
            else:
                if not practical_allowed.get(act.id):
                    return {"error": f"No feasible slots for {act.id}"}

        model, activity_vars, objective_terms = build_model(
            activities, time_settings, slots_per_year,
            lecture_allowed, practical_allowed,
            teachers, labs, batches,
            subjects
        )

        model.Minimize(sum(objective_terms))

        from ortools.sat.python import cp_model
        solver = cp_model.CpSolver()
        solver.parameters.random_seed = 42
        solver.parameters.num_search_workers = 1
        solver.parameters.max_time_in_seconds = 120

        status = solver.Solve(model)

        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            room_by_year = {r.year: r.name for r in rooms}
            output = generate_output(solver, activities, activity_vars, time_settings,
                                     slots_per_year, room_by_year, labs)
            return output
        else:
            return {"error": "No feasible timetable found"}

    except Exception as e:
        return {"error": f"Input validation failed: {str(e)}"}