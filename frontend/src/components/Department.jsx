import React, { useState, useEffect } from "react";
import "./Department.css"; // Import the separate CSS file

// Note: For PDF export bonus, we'll use a simple console log placeholder.
// In a real app, integrate jsPDF or a similar library (e.g., react-pdf or jspdf).
// Example: import jsPDF from 'jspdf'; and implement generation logic in handleExport.
// For DataGrid replacement, we'll use a simple HTML table for staff lists.

// Hardcoded departments data (B.Com specializations + others like BBA, B.Sc)
// Uncomment fetchDepartments() in useEffect when backend is ready
const DEPARTMENTS_DATA = [
  {
    id: 1,
    name: "B.Com Accounting & Finance",
    years: [
      { year: "1st Year", staffs: ["Mr. Ravi", "Ms. Priya"], subjects: 8 },
      { year: "2nd Year", staffs: ["Mr. Kumar", "Ms. Anitha"], subjects: 7 },
      { year: "3rd Year", staffs: ["Dr. Sanjay", "Ms. Kaviya"], subjects: 6 },
    ],
  },
  {
    id: 2,
    name: "B.Com Taxation",
    years: [
      { year: "1st Year", staffs: ["Mr. Arjun", "Ms. Lakshmi"], subjects: 7 },
      { year: "2nd Year", staffs: ["Mr. Vishnu", "Dr. Meera"], subjects: 6 },
      { year: "3rd Year", staffs: ["Ms. Nisha"], subjects: 5 },
    ],
  },
  {
    id: 3,
    name: "B.Com Marketing",
    years: [
      { year: "1st Year", staffs: ["Ms. Pooja", "Mr. Raj"], subjects: 6 },
      { year: "2nd Year", staffs: ["Dr. Amit"], subjects: 5 },
    ],
  },
  {
    id: 4,
    name: "B.Com Human Resource Management (HRM)",
    years: [
      { year: "1st Year", staffs: ["Mr. Deepak", "Ms. Sonia"], subjects: 7 },
      { year: "2nd Year", staffs: ["Ms. Riya"], subjects: 6 },
      { year: "3rd Year", staffs: ["Dr. Karan"], subjects: 5 },
    ],
  },
  {
    id: 5,
    name: "B.Com Banking & Insurance",
    years: [
      { year: "1st Year", staffs: ["Mr. Gopal", "Ms. Tara"], subjects: 8 },
      { year: "2nd Year", staffs: ["Mr. Hari"], subjects: 7 },
    ],
  },
  {
    id: 6,
    name: "B.Com E-Commerce",
    years: [
      { year: "1st Year", staffs: ["Ms. Neha", "Dr. Vikram"], subjects: 6 },
      { year: "2nd Year", staffs: ["Mr. Sameer"], subjects: 5 },
      { year: "3rd Year", staffs: ["Ms. Isha"], subjects: 4 },
    ],
  },
  {
    id: 7,
    name: "B.Com International Business",
    years: [
      { year: "1st Year", staffs: ["Mr. Rohan", "Ms. Aisha"], subjects: 7 },
      { year: "2nd Year", staffs: ["Dr. Fatima"], subjects: 6 },
    ],
  },
  {
    id: 8,
    name: "B.Com Business Analytics",
    years: [
      { year: "1st Year", staffs: ["Ms. Priyanka", "Mr. Omar"], subjects: 8 },
      { year: "2nd Year", staffs: ["Mr. Zain"], subjects: 7 },
      { year: "3rd Year", staffs: ["Dr. Layla"], subjects: 6 },
    ],
  },
  {
    id: 9,
    name: "B.Com Corporate Secretaryship",
    years: [
      { year: "1st Year", staffs: ["Mr. Aryan", "Ms. Sara"], subjects: 6 },
      { year: "2nd Year", staffs: ["Ms. Noor"], subjects: 5 },
    ],
  },
  {
    id: 10,
    name: "B.Com General",
    years: [
      { year: "1st Year", staffs: ["Dr. Ahmed", "Mr. Bilal"], subjects: 7 },
      { year: "2nd Year", staffs: ["Ms. Zara"], subjects: 6 },
      { year: "3rd Year", staffs: ["Mr. Yusuf"], subjects: 5 },
    ],
  },
  {
    id: 11,
    name: "B.Com IT", // From original prompt example
    years: [
      {
        year: "1st Year",
        staffs: ["Mr. Ravi", "Ms. Priya", "Mr. Kumar"],
        subjects: 8,
      },
      { year: "2nd Year", staffs: ["Ms. Anitha", "Mr. Sanjay"], subjects: 7 },
    ],
  },
  {
    id: 12,
    name: "BBA", // Business Administration
    years: [
      { year: "1st Year", staffs: ["Dr. Elena", "Mr. Marco"], subjects: 6 },
      { year: "2nd Year", staffs: ["Ms. Sofia"], subjects: 5 },
      { year: "3rd Year", staffs: ["Mr. Luca"], subjects: 4 },
    ],
  },
  {
    id: 13,
    name: "B.Sc CS", // From original prompt example
    years: [
      { year: "1st Year", staffs: ["Mr. Arjun", "Ms. Kaviya"], subjects: 6 },
    ],
  },
  {
    id: 14,
    name: "B.Sc Mathematics", // Additional Science example
    years: [
      { year: "1st Year", staffs: ["Dr. Nina", "Mr. Theo"], subjects: 5 },
      { year: "2nd Year", staffs: ["Ms. Clara"], subjects: 4 },
      { year: "3rd Year", staffs: ["Mr. Elias"], subjects: 5 },
    ],
  },
];

const Department = () => {
  const [selectedDept, setSelectedDept] = useState(null);
  const [filteredDepts, setFilteredDepts] = useState(DEPARTMENTS_DATA); // Initialize with full list
  const [searchTerm, setSearchTerm] = useState("");

  // useEffect(() => {
  //   fetchDepartments();
  // }, []);

  // const fetchDepartments = async () => {
  //   try {
  //     // setLoading(true); // Uncomment when using loading
  //     const response = await fetch('/api/departments');
  //     if (!response.ok) {
  //       throw new Error('Failed to fetch departments');
  //     }
  //     const data = await response.json();
  //     setDepartments(data); // Uncomment and use useState for departments when fetching
  //     setFilteredDepts(data);
  //   } catch (error) {
  //     console.error('Error fetching departments:', error);
  //   } finally {
  //     // setLoading(false); // Uncomment when using loading
  //   }
  // };

  useEffect(() => {
    const filtered = DEPARTMENTS_DATA.filter((dept) =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDepts(filtered);
  }, [searchTerm]);

  const handleDeptClick = (dept) => {
    setSelectedDept(dept);
  };

  const handleExport = () => {
    if (!selectedDept) return;
    console.log("Exporting department details to PDF:", selectedDept);
    // Add jsPDF logic here if needed
  };

  // No loading state needed for hardcoded data
  // if (loading) {
  //   return (
  //     <div className="loading-container">
  //       <h3>Loading departments...</h3>
  //     </div>
  //   );
  // }

  // Flatten all staffs from all years for the selected department
  const getAllStaffs = (dept) => {
    if (!dept || !dept.years) return [];
    return dept.years.flatMap((year) => year.staffs);
  };

  const allStaffs = selectedDept ? getAllStaffs(selectedDept) : [];

  return (
    <div className="department-container">
      <div className="panel-wrapper">
        {/* Left Panel: Department List */}
        <div className="left-panel">
          <div className="panel-header">
            <h3>Departments</h3>
            <input
              type="text"
              placeholder="Search Departments"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="department-list">
            {filteredDepts.length === 0 ? (
              <p className="no-results">No departments found.</p>
            ) : (
              filteredDepts.map((dept) => (
                <div
                  key={dept.id}
                  className={`department-card ${
                    selectedDept?.id === dept.id ? "selected" : ""
                  }`}
                  onClick={() => handleDeptClick(dept)}
                >
                  <h4>{dept.name}</h4>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Department Details */}
        <div className="right-panel">
          {selectedDept ? (
            <div className="details-panel">
              <div className="details-header">
                <h2>Department: {selectedDept.name}</h2>
                <button onClick={handleExport} className="export-btn">
                  Export to PDF
                </button>
              </div>

              {/* Single Staff List Section (no year breakdown) */}
              <div className="staff-card">
                <div className="staff-header">
                  <h3>Staff List</h3>
                  <p>Total Staff: {allStaffs.length}</p>
                </div>
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>Staff Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allStaffs.length === 0 ? (
                      <tr>
                        <td style={{ textAlign: "center", color: "#999" }}>
                          No staff available.
                        </td>
                      </tr>
                    ) : (
                      allStaffs.map((staff, staffIndex) => (
                        <tr key={staffIndex}>
                          <td>{staff}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="placeholder-panel">
              <h3>Select a department from the left panel to view details.</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Department;