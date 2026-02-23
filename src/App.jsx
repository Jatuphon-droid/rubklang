import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// --- นำเข้าหน้าเว็บต่างๆ ---
import Home from './pages/Home';
import CreateDeal from './pages/CreateDeal';
import DealDetail from './pages/DealDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile'; 
import EditProfile from './pages/EditProfile';
import AdminDashboard from './pages/AdminDashboard'; 

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ 
        fontFamily: "'Prompt', sans-serif", 
        backgroundColor: '#f9fafb', 
        minHeight: '100vh',
        width: '100vw',
        overflowX: 'hidden'
      }}>
        
        {/* Navigation Bar (โฉมใหม่ ซ่อนระบบสมาชิก) */}
        <nav style={{ 
          backgroundColor: '#ffffff', 
          padding: '15px 40px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          borderBottom: '1px solid #e5e7eb',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <h1 style={{ color: '#3ecf8e', margin: 0, fontSize: '24px', fontWeight: '800' }}>Rub-Klang<span style={{color: '#111'}}>.com</span></h1>
          </Link>
          
          <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
            <Link to="/" style={{ textDecoration: 'none', color: '#4b5563', fontWeight: '500' }}>หน้าหลัก</Link>
            <Link to="/create-deal" style={{ 
              textDecoration: 'none', 
              backgroundColor: '#111', 
              color: '#fff', 
              padding: '8px 20px', 
              borderRadius: '6px', 
              fontWeight: 'bold'
            }}>สร้างดีลรับกลาง</Link>
          </div>
        </nav>

        {/* เนื้อหาหลัก */}
        <div style={{ width: '100%', margin: '0', padding: '0' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create-deal" element={<CreateDeal />} />
            <Route path="/deal/:id" element={<DealDetail />} />
            
            {/* ซ่อน Route ของระบบสมาชิกไว้หลังบ้าน เผื่อแอดมินใช้งาน */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} /> 
            <Route path="/edit-profile" element={<EditProfile />} />
          </Routes>
        </div>

      </div>
    </BrowserRouter>
  );
}