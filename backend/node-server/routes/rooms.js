const express = require('express');
const { auth, requireAdmin, requireHOD } = require('../middleware/auth');
const Room = require('../models/Room');
const router = express.Router();

// Get all rooms
router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find().sort({ name: 1 });
    res.json({
      success: true,
      rooms
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Server error fetching rooms' });
  }
});

// Create room (Admin only)
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const room = new Room(req.body);
    await room.save();
    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Server error creating room' });
  }
});

module.exports = router;