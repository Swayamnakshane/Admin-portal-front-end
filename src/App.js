// App.js
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './registeration/login';
import { Register } from './registeration/register';

import Dashboard from './dashboard';

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,   // ✅ Removes "startTransition" warning
        v7_relativeSplatPath: true, // ✅ Removes "relativeSplatPath" warning
      }}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        
        
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
