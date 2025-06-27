// src/components/SHeader.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function SHeader({ toggleSidebar }) {
  const [user, setUser] = useState({ name: '', email: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/slogin');
    (async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const { user } = await res.json();
        if (user.role !== 'student') throw new Error();
        setUser({ name: user.name, email: user.email });
      } catch {
        localStorage.clear();
        navigate('/slogin');
      }
    })();
  }, [navigate]);

  return (
    <div className="w-full bg-[#B0C4DE] h-[80px] flex items-center px-4 shadow-sm">
      {/* Hamburger for <845px */}
      <button
        className="mr-4 [@media(min-width:845px)]:hidden"
        onClick={toggleSidebar}
      >
        <i className="fa-solid fa-bars text-2xl"></i>
      </button>

      <div className="flex-1" />

      <div className="text-right">
        <h4 className="font-semibold text-lg">
          {user.name || 'Loading...'}
        </h4>
        <p className="text-sm [@media(max-width:485px)]:text-[10px] text-gray-600">
          {user.email || ''}
        </p>
      </div>
      <Link to="/student-profile">
        <img
          src="/profile.png"
          alt="Profile"
          className="w-12 h-12 rounded-full ml-4"
        />
      </Link>
    </div>
  );
}
