// src/pages/SLogin.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SLogin() {
  const [regno, setRegno]       = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // If already logged in as student, skip this page
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role  = localStorage.getItem('role');
    if (token && role === 'student') {
      navigate('/sdashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regno, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      if (data.role !== 'student') throw new Error('Not a student account');

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);

      navigate('/sdashboard');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat filter blur-[1.5px]"
        style={{ backgroundImage: "url('/bg-image.jpg')" }}
      />

      {/* Login Container */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                      w-[90%] max-w-[550px] h-[530px] rounded-[10px] overflow-hidden
                      shadow-[0_4px_20px_rgba(0,0,0,0.3)] bg-white z-10">
        {/* Top Section */}
        <div className="bg-[#17046d] h-[204px] text-center p-5 text-white relative">
          <h2 className="text-[19px] pt-[10px] mb-[5px]">
            UNIVERSITY OF ENGINEERING AND TECHNOLOGY PESHAWAR
          </h2>
          <h3 className="text-[18px] pt-[7px] mb-3 text-[#bbbbbb]">
            Welcome to Exam Portal
          </h3>
          <div className="absolute -bottom-[81px] left-1/2 transform -translate-x-1/2
                         w-[145px] h-[145px] rounded-full bg-white border flex items-center
                         justify-center overflow-hidden">
            <img src="/LOGO.png" alt="Logo" className="w-[90%] h-auto" />
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="pt-[70px] px-20 pb-[60px] bg-white text-center">
          <div className="mb-2 text-left">
            <label htmlFor="regno" className="block text-[13.5px] font-semibold mb-1">
              Registration Number
            </label>
            <input
              id="regno"
              type="text"
              value={regno}
              onChange={e => setRegno(e.target.value)}
              placeholder="Reg num"
              required
              className="w-full p-2 border-[2px] border-[#ccc] rounded-[5px] text-[13px]"
            />
          </div>
          <div className="mb-5 text-left">
            <label htmlFor="password" className="block text-[13.5px] font-semibold mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full p-2 border-[2px] border-[#ccc] rounded-[5px] text-[13px]"
            />
          </div>
          <button
            type="submit"
            className="w-full p-2 bg-[#0e008f] text-white rounded-[5px] text-[16px]
                       cursor-pointer hover:bg-[#3f29ff]"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
