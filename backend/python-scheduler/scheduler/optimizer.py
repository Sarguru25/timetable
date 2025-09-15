from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os



# ----------------------------
# Mock Timetable Scheduler Class
# ----------------------------
class TimetableScheduler:
    def __init__(self, data):
        self.data = data

    def generate_schedule(self):
        """
        Generate a simple distributed schedule across days and periods.
        """
        result = []

        # Define working days and periods
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        max_periods = 7  # periods per day
        total_days = len(days)

        for c in self.data.get("classes", []):
            period_counter = 0  # count across all slots

            for subj in c.get("subjects", []):
                hours = subj.get("hoursPerWeek", 1)  # how many times this subject should appear

                for _ in range(hours):
                    # Compute day + period
                    day_index = (period_counter // max_periods) % total_days
                    period = (period_counter % max_periods) + 1

                    result.append({
                        "classId": c["id"],
                        "day": days[day_index],
                        "period": period,
                        "subjectId": subj["subjectId"],
                        "teacherId": subj["teacherId"]
                    })

                    period_counter += 1  # move forward

        return result



    def optimize_existing(self, timetable):
        """
        Example optimization (mock).
        You can implement real optimization here.
        """
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
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "timetable-scheduler"})


@app.route('/schedule', methods=['POST'])
def generate_schedule():
    """
    Generate timetable schedule
    Expected JSON payload:
    {
        "classes": [...],
        "teachers": [...],
        "subjects": [...],
        "fixedSlots": [...]
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        logger.info("Received schedule generation request")

        # Validate required fields
        required_fields = ['classes', 'teachers', 'subjects']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Generate schedule
        scheduler = TimetableScheduler(data)
        result = scheduler.generate_schedule()

        logger.info("Schedule generated successfully")
        return jsonify(result)

    except Exception as e:
        logger.error(f"Error generating schedule: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/validate', methods=['POST'])
def validate_schedule():
    """
    Validate an existing timetable for conflicts
    """
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
    """
    Optimize an existing timetable
    """
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
# Helper Functions
# ----------------------------
def validate_timetable(timetable):
    """
    Validate timetable for conflicts (mock)
    Example checks could include:
    - Teacher double bookings
    - Class conflicts
    - Constraint violations
    """
    conflicts = []
    # Example mock: No actual conflict detection yet
    return conflicts


# ----------------------------
# Run Flask App
# ----------------------------
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    host = os.environ.get('HOST', '0.0.0.0')
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
