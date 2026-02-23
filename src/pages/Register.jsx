import { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  // ข้อมูลพื้นฐาน
  const [role, setRole] = useState('buyer'); 
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // ข้อมูลบัญชีรับเงิน (สำหรับผู้ขายและคนกลาง)
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    const needsBankInfo = role === 'middleman' || role === 'seller';

    // ตรวจสอบข้อมูลบัญชีธนาคารสำหรับผู้ที่ต้องรับเงิน
    if (needsBankInfo && (!bankName || !bankAccount || !bankAccountName)) {
      alert('กรุณากรอกข้อมูลบัญชีธนาคารให้ครบถ้วนเพื่อใช้ในการรับเงิน');
      setLoading(false);
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
      alert('สมัครสมาชิกไม่สำเร็จ: ' + authError.message);
    } else if (authData.user) {
      // บันทึกข้อมูลลง profiles ตามประเภทที่เลือก
      const profileData = { 
        id: authData.user.id, 
        username: username, 
        role: role,
        phone: phone,
        bank_name: needsBankInfo ? bankName : null,
        bank_account: needsBankInfo ? bankAccount : null,
        bank_account_name: needsBankInfo ? bankAccountName : null
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([profileData]);

      if (profileError) {
        alert('สร้างโปรไฟล์ไม่สำเร็จ: ' + profileError.message);
      } else {
        alert('สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ');
        navigate('/login');
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ 
      width: '95%', 
      maxWidth: '500px', 
      margin: '40px auto', 
      padding: '30px', 
      backgroundColor: '#ffffff', 
      borderRadius: '16px', 
      boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
      border: '1px solid #e5e7eb'
    }}>
      <h2 style={{ color: '#111', textAlign: 'center', marginBottom: '30px', fontWeight: '800' }}>สร้างบัญชีผู้ใช้งานใหม่</h2>
      
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* 1. เลือกประเภทบัญชี */}
        <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #eee' }}>
          <span style={{ color: '#111', fontSize: '15px', fontWeight: 'bold', display: 'block', marginBottom: '15px' }}>เลือกประเภทบัญชีที่ต้องการสมัคร:</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#333', fontSize: '15px', padding: '10px', backgroundColor: role === 'buyer' ? '#f0fdf4' : '#fff', border: role === 'buyer' ? '1px solid #3ecf8e' : '1px solid #ddd', borderRadius: '8px' }}>
              <input type="radio" value="buyer" checked={role === 'buyer'} onChange={() => setRole('buyer')} style={{ accentColor: '#3ecf8e', width: '18px', height: '18px' }} /> 
              <strong>ผู้ซื้อ</strong> (สำหรับผู้ที่ต้องการซื้อสินค้าอย่างปลอดภัย)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#333', fontSize: '15px', padding: '10px', backgroundColor: role === 'seller' ? '#f0fdf4' : '#fff', border: role === 'seller' ? '1px solid #3ecf8e' : '1px solid #ddd', borderRadius: '8px' }}>
              <input type="radio" value="seller" checked={role === 'seller'} onChange={() => setRole('seller')} style={{ accentColor: '#3ecf8e', width: '18px', height: '18px' }} /> 
              <strong>ผู้ขาย</strong> (สำหรับผู้ที่ต้องการขายสินค้าและรับเงินชัวร์)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#333', fontSize: '15px', padding: '10px', backgroundColor: role === 'middleman' ? '#f0fdf4' : '#fff', border: role === 'middleman' ? '1px solid #3ecf8e' : '1px solid #ddd', borderRadius: '8px' }}>
              <input type="radio" value="middleman" checked={role === 'middleman'} onChange={() => setRole('middleman')} style={{ accentColor: '#3ecf8e', width: '18px', height: '18px' }} /> 
              <strong>คนกลาง</strong> (สำหรับผู้ที่ต้องการรับดูแลธุรกรรมและรับส่วนแบ่ง)
            </label>
          </div>
        </div>

        {/* 2. ข้อมูลพื้นฐาน */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>ชื่อผู้ใช้งาน (แสดงต่อสาธารณะ)</label>
          <input type="text" placeholder="ระบุชื่อผู้ใช้งาน" required value={username} onChange={(e) => setUsername(e.target.value)}
                 style={{ padding: '14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>เบอร์โทรศัพท์ (1 เบอร์ ต่อ 1 บัญชี)</label>
          <input type="tel" placeholder="08X-XXX-XXXX" required value={phone} onChange={(e) => setPhone(e.target.value)}
                 style={{ padding: '14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>อีเมล</label>
          <input type="email" placeholder="example@mail.com" required value={email} onChange={(e) => setEmail(e.target.value)}
                 style={{ padding: '14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>รหัสผ่าน</label>
          <input type="password" placeholder="อย่างน้อย 6 ตัวอักษร" required value={password} onChange={(e) => setPassword(e.target.value)}
                 style={{ padding: '14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px' }} />
        </div>

        {/* 3. ข้อมูลเพิ่มเติม (เฉพาะผู้ขายและคนกลาง) */}
        {(role === 'middleman' || role === 'seller') && (
          <div style={{ padding: '20px', backgroundColor: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <span style={{ color: '#1d4ed8', fontSize: '15px', fontWeight: 'bold' }}>ข้อมูลบัญชีสำหรับรับเงิน (เฉพาะผู้ขายและคนกลาง)</span>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: '#3b82f6', fontWeight: 'bold' }}>ธนาคาร</label>
              <input type="text" placeholder="เช่น กสิกรไทย, ไทยพาณิชย์" required value={bankName} onChange={(e) => setBankName(e.target.value)}
                     style={{ padding: '12px', border: '1px solid #93c5fd', borderRadius: '8px', fontSize: '15px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: '#3b82f6', fontWeight: 'bold' }}>เลขที่บัญชี</label>
              <input type="text" placeholder="ระบุเลขที่บัญชี 10 หลัก" required value={bankAccount} onChange={(e) => setBankAccount(e.target.value)}
                     style={{ padding: '12px', border: '1px solid #93c5fd', borderRadius: '8px', fontSize: '15px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: '#3b82f6', fontWeight: 'bold' }}>ชื่อบัญชี</label>
              <input type="text" placeholder="ระบุชื่อ-นามสกุลให้ตรงกับบัญชี" required value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)}
                     style={{ padding: '12px', border: '1px solid #93c5fd', borderRadius: '8px', fontSize: '15px' }} />
            </div>
          </div>
        )}

        <button type="submit" disabled={loading} style={{ 
          padding: '16px', 
          backgroundColor: '#3ecf8e', 
          color: '#fff', 
          border: 'none', 
          borderRadius: '8px', 
          fontWeight: 'bold', 
          fontSize: '18px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(62, 207, 142, 0.3)',
          marginTop: '10px'
        }}>
          {loading ? 'กำลังดำเนินการ...' : 'ลงทะเบียนใช้งาน'}
        </button>
      </form>
    </div>
  );
}