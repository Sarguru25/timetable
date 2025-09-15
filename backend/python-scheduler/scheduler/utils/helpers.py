import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

def validate_input_data(classes: List[Dict], teachers: List[Dict], 
                       subjects: List[Dict], rooms: List[Dict], 
                       fixed_slots: List[Dict]) -> bool:
    """
    Validate the input data for timetable generation
    
    Args:
        classes: List of class objects
        teachers: List of teacher objects
        subjects: List of subject objects
        rooms: List of room objects
        fixed_slots: List of fixed timetable slots
    
    Returns:
        bool: True if data is valid
    
    Raises:
        ValueError: If data validation fails
    """
    # Check required fields
    if not classes:
        raise ValueError("At least one class is required")
    
    if not teachers:
        raise ValueError("At least one teacher is required")
    
    if not subjects:
        raise ValueError("At least one subject is required")
    
    if not rooms:
        raise ValueError("At least one room is required")
    
    # Validate classes
    for class_obj in classes:
        if 'id' not in class_obj:
            raise ValueError("Class missing 'id' field")
        if 'name' not in class_obj:
            raise ValueError("Class missing 'name' field")
        if 'subjects' not in class_obj:
            raise ValueError("Class missing 'subjects' field")
        
        # Validate class subjects
        for subject in class_obj['subjects']:
            if 'subjectId' not in subject:
                raise ValueError("Class subject missing 'subjectId'")
            if 'teacherId' not in subject:
                raise ValueError("Class subject missing 'teacherId'")
            if 'hoursPerWeek' not in subject:
                raise ValueError("Class subject missing 'hoursPerWeek'")
    
    # Validate teachers
    for teacher in teachers:
        if 'id' not in teacher:
            raise ValueError("Teacher missing 'id' field")
        if 'name' not in teacher:
            raise ValueError("Teacher missing 'name' field")
    
    # Validate subjects
    for subject in subjects:
        if 'id' not in subject:
            raise ValueError("Subject missing 'id' field")
        if 'name' not in subject:
            raise ValueError("Subject missing 'name' field")
        if 'type' not in subject:
            raise ValueError("Subject missing 'type' field")
        if subject['type'] not in ['theory', 'lab']:
            raise ValueError("Subject type must be 'theory' or 'lab'")
    
    # Validate rooms
    for room in rooms:
        if 'id' not in room:
            raise ValueError("Room missing 'id' field")
        if 'name' not in room:
            raise ValueError("Room missing 'name' field")
        if 'type' not in room:
            raise ValueError("Room missing 'type' field")
        if room['type'] not in ['classroom', 'lab']:
            raise ValueError("Room type must be 'classroom' or 'lab'")
    
    # Validate fixed slots
    for slot in fixed_slots:
        required_fields = ['classId', 'day', 'period']
        for field in required_fields:
            if field not in slot:
                raise ValueError(f"Fixed slot missing '{field}' field")
    
    logger.info("Input data validation passed")
    return True

def format_solution(timetable: List[Dict]) -> Dict[str, Any]:
    """
    Format the timetable solution for better client consumption
    
    Args:
        timetable: Raw timetable data
    
    Returns:
        Formatted timetable organized by class and day
    """
    formatted = {
        'byClass': {},
        'byTeacher': {},
        'byRoom': {},
        'summary': {
            'totalSlots': len(timetable),
            'fixedSlots': sum(1 for slot in timetable if slot.get('fixed', False)),
            'scheduledSlots': sum(1 for slot in timetable if slot.get('subjectId'))
        }
    }
    
    # Organize by class
    for slot in timetable:
        class_id = slot['classId']
        day = slot['day']
        
        if class_id not in formatted['byClass']:
            formatted['byClass'][class_id] = {}
        
        if day not in formatted['byClass'][class_id]:
            formatted['byClass'][class_id][day] = []
        
        formatted['byClass'][class_id][day].append(slot)
    
    # Organize by teacher
    for slot in timetable:
        if 'teacherId' in slot:
            teacher_id = slot['teacherId']
            if teacher_id not in formatted['byTeacher']:
                formatted['byTeacher'][teacher_id] = []
            formatted['byTeacher'][teacher_id].append(slot)
    
    # Organize by room
    for slot in timetable:
        if 'roomId' in slot:
            room_id = slot['roomId']
            if room_id not in formatted['byRoom']:
                formatted['byRoom'][room_id] = []
            formatted['byRoom'][room_id].append(slot)
    
    return formatted

def calculate_statistics(timetable: List[Dict], classes: List[Dict], 
                        teachers: List[Dict], rooms: List[Dict]) -> Dict[str, Any]:
    """
    Calculate statistics about the generated timetable
    
    Args:
        timetable: Generated timetable
        classes: List of classes
        teachers: List of teachers
        rooms: List of rooms
    
    Returns:
        Statistics dictionary
    """
    stats = {
        'classUsage': {},
        'teacherUsage': {},
        'roomUsage': {},
        'periodUsage': {day: {period: 0 for period in range(8)} for day in range(5)},
        'totalSlots': len(timetable)
    }
    
    # Calculate class usage
    for class_obj in classes:
        class_id = class_obj['id']
        class_slots = [s for s in timetable if s['classId'] == class_id]
        stats['classUsage'][class_id] = len(class_slots)
    
    # Calculate teacher usage
    for teacher in teachers:
        teacher_id = teacher['id']
        teacher_slots = [s for s in timetable if s.get('teacherId') == teacher_id]
        stats['teacherUsage'][teacher_id] = len(teacher_slots)
    
    # Calculate room usage
    for room in rooms:
        room_id = room['id']
        room_slots = [s for s in timetable if s.get('roomId') == room_id]
        stats['roomUsage'][room_id] = len(room_slots)
    
    # Calculate period usage
    for slot in timetable:
        day = slot['day']
        period = slot['period']
        if day in stats['periodUsage'] and period in stats['periodUsage'][day]:
            stats['periodUsage'][day][period] += 1
    
    return stats

def check_conflicts(timetable: List[Dict]) -> List[Dict]:
    """
    Check for conflicts in the generated timetable
    
    Args:
        timetable: Generated timetable
    
    Returns:
        List of conflicts found
    """
    conflicts = []
    
    # Check for teacher double bookings
    teacher_assignments = {}
    for slot in timetable:
        if 'teacherId' in slot and slot['teacherId']:
            key = (slot['teacherId'], slot['day'], slot['period'])
            if key in teacher_assignments:
                conflicts.append({
                    'type': 'teacher_double_booking',
                    'teacherId': slot['teacherId'],
                    'day': slot['day'],
                    'period': slot['period'],
                    'conflictingClasses': [teacher_assignments[key], slot['classId']]
                })
            else:
                teacher_assignments[key] = slot['classId']
    
    # Check for room double bookings
    room_assignments = {}
    for slot in timetable:
        if 'roomId' in slot and slot['roomId']:
            key = (slot['roomId'], slot['day'], slot['period'])
            if key in room_assignments:
                conflicts.append({
                    'type': 'room_double_booking',
                    'roomId': slot['roomId'],
                    'day': slot['day'],
                    'period': slot['period'],
                    'conflictingClasses': [room_assignments[key], slot['classId']]
                })
            else:
                room_assignments[key] = slot['classId']
    
    return conflicts