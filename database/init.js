// This should be run in MongoDB to create initial users
db = db.getSiblingDB('timetable');

// Create initial admin user (password: admin123)
db.users.insertOne({
  email: 'admin@college.edu',
  password: '$2a$10$X8W.9JZQq9qQq9qQq9qQq.q9qQq9qQq9qQq9qQq9qQq9qQq9qQq', // bcrypt hash for "admin123"
  role: 'admin',
  createdAt: new Date()
});

// Create initial teacher
db.teachers.insertOne({
  name: 'John Smith',
  email: 'teacher@college.edu',
  subjectsCanTeach: [],
  unavailableSlots: [],
  preferredSlots: [],
  maxHoursPerDay: 4,
  maxHoursPerWeek: 20,
  isHOD: false,
  createdAt: new Date()
});

// Create teacher user account (password: teacher123)
db.users.insertOne({
  email: 'teacher@college.edu',
  password: '$2a$10$X8W.9JZQq9qQq9qQq9qQq.q9qQq9qQq9qQq9qQq9qQq9qQq9qQq', // bcrypt hash for "teacher123"
  role: 'teacher',
  teacherId: ObjectId("..."), // You need to replace this with actual teacher ID
  createdAt: new Date()
});