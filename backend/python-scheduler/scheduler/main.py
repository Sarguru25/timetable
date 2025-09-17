# main.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
from datetime import datetime
from optimizer import TimetableScheduler

# ----------------------------
# Logging Setup
# ----------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - timetable-scheduler - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("timetable-scheduler")

# ----------------------------
# Flask App Setup
# ----------------------------
app = Flask(__name__)
CORS(app)

# ----------------------------
# Configuration (from env)
# ----------------------------
DEFAULT_DAYS = int(os.environ.get("SCHED_DAYS", 6))
DEFAULT_PERIODS = int(os.environ.get("SCHED_PERIODS", 6))
DEFAULT_TIME_LIMIT = int(os.environ.get("SCHED_TIME_LIMIT", 30))

# ----------------------------
# Routes
# ----------------------------
@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "timetable-scheduler",
        "timestamp": datetime.now().isoformat()
    })


@app.route("/schedule", methods=["POST"])
def generate_schedule():
    """Generate timetable using optimizer"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400


        # 👇 Add this for debugging
        logger.info("Payload received from Node: %s", data)

        # Or pretty-print JSON
        import json
        print("=== Raw Payload from Node ===")
        print(json.dumps(data, indent=2))
        print("============================")


        logger.info("Received schedule generation request")

        # Validate required fields
        required_fields = ["classes", "teachers", "subjects"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        scheduler = TimetableScheduler(data)
        result = scheduler.generate_schedule()

        if result["status"] in ["optimal", "feasible"]:
            logger.info("Schedule generated successfully")
            return jsonify({
                "status": "success",
                "message": result["message"],
                "timetable": result["schedule"],
                "statistics": result["statistics"]
            })
        else:
            logger.warning("Failed to generate feasible schedule")
            return jsonify({
                "status": "error",
                "message": result["message"],
                "statistics": result.get("statistics", {})
            }), 400

    except Exception as e:
        logger.exception("Unhandled exception in /schedule")
        return jsonify({
            "status": "error",
            "message": f"Internal server error: {str(e)}"
        }), 500


@app.route("/validate", methods=["POST"])
def validate_schedule():
    """Validate timetable for conflicts (teacher/class double booking)"""
    try:
        data = request.get_json()
        if not data or "timetable" not in data:
            return jsonify({"error": "Timetable data required"}), 400

        scheduler = TimetableScheduler({
            "classes": [], "teachers": [], "subjects": []
        })
        conflicts = scheduler.validate_timetable(data["timetable"])

        return jsonify({
            "valid": len(conflicts) == 0,
            "conflicts": conflicts,
            "message": "Validation completed" if len(conflicts) == 0 else "Conflicts found"
        })

    except Exception as e:
        logger.exception("Error validating timetable")
        return jsonify({
            "status": "error",
            "message": f"Validation error: {str(e)}"
        }), 500


@app.route("/optimize", methods=["POST"])
def optimize_schedule():
    """Optimize an existing timetable"""
    try:
        data = request.get_json()
        if not data or "timetable" not in data:
            return jsonify({"error": "Timetable data required"}), 400

        scheduler = TimetableScheduler({
            "classes": [], "teachers": [], "subjects": []
        })
        optimized = scheduler.optimize_existing(data["timetable"])

        return jsonify({
            "optimizedTimetable": optimized,
            "message": "Schedule optimized successfully"
        })

    except Exception as e:
        logger.exception("Error optimizing timetable")
        return jsonify({
            "status": "error",
            "message": f"Optimization error: {str(e)}"
        }), 500


# ----------------------------
# Error Handlers
# ----------------------------
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"error": "Method not allowed"}), 405


# ----------------------------
# Run Flask App
# ----------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    debug = os.environ.get("DEBUG", "False").lower() == "true"

    logger.info(f"Starting timetable scheduler on {host}:{port}")
    app.run(host=host, port=port, debug=debug)
