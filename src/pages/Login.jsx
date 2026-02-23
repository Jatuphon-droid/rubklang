import { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert('เข้าสู่ระบบไม่สำเร็จ: ' + error.message);
    } else {
      alert('เข้าสู่ระบบสำเร็จ');
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', backgroundColor: '#181818', borderRadius: '12px', border: '1px solid #2e2e2e' }}>
      <h2 style={{ color: '#3ecf8e', textAlign: 'center', marginBottom: '25px' }}>เข้าสู่ระบบ</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input type="email" placeholder="อีเมล" required value={email} onChange={(e) => setEmail(e.target.value)}
               style={{ padding: '12px', backgroundColor: '#121212', color: '#fff', border: '1px solid #333', borderRadius: '6px' }} />
        <input type="password" placeholder="รหัสผ่าน" required value={password} onChange={(e) => setPassword(e.target.value)}
               style={{ padding: '12px', backgroundColor: '#121212', color: '#fff', border: '1px solid #333', borderRadius: '6px' }} />
        <button type="submit" disabled={loading} style={{ padding: '12px', backgroundColor: '#3ecf8e', color: '#121212', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
          {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>
    </div>
  );
}