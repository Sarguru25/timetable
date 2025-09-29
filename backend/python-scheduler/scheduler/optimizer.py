from ortools.sat.python import cp_model
from collections import defaultdict
import time


class TimetableScheduler:
    def __init__(self, data):
        self.data = data
        self.model = cp_model.CpModel()
        
        # Basic parameters
        self.days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        self.periods = list(range(1, 7))  # 6 periods: 1-6
        
        # Lookup dictionaries
        self.teachers_dict = {t['id']: t for t in data.get('teachers', [])}
        self.subjects_dict = {s['id']: s for s in data.get('subjects', [])}
        self.classes_dict = {c['id']: c for c in data.get('classes', [])}

        # Index mappings
        self.class_ids = [c['id'] for c in data.get('classes', [])]
        self.teacher_ids = [t['id'] for t in data.get('teachers', [])]
        self.subject_ids = [s['id'] for s in data.get('subjects', [])]
        
        # Create reverse mappings
        self.day_to_index = {day: idx for idx, day in enumerate(self.days)}
        self.teacher_to_index = {teacher_id: idx for idx, teacher_id in enumerate(self.teacher_ids)}
        self.subject_to_index = {subject_id: idx for idx, subject_id in enumerate(self.subject_ids)}
        self.class_to_index = {class_id: idx for idx, class_id in enumerate(self.class_ids)}
        
        # Lab subjects
        self.lab_subjects = set()
        for subject in data.get('subjects', []):
            if subject.get('isLab', False):
                self.lab_subjects.add(self.subject_to_index[subject['id']])

    def generate_schedule(self):
        """Generate timetable using the proven CP-SAT approach"""
        start_time = time.time()

        # Create main variables and constraints
        timetable, is_teacher = self._create_variables_and_constraints()
        
        # Solve model
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 30.0
        solver.parameters.num_search_workers = 8

        status = solver.Solve(self.model)
        end_time = time.time()

        if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            schedule = self._extract_solution(solver, timetable)
            return {
                "message": "Schedule generated successfully",
                "schedule": schedule,
                "statistics": self._generate_statistics(solver, schedule, end_time - start_time),
                "status": "optimal" if status == cp_model.OPTIMAL else "feasible"
            }
        else:
            return {
                "message": "Failed to generate feasible schedule",
                "schedule": [],
                "statistics": {"solveTime": end_time - start_time},
                "status": "infeasible"
            }

    def _create_variables_and_constraints(self):
        """Create variables and constraints using the proven approach"""
        num_classes = len(self.class_ids)
        num_days = len(self.days)
        num_periods = len(self.periods)
        num_subjects = len(self.subject_ids)
        num_teachers = len(self.teacher_ids)

        # Main timetable variable: subject index per class/day/period
        timetable = {}
        is_sub = {}
        
        # Create boolean variables for subject assignments
        for class_idx in range(num_classes):
            class_id = self.class_ids[class_idx]
            for day_idx in range(num_days):
                for period_idx in range(num_periods):
                    # Create boolean variables for each possible subject
                    for subject_idx in range(num_subjects):
                        is_sub[(class_idx, day_idx, period_idx, subject_idx)] = self.model.NewBoolVar(
                            f"is_sub_C{class_id}_D{day_idx}_P{period_idx}_S{subject_idx}"
                        )
                    # Exactly one subject per slot
                    self.model.Add(
                        sum(is_sub[(class_idx, day_idx, period_idx, subject_idx)] 
                            for subject_idx in range(num_subjects)) == 1
                    )

        # Add fixed placements constraints
        self._add_fixed_placements(is_sub)

        # Link subject counts per class
        self._add_subject_count_constraints(is_sub)

        # Teacher variables and constraints
        teacher_var, is_teacher = self._add_teacher_constraints(is_sub, num_classes, num_days, num_periods, num_teachers)

        # Add teacher-specific constraints
        self._add_teacher_specific_constraints(is_teacher, teacher_var, num_classes, num_days, num_periods, num_teachers)

        # Add subject sequencing constraints
        self._add_subject_sequencing_constraints(is_sub, num_classes, num_days, num_periods)

        return is_sub, is_teacher

    def _add_fixed_placements(self, is_sub):
        """Add fixed placement constraints"""
        fixed_placements = []
        
        for slot in self.data.get('fixedSlots', []):
            class_id = slot['classId']
            day = slot['day']
            period = slot['period']
            subject_id = slot.get('subjectId')
            teacher_id = slot.get('teacherId')
            
            if subject_id:
                class_idx = self.class_to_index[class_id]
                day_idx = self.day_to_index[day]
                period_idx = period - 1  # Convert to 0-based
                subject_idx = self.subject_to_index[subject_id]
                
                # Add constraint: this slot must have this subject
                self.model.Add(is_sub[(class_idx, day_idx, period_idx, subject_idx)] == 1)
                fixed_placements.append((class_idx, day_idx, period_idx, subject_idx))

    def _add_subject_count_constraints(self, is_sub):
        """Ensure each subject gets required hours per class"""
        num_classes = len(self.class_ids)
        num_days = len(self.days)
        num_periods = len(self.periods)
        
        for class_idx in range(num_classes):
            class_id = self.class_ids[class_idx]
            class_data = self.classes_dict[class_id]
            
            for subject_info in class_data.get('subjects', []):
                subject_id = subject_info['subjectId']
                hours_needed = subject_info.get('hoursPerWeek', 1)
                subject_idx = self.subject_to_index[subject_id]
                
                # Count occurrences of this subject in this class
                occurrences = []
                for day_idx in range(num_days):
                    for period_idx in range(num_periods):
                        occurrences.append(is_sub[(class_idx, day_idx, period_idx, subject_idx)])
                
                # Add constraint: total hours must match requirement
                self.model.Add(sum(occurrences) == hours_needed)

    def _add_teacher_constraints(self, is_sub, num_classes, num_days, num_periods, num_teachers):
        """Add teacher-related variables and constraints"""
        teacher_var = {}
        is_teacher = {}
        
        # Create teacher variables per slot
        for class_idx in range(num_classes):
            class_id = self.class_ids[class_idx]
            for day_idx in range(num_days):
                for period_idx in range(num_periods):
                    # Create integer variable for teacher
                    teacher_var[(class_idx, day_idx, period_idx)] = self.model.NewIntVar(
                        0, num_teachers-1, f"teacher_C{class_id}_D{day_idx}_P{period_idx}"
                    )
                    
                    # Link teacher variable to subject assignment
                    teacher_expr = []
                    for subject_idx in range(len(self.subject_ids)):
                        subject_id = self.subject_ids[subject_idx]
                        # Find teacher for this subject in this class
                        teacher_id = self._get_teacher_for_subject(class_id, subject_id)
                        if teacher_id is not None:
                            teacher_idx = self.teacher_to_index[teacher_id]
                            teacher_expr.append(teacher_idx * is_sub[(class_idx, day_idx, period_idx, subject_idx)])
                    
                    if teacher_expr:
                        self.model.Add(sum(teacher_expr) == teacher_var[(class_idx, day_idx, period_idx)])

        # Create boolean variables for teacher assignments
        for teacher_idx in range(num_teachers):
            teacher_id = self.teacher_ids[teacher_idx]
            for class_idx in range(num_classes):
                class_id = self.class_ids[class_idx]
                for day_idx in range(num_days):
                    for period_idx in range(num_periods):
                        is_teacher[(teacher_idx, class_idx, day_idx, period_idx)] = self.model.NewBoolVar(
                            f"is_teacher_{teacher_id}_C{class_id}_D{day_idx}_P{period_idx}"
                        )
                        # Link: teacher_var == teacher_idx <-> boolean is true
                        self.model.Add(teacher_var[(class_idx, day_idx, period_idx)] == teacher_idx).OnlyEnforceIf(
                            is_teacher[(teacher_idx, class_idx, day_idx, period_idx)]
                        )
                        self.model.Add(teacher_var[(class_idx, day_idx, period_idx)] != teacher_idx).OnlyEnforceIf(
                            is_teacher[(teacher_idx, class_idx, day_idx, period_idx)].Not()
                        )

        return teacher_var, is_teacher

    def _add_teacher_specific_constraints(self, is_teacher, teacher_var, num_classes, num_days, num_periods, num_teachers):
        """Add teacher availability and workload constraints"""
        
        # Teacher max periods per day
        for teacher_idx in range(num_teachers):
            teacher_id = self.teacher_ids[teacher_idx]
            teacher_data = self.teachers_dict[teacher_id]
            max_periods_per_day = teacher_data.get('maxPeriodsPerDay', 4)
            
            for day_idx in range(num_days):
                daily_teaching = []
                for class_idx in range(num_classes):
                    for period_idx in range(num_periods):
                        daily_teaching.append(is_teacher[(teacher_idx, class_idx, day_idx, period_idx)])
                
                self.model.Add(sum(daily_teaching) <= max_periods_per_day)

        # Teacher availability constraints
        for teacher in self.data.get('teachers', []):
            teacher_idx = self.teacher_to_index[teacher['id']]
            for slot in teacher.get('unavailableSlots', []):
                day_idx = self.day_to_index[slot['day']]
                period_idx = slot['period'] - 1
                
                # Teacher cannot teach in this slot
                for class_idx in range(num_classes):
                    self.model.Add(is_teacher[(teacher_idx, class_idx, day_idx, period_idx)] == 0)

        # No consecutive periods for teachers
        for teacher_idx in range(num_teachers):
            for day_idx in range(num_days):
                for period_idx in range(num_periods - 1):
                    current_period = sum(is_teacher[(teacher_idx, c, day_idx, period_idx)] for c in range(num_classes))
                    next_period = sum(is_teacher[(teacher_idx, c, day_idx, period_idx + 1)] for c in range(num_classes))
                    self.model.Add(current_period + next_period <= 1)

    def _add_subject_sequencing_constraints(self, is_sub, num_classes, num_days, num_periods):
        """Add subject sequencing constraints including lab pairs"""
        
        # No consecutive same subject (except labs)
        for class_idx in range(num_classes):
            for day_idx in range(num_days):
                for period_idx in range(num_periods - 1):
                    for subject_idx in range(len(self.subject_ids)):
                        if subject_idx not in self.lab_subjects:
                            # Regular subjects cannot be consecutive
                            self.model.Add(
                                is_sub[(class_idx, day_idx, period_idx, subject_idx)] + 
                                is_sub[(class_idx, day_idx, period_idx + 1, subject_idx)] <= 1
                            )

        # Lab must be scheduled as consecutive pairs
        for class_idx in range(num_classes):
            for day_idx in range(num_days):
                for period_idx in range(num_periods):
                    for subject_idx in self.lab_subjects:
                        lab_present = is_sub[(class_idx, day_idx, period_idx, subject_idx)]
                        
                        # Cannot have lab in last period
                        if period_idx == num_periods - 1:
                            self.model.Add(lab_present == 0)
                        else:
                            # If lab is present, next period must be same lab
                            self.model.Add(
                                is_sub[(class_idx, day_idx, period_idx + 1, subject_idx)] == 1
                            ).OnlyEnforceIf(lab_present)
                        
                        # Prevent three consecutive labs
                        if period_idx > 0 and period_idx < num_periods - 1:
                            self.model.Add(
                                is_sub[(class_idx, day_idx, period_idx - 1, subject_idx)] +
                                is_sub[(class_idx, day_idx, period_idx, subject_idx)] +
                                is_sub[(class_idx, day_idx, period_idx + 1, subject_idx)] <= 2
                            )

    def _get_teacher_for_subject(self, class_id, subject_id):
        """Get teacher assigned to teach a subject in a class"""
        class_data = self.classes_dict[class_id]
        for subject_info in class_data.get('subjects', []):
            if subject_info['subjectId'] == subject_id:
                return subject_info['teacherId']
        return None

    def _extract_solution(self, solver, timetable):
        """Extract the solution from solver"""
        schedule = []
        num_classes = len(self.class_ids)
        num_days = len(self.days)
        num_periods = len(self.periods)
        
        for class_idx in range(num_classes):
            class_id = self.class_ids[class_idx]
            for day_idx in range(num_days):
                day = self.days[day_idx]
                for period_idx in range(num_periods):
                    period = self.periods[period_idx]
                    
                    # Find which subject is assigned to this slot
                    for subject_idx in range(len(self.subject_ids)):
                        if solver.Value(timetable[(class_idx, day_idx, period_idx, subject_idx)]) == 1:
                            subject_id = self.subject_ids[subject_idx]
                            teacher_id = self._get_teacher_for_subject(class_id, subject_id)
                            
                            schedule.append({
                                "classId": class_id,
                                "day": day,
                                "period": period,
                                "subjectId": subject_id,
                                "teacherId": teacher_id
                            })
                            break
        
        return schedule

    def _generate_statistics(self, solver, schedule, solve_time):
        """Generate schedule statistics"""
        total_possible_slots = len(self.days) * len(self.periods) * len(self.class_ids)

        teacher_hours = defaultdict(int)
        class_hours = defaultdict(int)
        subject_hours = defaultdict(int)
        
        for item in schedule:
            teacher_hours[item['teacherId']] += 1
            class_hours[item['classId']] += 1
            subject_hours[item['subjectId']] += 1

        conflicts = self._find_conflicts(schedule)

        return {
            "totalPossibleSlots": total_possible_slots,
            "scheduledSlots": len(schedule),
            "utilizationRate": f"{(len(schedule) / total_possible_slots * 100):.1f}%",
            "teacherWorkload": dict(teacher_hours),
            "classUtilization": dict(class_hours),
            "subjectDistribution": dict(subject_hours),
            "conflicts": len(conflicts),
            "solveTime": f"{solve_time:.2f} seconds",
            "conflictDetails": conflicts
        }

    def _find_conflicts(self, schedule):
        """Detect conflicts in the schedule"""
        conflicts = []

        teacher_slots = defaultdict(set)
        class_slots = defaultdict(set)
        
        for item in schedule:
            # Teacher conflict check
            teacher_key = (item['teacherId'], item['day'], item['period'])
            if teacher_key in teacher_slots:
                conflicts.append({
                    "type": "teacher_double_booking",
                    "teacherId": item['teacherId'],
                    "day": item['day'],
                    "period": item['period'],
                    "message": f"Teacher {item['teacherId']} double-booked at {item['day']} period {item['period']}"
                })
            teacher_slots[teacher_key].add(item['classId'])

            # Class conflict check
            class_key = (item['classId'], item['day'], item['period'])
            if class_key in class_slots:
                conflicts.append({
                    "type": "class_double_booking",
                    "classId": item['classId'],
                    "day": item['day'],
                    "period": item['period'],
                    "message": f"Class {item['classId']} has overlapping subjects at {item['day']} period {item['period']}"
                })
            class_slots[class_key].add(item['subjectId'])

        return conflicts

    def validate_timetable(self, timetable):
        """Validate external timetable"""
        return self._find_conflicts(timetable)

    def optimize_existing(self, timetable):
        """Optimize existing timetable"""
        return sorted(timetable, key=lambda x: (self.days.index(x['day']), x['period']))