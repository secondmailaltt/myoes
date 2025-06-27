// File: src/pages/SubjectStudents.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/TSidebar';
import Header  from '../components/THeader';
import axios   from 'axios';

export default function SubjectStudents() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Sidebar toggle state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(o => !o);

  const [subjectName, setSubjectName] = useState('');
  const [subjectSem, setSubjectSem]   = useState(null);
  const [students, setStudents]       = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters]     = useState([]);

  const [bulkDept, setBulkDept]           = useState('');
  const [bulkSem, setBulkSem]             = useState('');
  const [regNo, setRegNo]                 = useState('');
  const [msg, setMsg]                     = useState('');
  const [showPanel, setShowPanel]         = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [searchTerm, setSearchTerm]       = useState('');

  // Fields for editing the subject itself
  const [editName, setEditName]         = useState('');
  const [editSession, setEditSession]   = useState('');
  const [editYear, setEditYear]         = useState('');
  const [editSemester, setEditSemester] = useState('');

  // Helper to append ordinal suffix
  const ordinal = num => {
    const n = parseInt(num, 10);
    if (isNaN(n)) return num;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
    switch (n % 10) {
      case 1: return `${n}st`;
      case 2: return `${n}nd`;
      case 3: return `${n}rd`;
      default: return `${n}th`;
    }
  };

  // Fetch subject metadata
  const fetchSubject = () => {
    axios.get(`/api/subjects/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setSubjectName(res.data.name);
        setSubjectSem(parseInt(res.data.semester, 10));
        setEditName(res.data.name);
        setEditSession(res.data.session);
        setEditYear(res.data.year);
        setEditSemester(res.data.semester);
      })
      .catch(console.error);
  };

  // Fetch enrolled students
  const fetchStudents = () => {
    axios.get(`/api/subjects/${id}/students`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setStudents(res.data.sort((a, b) => a.name.localeCompare(b.name))))
      .catch(console.error);
  };

  // Fetch bulk‐add metadata
  const fetchMetadata = () => {
    axios.get('/api/users/departments', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setDepartments(res.data))
      .catch(console.error);
    axios.get('/api/users/semesters', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setSemesters(res.data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchSubject();
    fetchStudents();
    fetchMetadata();
  }, [id]);

  // Bulk-add students
  const handleBulkAdd = async () => {
    if (!bulkDept || !bulkSem) {
      setMsg('Choose both department and semester');
      return;
    }
    try {
      await axios.post(
        `/api/subjects/${id}/students/bulk`,
        { department: bulkDept, semester: bulkSem },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg('Bulk add succeeded');
      fetchStudents();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Bulk add failed');
    }
  };

  // Single-add by registration number
  const handleSingleAdd = async () => {
    const trimmed = regNo.trim();
    if (!trimmed) {
      setMsg('Enter a registration number');
      return;
    }
    try {
      await axios.post(
        `/api/subjects/${id}/students`,
        { registrationNumber: trimmed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg(`Added ${trimmed}`);
      setRegNo('');
      fetchStudents();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Add failed');
    }
  };

  // Remove student
  const handleRemove = async studentId => {
    try {
      await axios.delete(
        `/api/subjects/${id}/students/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg('Student removed');
      fetchStudents();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Remove failed');
    }
  };

  // Submit subject edits
  const handleEditSubmit = async () => {
    try {
      await axios.put(
        `/api/subjects/${id}`,
        {
          name:     editName,
          session:  editSession.trim().toLowerCase(),
          year:     Number(editYear),
          semester: Number(editSemester)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg('Subject updated');
      setShowEditPanel(false);
      fetchSubject();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Update failed');
    }
  };

  // Delete the subject
  const handleDeleteSubject = async () => {
    if (!window.confirm('Delete this subject?')) return;
    try {
      await axios.delete(`/api/subjects/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      navigate('/studentmanagement');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Delete failed');
    }
  };

  // Split current vs repeater students
  const primaryAll   = students.filter(s => s.semester === subjectSem);
  const repeatersAll = students.filter(s => s.semester !== subjectSem);
  const term = searchTerm.trim().toLowerCase();
  const filterFn = s =>
    s.name.toLowerCase().includes(term) ||
    s.registrationNumber.toLowerCase().includes(term);
  const primary   = primaryAll.filter(filterFn);
  const repeaters = repeatersAll.filter(filterFn);

  return (
    <div className="min-h-screen flex bg-[#f9f9f9] overflow-x-hidden">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col [@media(min-width:845px)]:ml-64">
        <Header toggleSidebar={toggleSidebar} />

        <div className="px-2 md:px-4 lg:px-16 py-4 md:py-8">
          {/* Back button */}
          <button
            onClick={() => navigate('/studentmanagement')}
            className="mb-4 text-sm text-[#002855] hover:underline"
          >
            ← Back to Subjects
          </button>

          {/* Header row: title, edit, add, search */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <h1 className="text-[22px] md:text-4xl font-bold text-[#002855]">
              Students in {subjectName} — {ordinal(subjectSem)} Semester
            </h1>
            <div className="flex gap-2 mt-4 sm:mt-0">
              {/* Edit Subject */}
              <button
                onClick={() => setShowEditPanel(e => !e)}
                className="flex items-center justify-center sm:justify-start gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                <i
                  className={`fa-solid ${showEditPanel ? 'fa-pen-to-square' : 'fa-pen'} text-xl`}
                />
                <span className="hidden sm:inline">
                  {showEditPanel ? 'Cancel Edit' : 'Edit Subject'}
                </span>
              </button>

              {/* Add Students */}
              <button
                onClick={() => setShowPanel(p => !p)}
                className="flex items-center justify-center sm:justify-start gap-2 bg-[#002855] text-white px-4 py-2 rounded hover:bg-[#001f47] transition"
              >
                <i
                  className={`fa-solid ${showPanel ? 'fa-user-minus' : 'fa-user-plus'} text-xl`}
                />
                <span className="hidden sm:inline">
                  {showPanel ? 'Close Panel' : 'Add Students'}
                </span>
              </button>

              <input
                type="text"
                placeholder="Search by name or reg no."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="border px-4 py-2 rounded w-full sm:w-64"
              />
            </div>
          </div>

          {/* Edit Subject Panel */}
          {showEditPanel && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              {msg && <p className="mb-4 text-green-600">{msg}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block mb-1 font-medium">Subject Name</label>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Session</label>
                  <input
                    value={editSession}
                    onChange={e => setEditSession(e.target.value)}
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Year</label>
                  <input
                    type="number"
                    value={editYear}
                    onChange={e => setEditYear(e.target.value)}
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Semester</label>
                  <input
                    type="number"
                    value={editSemester}
                    onChange={e => setEditSemester(e.target.value)}
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleEditSubmit}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleDeleteSubject}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                >
                  <i className="fa-solid fa-trash"></i> Delete Subject
                </button>
              </div>
            </div>
          )}

          {/* Add Students Panel */}
          {showPanel && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              {msg && <p className="mb-4 text-green-600">{msg}</p>}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <label className="block mb-1 font-medium">Department</label>
                  <select
                    value={bulkDept}
                    onChange={e => setBulkDept(e.target.value)}
                    className="w-full border px-3 py-2 rounded"
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map(dep => (
                      <option key={dep} value={dep}>{dep}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block mb-1 font-medium">Semester</label>
                  <select
                    value={bulkSem}
                    onChange={e => setBulkSem(e.target.value)}
                    className="w-full border px-3 py-2 rounded"
                  >
                    <option value="">-- Select Semester --</option>
                    {semesters.map(sem => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleBulkAdd}
                  className="self-end bg-[#002855] text-white px-4 py-2 rounded hover:bg-[#001f47] transition"
                >
                  Add All
                </button>
              </div>
              <hr className="mb-6" />
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block mb-1 font-medium">Registration No.</label>
                  <input
                    value={regNo}
                    onChange={e => setRegNo(e.target.value)}
                    placeholder="e.g. 21pwbcs001"
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
                <button
                  onClick={handleSingleAdd}
                  className="self-end bg-[#002855] text-white px-4 py-2 rounded hover:bg-[#001f47] transition"
                >
                  Add Student
                </button>
              </div>
            </div>
          )}

          {/* Mobile and Desktop student listings unchanged below... */}

          {/* Mobile: Current Semester */}
          <h2 className="px-4 py-2 mb-2 bg-[#002855] text-white rounded-t-xl [@media(min-width:486px)]:hidden">
            Current Semester
          </h2>
          <div className="space-y-4 [@media(min-width:486px)]:hidden">
            {primary.map((s, i) => (
              <div key={s._id} className="bg-white rounded-xl shadow-md p-4 divide-y divide-gray-200">
                <div className="mb-2 text-sm font-semibold text-gray-500">#{i + 1}</div>
                <div className="flex justify-between py-2">
                  <span className="font-semibold text-[#002855]">Reg. No.:</span><span>{s.registrationNumber}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-semibold text-[#002855]">Name:</span><span>{s.name}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-semibold text-[#002855]">Semester:</span><span>{s.semester}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-semibold text-[#002855]">Section:</span><span>{s.section}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-semibold text-[#002855]">Dept:</span><span>{s.department}</span>
                </div>
                <div className="text-right pt-2">
                  <i className="fa-solid fa-trash text-red-600 cursor-pointer" onClick={() => handleRemove(s._id)} />
                </div>
              </div>
            ))}
          </div>

          {/* Mobile: Repeaters */}
          {repeaters.length > 0 && (
            <>
              <h2 className="px-4 py-2 mt-6 mb-2 bg-[#002855] text-white rounded-t-xl [@media(min-width:486px)]:hidden">
                Repeaters
              </h2>
              <div className="space-y-4 [@media(min-width:486px)]:hidden">
                {repeaters.map((s, i) => (
                  <div key={s._id} className="bg-white rounded-xl shadow-md p-4 divide-y divide-gray-200">
                    <div className="mb-2 text-sm font-semibold text-gray-500">#{primary.length + i + 1}</div>
                    <div className="flex justify-between py-2">
                      <span className="font-semibold text-[#002855]">Reg. No.:</span><span>{s.registrationNumber}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="font-semibold text-[#002855]">Name:</span><span>{s.name}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="font-semibold text-[#002855]">Semester:</span><span>{s.semester}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="font-semibold text-[#002855]">Section:</span><span>{s.section}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="font-semibold text-[#002855]">Dept:</span><span>{s.department}</span>
                    </div>
                    <div className="text-right pt-2">
                      <i className="fa-solid fa-trash text-red-600 cursor-pointer" onClick={() => handleRemove(s._id)} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Desktop Tables */}
          <div className="hidden [@media(min-width:486px)]:block bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <h2 className="p-4 bg-gray-100 font-semibold">Current Semester</h2>
            <table className="w-full text-left text-sm">
              <thead className="bg-[#002855] text-white">
                <tr>
                  <th className="p-4">S. No.</th>
                  <th className="p-4">Reg. No.</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Semester</th>
                  <th className="p-4">Section</th>
                  <th className="p-4">Dept.</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {primary.map((s, i) => (
                  <tr key={s._id} className="border-t hover:bg-gray-100">
                    <td className="p-4">{i + 1}</td>
                    <td className="p-4">{s.registrationNumber}</td>
                    <td className="p-4">{s.name}</td>
                    <td className="p-4">{s.semester}</td>
                    <td className="p-4">{s.section}</td>
                    <td className="p-4">{s.department}</td>
                    <td className="p-4">
                      <i className="fa-solid fa-trash text-red-600 cursor-pointer" onClick={() => handleRemove(s._id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {repeaters.length > 0 && (
            <div className="hidden [@media(min-width:486px)]:block bg-white rounded-xl shadow-md overflow-hidden">
              <h2 className="p-4 bg-gray-100 font-semibold">Repeaters</h2>
              <table className="w-full text-left text-sm">
                <thead className="bg-[#002855] text-white">
                  <tr>
                    <th className="p-4">S. No.</th>
                    <th className="p-4">Reg. No.</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Semester</th>
                    <th className="p-4">Section</th>
                    <th className="p-4">Dept.</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {repeaters.map((s, i) => (
                    <tr key={s._id} className="border-t hover:bg-gray-100">
                      <td className="p-4">{primary.length + i + 1}</td>
                      <td className="p-4">{s.registrationNumber}</td>
                      <td className="p-4">{s.name}</td>
                      <td className="p-4">{s.semester}</td>
                      <td className="p-4">{s.section}</td>
                      <td className="p-4">{s.department}</td>
                      <td className="p-4">
                        <i className="fa-solid fa-trash text-red-600 cursor-pointer" onClick={() => handleRemove(s._id)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
