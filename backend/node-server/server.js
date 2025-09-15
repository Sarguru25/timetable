const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth.js'));
app.use('/api/subjects', require('./routes/subjects.js'));
app.use('/api/teachers', require('./routes/teachers.js'));
app.use('/api/classes', require('./routes/classes.js'));
app.use('/api/rooms', require('./routes/rooms.js'));
app.use('/api/timetable', require('./routes/timetable.js'));
app.use('/api/schedule', require('./routes/schedule.js'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));