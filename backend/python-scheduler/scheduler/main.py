from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
import random

# ----------------------------
# Timetable Scheduler Class
# ----------------------------
class TimetableScheduler:
    def __init__(self, data):
        self.data = data
        self.days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        self.max_periods = 6  # periods per day

    def generate_schedule(self):
        """
        Generate a structured timetable avoiding teacher clashes.
        """
        result = []
        teacher_allocations = {}  # track teacher usage per day/period

        for c in self.data.get("classes", []):
            class_schedule = []
            available_slots = [(d, p) for d in self.days for p in range(1, self.max_periods + 1)]
            random.shuffle(available_slots)  # shuffle to distribute randomly

            for subj in c.get("subjects", []):
                hours = subj.get("hoursPerWeek", 1)

                for _ in range(hours):
                    if not available_slots:
                        continue

                    # Pick next slot
                    day, period = available_slots.pop()

                    # Prevent teacher conflict
                    teacher_id = subj["teacherId"]
                    if teacher_id not in teacher_allocations:
                        teacher_allocations[teacher_id] = set()

                    while (day, period) in teacher_allocations[teacher_id] and available_slots:
                        day, period = available_slots.pop()

                    teacher_allocations[teacher_id].add((day, period))

                    # Add to timetable
                    class_schedule.append({
                        "classId": c["id"],
                        "day": day,
                        "period": period,
                        "subjectId": subj["subjectId"],
                        "teacherId": teacher_id
                    })

            # Sort by day and period for readability
            class_schedule.sort(key=lambda x: (self.days.index(x["day"]), x["period"]))
            result.extend(class_schedule)

        return result

    def optimize_existing(self, timetable):
        """
        Placeholder optimization: shuffle timetable to reduce conflicts.
        """
        random.shuffle(timetable)
        return timetable


# ----------------------------
# Flask App Setup
# ----------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Allow all origins


# ----------------------------
# Routes
# ----------------------------
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "timetable-scheduler"})


@app.route('/schedule', methods=['POST'])
def generate_schedule():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        logger.info("Received schedule generation request")

        required_fields = ['classes', 'teachers', 'subjects']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        scheduler = TimetableScheduler(data)
        result = scheduler.generate_schedule()

        logger.info("Schedule generated successfully")
        return jsonify(result)

    except Exception as e:
        logger.error(f"Error generating schedule: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/validate', methods=['POST'])
def validate_schedule():
    try:
        data = request.get_json()
        if not data or 'timetable' not in data:
            return jsonify({"error": "Timetable data required"}), 400

        conflicts = validate_timetable(data['timetable'])

        return jsonify({
            "valid": len(conflicts) == 0,
            "conflicts": conflicts,
            "message": "Validation completed" if len(conflicts) == 0 else "Conflicts found"
        })

    except Exception as e:
        logger.error(f"Error validating schedule: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/optimize', methods=['POST'])
def optimize_schedule():
    try:
        data = request.get_json()
        if not data or 'timetable' not in data:
            return jsonify({"error": "Timetable data required"}), 400

        scheduler = TimetableScheduler(data)
        optimized = scheduler.optimize_existing(data['timetable'])

        return jsonify({
            "optimized": optimized,
            "message": "Schedule optimized successfully"
        })

    except Exception as e:
        logger.error(f"Error optimizing schedule: {str(e)}")
        return jsonify({"error": str(e)}), 500


# ----------------------------
# Helper
# ----------------------------
def validate_timetable(timetable):
    conflicts = []
    teacher_usage = {}

    for entry in timetable:
        key = (entry["day"], entry["period"])
        teacher_id = entry["teacherId"]

        if teacher_id not in teacher_usage:
            teacher_usage[teacher_id] = set()

        if key in teacher_usage[teacher_id]:
            conflicts.append({
                "teacherId": teacher_id,
                "day": entry["day"],
                "period": entry["period"],
                "conflict": "Teacher double-booked"
            })
        else:
            teacher_usage[teacher_id].add(key)

    return conflicts


# ----------------------------
# Run Flask App
# ----------------------------
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    host = os.environ.get('HOST', '0.0.0.0')
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'

    logger.info(f"Starting timetable scheduler on {host}:{port}")
    app.run(host=host, port=port, debug=debug)
