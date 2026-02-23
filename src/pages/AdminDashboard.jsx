import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Link } from 'react-router-dom';

// 🚀 ฟังก์ชันสำหรับส่งอีเมลผ่าน EmailJS (ย้ายมาจากหน้า DealDetail)
const sendEmailViaEmailJS = async (toEmail, secretKey, itemName) => {
  const serviceId = 'service_4kzh7an'; 
  const templateId = 'template_cmo1nab'; // 🔴 รอใส่ Template ID ของคุณ
  const publicKey = '-ojC-fSdAyoFIYtF_'; 

  const data = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      to_email: toEmail,
      secret_key: secretKey,
      item_name: itemName
    }
  };

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('ไม่สามารถส่งอีเมลได้');
  }
};

export default function AdminDashboard() {
  const [balance, setBalance] = useState(0);
  const [activeDeals, setActiveDeals] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);

  // 🔒 State สำหรับระบบล็อคอิน
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // 📄 State สำหรับ Pop-up รายละเอียดดีลและสลิป
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    // 🔴 เปลี่ยนรหัสผ่านส่วนตัวของคุณตรงนี้นะคะ!
    if (passwordInput === '211032') { 
      setIsAuthenticated(true);
    } else {
      alert('รหัสผ่านไม่ถูกต้องค่ะ');
      setPasswordInput('');
    }
  };

  const fetchDashboardData = async () => {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('ไม่สามารถดึงข้อมูลได้:', error);
    } else if (data) {
      setActiveDeals(data.length);
      const totalFee = data.reduce((sum, deal) => sum + Number(deal.fee), 0);
      setBalance(totalFee);
      setRecentTransactions(data); // เมย์ขออนุญาตดึงมาทั้งหมดก่อนเพื่อความง่ายในการกดดูนะคะ
    }
  };

  // ✅ ฟังก์ชันอนุมัติสลิปและยิง OTP
  const handleApproveSlip = async () => {
    if (!selectedDeal || !selectedDeal.buyer_email) {
      alert('ไม่พบอีเมลผู้ซื้อ ไม่สามารถส่งรหัสได้ค่ะ');
      return;
    }

    setIsSending(true);

    // 1. สุ่มรหัสลับ 6 หลัก
    const generatedSecret = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. อัปเดตสถานะและบันทึกรหัสลง Database
    const { error } = await supabase
      .from('deals')
      .update({ 
        status: 'ชำระเงินแล้ว (รอส่งมอบ)',
        secret_key: generatedSecret
      })
      .eq('id', selectedDeal.id);

    if (error) {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message);
      setIsSending(false);
      return;
    }

    // 3. ส่งอีเมล
    try {
      await sendEmailViaEmailJS(selectedDeal.buyer_email, generatedSecret, selectedDeal.item_name);
      alert(`ตรวจสอบสลิปผ่าน! ระบบส่งรหัส OTP 6 หลักไปที่อีเมล ${selectedDeal.buyer_email} เรียบร้อยแล้วค่ะ`);
      setSelectedDeal(null); // ปิด Pop-up
      fetchDashboardData(); // โหลดข้อมูลใหม่
    } catch (emailError) {
      console.error(emailError);
      alert('อัปเดตสถานะสำเร็จ แต่เกิดปัญหาในการส่งอีเมล (กรุณาตรวจสอบ EmailJS)');
    } finally {
      setIsSending(false);
    }
  };

  // 🔒 หน้าจอ Login (แสดงผลถ้ายังไม่ได้ล็อกอิน)
  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f9fafb' }}>
        <form onSubmit={handleLogin} style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center', width: '350px' }}>
          <h2 style={{ marginBottom: '20px', color: '#111' }}>Admin Only 🔒</h2>
          <input 
            type="password" 
            placeholder="กรุณากรอกรหัสผ่าน" 
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
          <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    );
  }

  // 📊 หน้าจอ Dashboard (แสดงผลหลังล็อกอินผ่าน)
  return (
    <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      <h2 style={{ marginBottom: '20px', fontWeight: 'bold', color: '#111' }}>ภาพรวมบัญชี (Admin Dashboard)</h2>
      
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '25px', borderRadius: '12px', flex: '1 1 300px', borderTop: '4px solid #3ecf8e', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '15px', fontWeight: 'normal' }}>รายได้รวมทั้งหมด (Platform Fees)</h3>
          <p style={{ fontSize: '38px', margin: 0, fontWeight: '800', color: '#111' }}>
            ฿ {balance.toLocaleString('th-TH', {minimumFractionDigits: 2})}
          </p>
          <button style={{ marginTop: '20px', padding: '12px 20px', backgroundColor: '#3ecf8e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', width: '100%', fontSize: '16px', fontWeight: 'bold' }}>
            ถอนเงินเข้าบัญชี
          </button>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '25px', borderRadius: '12px', flex: '1 1 300px', borderTop: '4px solid #f59e0b', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '15px', fontWeight: 'normal' }}>ดีลที่กำลังดำเนินการ</h3>
          <p style={{ fontSize: '38px', margin: 0, fontWeight: '800', color: '#111' }}>
            {activeDeals} <span style={{fontSize: '18px', color: '#999', fontWeight: 'normal'}}>รายการ</span>
          </p>
          <Link to="/create-deal" style={{ display: 'block', textAlign: 'center', marginTop: '20px', padding: '12px 20px', backgroundColor: '#f3f4f6', color: '#333', textDecoration: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', border: '1px solid #e5e7eb' }}>
            สร้างดีลรับกลางใหม่
          </Link>
        </div>
      </div>
      
      <div style={{ backgroundColor: '#ffffff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#111', fontSize: '18px' }}>ดีลทั้งหมดในระบบ (คลิกที่รายการเพื่อตรวจสอบ)</h3>
          <div style={{ overflowX: 'auto' }}>
            {recentTransactions.length > 0 ? (
              <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', color: '#333' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f3f4f6', textAlign: 'left' }}>
                    <th style={{ padding: '12px', color: '#666' }}>สินค้า</th>
                    <th style={{ padding: '12px', color: '#666' }}>ผู้ซื้อ - ผู้ขาย</th>
                    <th style={{ padding: '12px', color: '#666' }}>ยอดโอน</th>
                    <th style={{ padding: '12px', color: '#3ecf8e' }}>ค่าธรรมเนียม</th>
                    <th style={{ padding: '12px', color: '#666' }}>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((deal) => (
                    // 👇 ตรงนี้เมย์ทำแถวให้กดคลิกได้แล้วนะคะ
                    <tr 
                      key={deal.id} 
                      onClick={() => setSelectedDeal(deal)}
                      style={{ borderBottom: '1px solid #f9fafb', cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f6f4'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '14px 12px', fontWeight: '500' }}>{deal.item_name}</td>
                      <td style={{ padding: '14px 12px', fontSize: '13px' }}>{deal.buyer_name} - {deal.seller_name}</td>
                      <td style={{ padding: '14px 12px' }}>฿{Number(deal.price).toLocaleString()}</td>
                      <td style={{ padding: '14px 12px', color: '#059669', fontWeight: 'bold' }}>฿{Number(deal.fee).toLocaleString()}</td>
                      <td style={{ padding: '14px 12px' }}>
                        <span style={{ 
                          backgroundColor: deal.status === 'รอตรวจสอบสลิป' ? '#ede9fe' : '#f3f4f6', 
                          padding: '5px 10px', 
                          borderRadius: '15px', 
                          fontSize: '12px', 
                          color: deal.status === 'รอตรวจสอบสลิป' ? '#7c3aed' : '#4b5563', 
                          border: deal.status === 'รอตรวจสอบสลิป' ? '1px solid #c4b5fd' : '1px solid #e5e7eb',
                          fontWeight: deal.status === 'รอตรวจสอบสลิป' ? 'bold' : 'normal'
                        }}>
                          {deal.status || 'รอชำระเงิน'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>ยังไม่มีข้อมูลการทำรายการ</p>
            )}
          </div>
      </div>

      {/* 📄 Pop-up แสดงรายละเอียดดีล (Modal) */}
      {selectedDeal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#111' }}>ตรวจสอบรายการ</h2>
              <button onClick={() => setSelectedDeal(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>✖</button>
            </div>

            <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ margin: '5px 0' }}><strong>สินค้า:</strong> {selectedDeal.item_name}</p>
              <p style={{ margin: '5px 0' }}><strong>ผู้ซื้อ:</strong> {selectedDeal.buyer_name} ({selectedDeal.buyer_email || 'ยังไม่ระบุอีเมล'})</p>
              <p style={{ margin: '5px 0' }}><strong>ผู้ขาย:</strong> {selectedDeal.seller_name}</p>
              <p style={{ margin: '5px 0' }}><strong>สถานะ:</strong> {selectedDeal.status}</p>
            </div>

            {/* แสดงรูปสลิปถ้ามี */}
            {selectedDeal.slip_url ? (
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>หลักฐานการโอนเงิน:</p>
                <img src={selectedDeal.slip_url} alt="สลิปโอนเงิน" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '8px', marginBottom: '20px' }}>
                ผู้ซื้อยังไม่ได้อัปโหลดสลิปค่ะ
              </div>
            )}

            {/* ปุ่มอนุมัติ (จะโชว์เฉพาะตอนสถานะรอตรวจสอบสลิป) */}
            {selectedDeal.status === 'รอตรวจสอบสลิป' && (
              <button 
                onClick={handleApproveSlip} 
                disabled={isSending}
                style={{ width: '100%', padding: '15px', backgroundColor: isSending ? '#ccc' : '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(124, 58, 237, 0.3)' }}
              >
                {isSending ? 'กำลังประมวลผล...' : '💰 เงินเข้าแล้ว! อนุมัติและส่งรหัส OTP'}
              </button>
            )}

          </div>
        </div>
      )}

    </main>
  );
}