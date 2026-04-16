import json
import sys
from .core import solve_timetable

if __name__ == "__main__":
    if len(sys.argv) > 1:
        with open(sys.argv[1], 'r') as f:
            input_data = json.load(f)
    else:
        input_data = json.load(sys.stdin)
    result = solve_timetable(input_data)
    print(json.dumps(result))
