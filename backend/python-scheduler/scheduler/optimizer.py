from ortools.sat.python import cp_model
from collections import defaultdict
import time


class TimetableScheduler:
    def __init__(self, data):
        self.data = data
        self.days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        self.periods = list(range(1, 7))  # 6 periods: 1-6
        self.model = cp_model.CpModel()

        # Lookup dictionaries
        self.teachers_dict = {t['id']: t for t in data.get('teachers', [])}
        self.subjects_dict = {s['id']: s for s in data.get('subjects', [])}
        self.classes_dict = {c['id']: c for c in data.get('classes', [])}

        # Sets for easy access
        self.class_ids = [c['id'] for c in data.get('classes', [])]
        self.teacher_ids = [t['id'] for t in data.get('teachers', [])]
        self.subject_ids = [s['id'] for s in data.get('subjects', [])]

    def generate_schedule(self):
        """Generate timetable using OR-Tools CP-SAT"""
        start_time = time.time()

        assignments = self._create_variables()
        self._add_constraints(assignments)
        self._add_objective(assignments)

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 30.0
        solver.parameters.num_search_workers = 8

        status = solver.Solve(self.model)
        end_time = time.time()

        if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            schedule = self._extract_solution(solver, assignments)
            return {
                "message": "Schedule generated successfully",
                "schedule": schedule,
                "statistics": self._generate_statistics(schedule, end_time - start_time),
                "status": "optimal" if status == cp_model.OPTIMAL else "feasible"
            }
        else:
            return {
                "message": "Failed to generate feasible schedule",
                "schedule": [],
                "statistics": {"solveTime": end_time - start_time},
                "status": "infeasible"
            }

    def _create_variables(self):
        """Create decision variables"""
        assignments = {}

        for class_data in self.data.get('classes', []):
            class_id = class_data['id']

            for subject_info in class_data.get('subjects', []):
                subject_id = subject_info['subjectId']
                teacher_id = subject_info['teacherId']
                hours_needed = subject_info.get('hoursPerWeek', 1)

                for hour_index in range(hours_needed):
                    var_name = f'c{class_id}_s{subject_id}_t{teacher_id}_h{hour_index}'
                    assignments[(class_id, subject_id, teacher_id, hour_index)] = {
                        'day': self.model.NewIntVar(0, len(self.days) - 1, f'{var_name}_day'),
                        'period': self.model.NewIntVar(1, len(self.periods), f'{var_name}_period'),
                        'scheduled': self.model.NewBoolVar(f'{var_name}_scheduled')
                    }

        return assignments

    def _add_constraints(self, assignments):
        """Add all constraints"""
        self._add_teacher_constraints(assignments)
        self._add_class_constraints(assignments)
        self._add_subject_constraints(assignments)
        self._add_availability_constraints(assignments)
        self._add_fixed_slot_constraints(assignments)

    def _add_teacher_constraints(self, assignments):
        """Ensure teachers are not double-booked"""
        teacher_assignments = defaultdict(list)

        for (class_id, subject_id, teacher_id, hour_index), var in assignments.items():
            teacher_assignments[teacher_id].append(var)

        for teacher_id, teacher_vars in teacher_assignments.items():
            for i, var1 in enumerate(teacher_vars):
                for j, var2 in enumerate(teacher_vars):
                    if i < j:
                        diff_day = self.model.NewBoolVar(f"diff_day_t{teacher_id}_{i}_{j}")
                        diff_period = self.model.NewBoolVar(f"diff_period_t{teacher_id}_{i}_{j}")

                        self.model.Add(var1['day'] != var2['day']).OnlyEnforceIf(diff_day)
                        self.model.Add(var1['day'] == var2['day']).OnlyEnforceIf(diff_day.Not())

                        self.model.Add(var1['period'] != var2['period']).OnlyEnforceIf(diff_period)
                        self.model.Add(var1['period'] == var2['period']).OnlyEnforceIf(diff_period.Not())

                        self.model.AddBoolOr([diff_day, diff_period]).OnlyEnforceIf(
                            [var1['scheduled'], var2['scheduled']]
                        )

    def _add_class_constraints(self, assignments):
        """Ensure classes don't have overlapping subjects"""
        class_assignments = defaultdict(list)

        for (class_id, subject_id, teacher_id, hour_index), var in assignments.items():
            class_assignments[class_id].append(var)

        for class_id, class_vars in class_assignments.items():
            for i, var1 in enumerate(class_vars):
                for j, var2 in enumerate(class_vars):
                    if i < j:
                        diff_day = self.model.NewBoolVar(f"diff_day_c{class_id}_{i}_{j}")
                        diff_period = self.model.NewBoolVar(f"diff_period_c{class_id}_{i}_{j}")

                        self.model.Add(var1['day'] != var2['day']).OnlyEnforceIf(diff_day)
                        self.model.Add(var1['day'] == var2['day']).OnlyEnforceIf(diff_day.Not())

                        self.model.Add(var1['period'] != var2['period']).OnlyEnforceIf(diff_period)
                        self.model.Add(var1['period'] == var2['period']).OnlyEnforceIf(diff_period.Not())

                        self.model.AddBoolOr([diff_day, diff_period]).OnlyEnforceIf(
                            [var1['scheduled'], var2['scheduled']]
                        )

    def _add_subject_constraints(self, assignments):
        """Ensure subjects get their required hours"""
        subject_hours = defaultdict(int)
        subject_assignments = defaultdict(list)

        for class_data in self.data.get('classes', []):
            for subject_info in class_data.get('subjects', []):
                subject_id = subject_info['subjectId']
                subject_hours[subject_id] += subject_info.get('hoursPerWeek', 1)

        for (class_id, subject_id, teacher_id, hour_index), var in assignments.items():
            subject_assignments[subject_id].append(var['scheduled'])

        for subject_id, required_hours in subject_hours.items():
            if subject_id in subject_assignments:
                self.model.Add(sum(subject_assignments[subject_id]) == required_hours)

    def _add_availability_constraints(self, assignments):
        """Respect teacher availability"""
        for teacher in self.data.get('teachers', []):
            teacher_id = teacher['id']
            unavailable_slots = teacher.get('unavailableSlots', [])

            for slot in unavailable_slots:
                day_index = slot.get('day', 0)
                period = slot.get('period', 1)

                for (class_id, subject_id, t_id, hour_index), var in assignments.items():
                    if t_id == teacher_id:
                        not_day = self.model.NewBoolVar(f"not_day_t{teacher_id}_{class_id}_{hour_index}")
                        not_period = self.model.NewBoolVar(f"not_period_t{teacher_id}_{class_id}_{hour_index}")

                        self.model.Add(var['day'] != day_index).OnlyEnforceIf(not_day)
                        self.model.Add(var['day'] == day_index).OnlyEnforceIf(not_day.Not())

                        self.model.Add(var['period'] != period).OnlyEnforceIf(not_period)
                        self.model.Add(var['period'] == period).OnlyEnforceIf(not_period.Not())

                        self.model.AddBoolOr([not_day, not_period]).OnlyEnforceIf(var['scheduled'])

    def _add_fixed_slot_constraints(self, assignments):
        """Respect fixed timetable slots"""
        fixed_slots = self.data.get('fixedSlots', [])

        for slot in fixed_slots:
            class_id = slot['classId']
            day = slot['day']
            period = slot['period']
            subject_id = slot.get('subjectId')
            teacher_id = slot.get('teacherId')

            day_index = self.days.index(day) if day in self.days else 0

            for (c_id, s_id, t_id, hour_index), var in assignments.items():
                if (c_id == class_id and
                        (subject_id is None or s_id == subject_id) and
                        (teacher_id is None or t_id == teacher_id)):
                    self.model.Add(var['day'] == day_index)
                    self.model.Add(var['period'] == period)
                    self.model.Add(var['scheduled'] == 1)

    def _add_objective(self, assignments):
        """Define optimization objective"""
        objectives = []

        teacher_hours = defaultdict(list)
        for (class_id, subject_id, teacher_id, hour_index), var in assignments.items():
            teacher_hours[teacher_id].append(var['scheduled'])

        for teacher_id, hours_vars in teacher_hours.items():
            total_hours = sum(hours_vars)
            max_hours = self.teachers_dict.get(teacher_id, {}).get('maxHoursPerWeek', 25)
            overload = self.model.NewIntVar(0, 100, f'overload_{teacher_id}')
            self.model.Add(overload >= total_hours - max_hours)
            objectives.append(overload)

        for var in assignments.values():
            objectives.append(var['period'])

        self.model.Minimize(sum(objectives))

    def _extract_solution(self, solver, assignments):
        """Extract solver results"""
        schedule = []

        for (class_id, subject_id, teacher_id, hour_index), var in assignments.items():
            if solver.Value(var['scheduled']) == 1:
                day_index = solver.Value(var['day'])
                period = solver.Value(var['period'])

                schedule.append({
                    "classId": class_id,
                    "day": self.days[day_index],
                    "period": period,
                    "subjectId": subject_id,
                    "teacherId": teacher_id
                })

        return schedule

    def _generate_statistics(self, schedule, solve_time):
        """Generate schedule statistics"""
        total_possible_slots = len(self.days) * len(self.periods) * len(self.class_ids)

        teacher_hours = defaultdict(int)
        for item in schedule:
            teacher_hours[item['teacherId']] += 1

        class_hours = defaultdict(int)
        for item in schedule:
            class_hours[item['classId']] += 1

        conflicts = self._find_conflicts(schedule)

        return {
            "totalPossibleSlots": total_possible_slots,
            "scheduledSlots": len(schedule),
            "utilizationRate": f"{(len(schedule) / total_possible_slots * 100):.1f}%",
            "teacherWorkload": dict(teacher_hours),
            "classUtilization": dict(class_hours),
            "conflicts": len(conflicts),
            "solveTime": f"{solve_time:.2f} seconds",
            "conflictDetails": conflicts
        }

    def _find_conflicts(self, schedule):
        """Detect conflicts"""
        conflicts = []

        teacher_slots = defaultdict(set)
        for item in schedule:
            key = (item['teacherId'], item['day'], item['period'])
            if key in teacher_slots:
                conflicts.append({
                    "type": "teacher_double_booking",
                    "teacherId": item['teacherId'],
                    "day": item['day'],
                    "period": item['period'],
                    "message": f"Teacher {item['teacherId']} double-booked"
                })
            teacher_slots[key].add(item['classId'])

        class_slots = defaultdict(set)
        for item in schedule:
            key = (item['classId'], item['day'], item['period'])
            if key in class_slots:
                conflicts.append({
                    "type": "class_double_booking",
                    "classId": item['classId'],
                    "day": item['day'],
                    "period": item['period'],
                    "message": f"Class {item['classId']} has overlapping subjects"
                })
            class_slots[key].add(item['subjectId'])

        return conflicts

    def validate_timetable(self, timetable):
        """Validate external timetable"""
        return self._find_conflicts(timetable)

    def optimize_existing(self, timetable):
        """Optimize existing timetable (sort by day, then period)"""
        return sorted(timetable, key=lambda x: (self.days.index(x['day']), x['period']))
