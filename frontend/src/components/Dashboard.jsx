import React, { useState } from 'react';
import './Dashboard.css';

const Dashboard = ({ setActiveView, user }) => {
  const [activeTab, setActiveTab] = useState('scheduling');
  
  // Cards organized by category
  const cardCategories = {
    scheduling: [
      {
        id: 1,
        title: 'View Timetable',
        description: 'Check the current timetable for classes or teachers',
        icon: '📅',
        action: () => setActiveView('timetable'),
        color: '#4caf50'
      },
      {
        id: 2,
        title: 'Manual Scheduling',
        description: 'Manually assign subjects to specific time slots',
        icon: '✏️',
        action: () => setActiveView('manual'),
        color: '#ff9800'
      },
      {
        id: 3,
        title: 'Generate Schedule',
        description: 'Automatically generate a new timetable',
        icon: '🔄',
        action: () => setActiveView('generate'),
        color: '#2196f3'
      }
    ],
    management: [
      {
        id: 4,
        title: 'Manage Classes',
        description: 'Add, edit or remove classes',
        icon: '🏫',
        action: () => setActiveView('classes'),
        color: '#9c27b0'
      },
      {
        id: 5,
        title: 'Manage Teachers',
        description: 'Add, edit or remove teachers',
        icon: '👨‍🏫',
        action: () => setActiveView('teachers'),
        color: '#f44336'
      },
      {
        id: 6,
        title: 'Manage Subjects',
        description: 'Add, edit or remove subjects',
        icon: '📚',
        action: () => setActiveView('subjects'),
        color: '#607d8b'
      }
    ],
    reports: [
      {
        id: 7,
        title: 'Schedule Reports',
        description: 'View and export timetable reports',
        icon: '📊',
        action: () => setActiveView('reports'),
        color: '#009688'
      },
      {
        id: 8,
        title: 'Conflict Analysis',
        description: 'Identify and resolve scheduling conflicts',
        icon: '⚠️',
        action: () => setActiveView('conflicts'),
        color: '#ff5722'
      },
      {
        id: 9,
        title: 'Room Utilization',
        description: 'View room usage statistics and optimization',
        icon: '🏢',
        action: () => setActiveView('rooms'),
        color: '#795548'
      }
    ]
  };

  // Stats for the dashboard header
  const stats = [
    { label: 'Total Classes', value: '24', change: '+2' },
    { label: 'Active Teachers', value: '38', change: '+1' },
    { label: 'Scheduled Hours', value: '286', change: '+14' },
    { label: 'Available Rooms', value: '18', change: '0' }
  ];

  return (
    <div className="dashboard">
      {/* <header className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {user?.name || 'User'}!</h1>
          <p>Here's what's happening with your timetable today.</p>
        </div>
        <div className="stats-section">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-change">{stat.change}</div>
            </div>
          ))}
        </div>
      </header> */}

      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'scheduling' ? 'tab-active' : ''}
          onClick={() => setActiveTab('scheduling')}
        >
          Scheduling
        </button>
        <button 
          className={activeTab === 'management' ? 'tab-active' : ''}
          onClick={() => setActiveTab('management')}
        >
          Management
        </button>
        <button 
          className={activeTab === 'reports' ? 'tab-active' : ''}
          onClick={() => setActiveTab('reports')}
        >
          Reports & Analytics
        </button>
      </div>

      <div className="dashboard-content">
        <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
        <div className="dashboard-grid">
          {cardCategories[activeTab].map(card => (
            <div 
              key={card.id} 
              className="dashboard-card"
              onClick={card.action}
              style={{ '--card-color': card.color }}
            >
              <div className="card-icon" style={{ backgroundColor: card.color }}>
                {card.icon}
              </div>
              <div className="card-content">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
              <div className="card-arrow">→</div>
            </div>
          ))}
        </div>
      </div>

      {/* <div className="recent-activity">
        <h3>Recent Activity</h3>
        <ul>
          <li>
            <span className="activity-icon">📅</span>
            <div className="activity-details">
              <p>Math class moved to Room 102 at 10:00 AM</p>
              <span className="activity-time">2 hours ago</span>
            </div>
          </li>
          <li>
            <span className="activity-icon">👨‍🏫</span>
            <div className="activity-details">
              <p>Dr. Smith added a new unavailable timeslot</p>
              <span className="activity-time">5 hours ago</span>
            </div>
          </li>
          <li>
            <span className="activity-icon">✅</span>
            <div className="activity-details">
              <p>Schedule generated successfully for next week</p>
              <span className="activity-time">Yesterday</span>
            </div>
          </li>
        </ul>
      </div> */}
    </div>
  );
};

export default Dashboard;