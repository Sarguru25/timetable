const express = require('express');
const { auth, requireAdmin } = require('../middleware/auth');
const Department = require('../models/Department');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const router = express.Router();

// Get all departments
router.get('/', auth, async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('hod', 'name email')
      .sort({ name: 1 });

    res.json({
      success: true,
      departments
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ message: 'Server error fetching departments' });
  }
});

// Create department (Admin only)
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const { name, code, hod, description } = req.body;

    const department = new Department({
      name,
      code,
      hod,
      description
    });

    await department.save();
    
    // If HOD is assigned, update teacher record
    if (hod) {
      await Teacher.findByIdAndUpdate(hod, { isHOD: true });
    }

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Department with this name or code already exists' });
    }
    console.error('Create department error:', error);
    res.status(500).json({ message: 'Server error creating department' });
  }
});

// Update department (Admin only)
router.put('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { name, code, hod, description } = req.body;

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, code, hod, description },
      { new: true, runValidators: true }
    ).populate('hod', 'name email');

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json({
      success: true,
      message: 'Department updated successfully',
      department
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ message: 'Server error updating department' });
  }
});

// Get department statistics
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const departmentId = req.params.id;
    
    const teacherCount = await Teacher.countDocuments({ 
      department: departmentId, 
      isActive: true 
    });
    
    const studentCount = await Student.countDocuments({ 
      department: departmentId, 
      isActive: true 
    });

    res.json({
      success: true,
      stats: {
        teacherCount,
        studentCount
      }
    });
  } catch (error) {
    console.error('Get department stats error:', error);
    res.status(500).json({ message: 'Server error fetching department statistics' });
  }
});

module.exports = router;