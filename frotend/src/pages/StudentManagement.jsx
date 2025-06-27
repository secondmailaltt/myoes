// File: src/pages/StudentManagement.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/TSidebar';
import Header from '../components/THeader';
import axios from 'axios';

export default function StudentManagement() {
  const navigate = useNavigate();

  // ← Sidebar toggle state added
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(o => !o);

  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState('');

  const capitalize = str =>
    !str ? '' : str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  const ordinal = val => {
    const num = parseInt(val, 10);
    if (isNaN(num)) return val;
    const mod100 = num % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${num}th`;
    switch (num % 10) {
      case 1: return `${num}st`;
      case 2: return `${num}nd`;
      case 3: return `${num}rd`;
      default: return `${num}th`;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to view subjects.');
      return;
    }

    axios
      .get('/api/subjects', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setSubjects(res.data))
      .catch(err => {
        console.error(err);
        setError(err.response?.data?.message || 'Error fetching subjects');
      });
  }, []);

  const groups = subjects.reduce((acc, sub) => {
    const year = sub.year;
    const sessionNorm = sub.session.trim().toLowerCase();
    const key = year != null
      ? `${year}—${sessionNorm}`
      : `—${sessionNorm}`;
    if (!acc[key]) {
      acc[key] = {
        year,
        session: sessionNorm,
        items: []
      };
    }
    acc[key].items.push(sub);
    return acc;
  }, {});

  const sortedGroups = Object.values(groups).sort((a, b) => {
    if (a.year == null && b.year != null) return 1;
    if (b.year == null && a.year != null) return -1;
    if (a.year != null && b.year != null && a.year !== b.year) {
      return b.year - a.year;
    }
    return a.session.localeCompare(b.session);
  });

  return (
    <div className="min-h-screen flex bg-[#f9f9f9] overflow-x-hidden">
      {/* Pass real state & toggle */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col [@media(min-width:845px)]:ml-64">
        <Header toggleSidebar={toggleSidebar} />

        <div className="px-4 md:px-16 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold text-[#002855]">
              Student Management
            </h1>
            <button
              onClick={() => navigate('/add-subject')}
              className="bg-[#002855] text-white px-4 py-2 rounded shadow-sm hover:shadow-md hover:bg-[#001f47] transition"
            >
              + Add Subject
            </button>
          </div>

          {error && <p className="text-red-600 mb-4">{error}</p>}

          {sortedGroups.map(({ year, session, items }) => (
            <div key={`${year ?? 'noYear'}—${session}`} className="mb-8">
              <h2 className="text-2xl font-semibold text-[#002855] mb-4">
                {year != null
                  ? `${year} — ${capitalize(session)}`
                  : capitalize(session)}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {items.map(sub => (
                  <div
                    key={sub._id}
                    className="bg-white rounded-xl shadow-md p-4 cursor-pointer hover:shadow-lg transition"
                    onClick={() =>
                      navigate(`/subjects/${sub._id}/students`)
                    }
                  >
                    <h3 className="text-xl font-semibold mb-2">
                      {capitalize(sub.name)} — {ordinal(sub.semester)} Semester
                    </h3>
                    <p className="text-gray-600">
                      {Array.isArray(sub.students)
                        ? `${sub.students.length} students`
                        : '0 students'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {!sortedGroups.length && !error && (
            <p className="text-gray-500">
              No subjects yet. Click “+ Add Subject” to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
