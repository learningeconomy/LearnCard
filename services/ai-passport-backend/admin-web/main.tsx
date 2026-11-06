import React from 'react';
import { createRoot } from 'react-dom/client';
import AdminDashboard from './AdminDashboard';
import './style.css';
createRoot(document.getElementById('admin-root')!).render(<AdminDashboard />);
