import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Link } from 'react-router-dom';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [dealsHistory, setDealsHistory] = useState([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // 1. ดึงข้อมูลโปรไฟล์
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileData) setProfile(profileData);

      // 2. ดึงประวัติการทำรายการที่เกี่ยวข้องกับผู้ใช้งานคนนี้
      // หมายเหตุ: ดึงข้อมูลตามเงื่อนไขเพื่อนำมาแสดงประวัติ
      let query = supabase.from('deals').select('*').order('created_at', { ascending: false });
      
      if (profileData?.role === 'middleman') {
        query = query.eq('user_id', user.id); // คนกลางดูจาก user_id ที่สร้างดีล
      } else if (profileData?.role === 'seller') {
        query = query.eq('seller_name', profileData.username); // ผู้ขายดูจากชื่อที่ตรงกัน
      } else {
        query = query.eq('buyer_name', profileData.username); // ผู้ซื้อดูจากชื่อที่ตรงกัน
      }

      const { data: historyData } = await query;
      if (historyData) setDealsHistory(historyData);
    }
    setLoading(false);
  };

  const getCommissionPercent = (level) => {
    if (level >= 4) return 0.80;
    if (level === 3) return 0.70;
    if (level === 2) return 0.60;
    return 0.50; 
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>กำลังประมวลผลข้อมูลบัญชีผู้ใช้...</div>;
  if (!profile) return <div style={{ textAlign: 'center', padding: '50px', color: '#ef4444' }}>ไม่พบข้อมูลผู้ใช้งาน</div>;

  // --- ตัวแปรสำหรับคำนวณสถิติ ---
  const successfulDeals = dealsHistory.filter(d => d.status === 'ยืนยันรับสินค้าเรียบร้อย');
  const timeoutDeals = dealsHistory.filter(d => d.status === 'หมดเวลาชำระเงิน');
  const pendingDeals = dealsHistory.filter(d => d.status.includes('รอ'));

  const totalVolume = successfulDeals.reduce((sum, deal) => sum + Number(deal.price), 0);
  const currentPercent = getCommissionPercent(profile.level || 1);
  const totalCommission = profile.total_commission || 0;
  
  let latestCommission = 0;
  if (profile.role === 'middleman' && successfulDeals.length > 0) {
    latestCommission = successfulDeals[0].fee * currentPercent;
  }

  // คำนวณยอดเฉลี่ยสำหรับผู้ซื้อ
  const avgSpend = successfulDeals.length > 0 ? (totalVolume / successfulDeals.length) : 0;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 20px', backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
      <div style={{ width: '100%', maxWidth: '900px' }}>
        
        {/* =========================================
            ส่วนที่ 1: การ์ดโปรไฟล์ส่วนบน (แสดงเหมือนกันทุกคน)
        ========================================== */}
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ backgroundColor: profile.role === 'middleman' ? '#3ecf8e' : profile.role === 'seller' ? '#3b82f6' : '#8b5cf6', padding: '40px', textAlign: 'center', color: '#fff', position: 'relative' }}>
            <div style={{ width: '120px', height: '120px', backgroundColor: '#fff', borderRadius: '50%', margin: '0 auto 15px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '4px solid rgba(255,255,255,0.3)' }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{color: '#ccc', fontSize: '14px', fontWeight: 'bold'}}>ไม่มีรูปโปรไฟล์</span>
              )}
            </div>
            <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '800' }}>{profile.username}</h2>
            <span style={{ backgroundColor: '#111', color: '#fff', padding: '6px 16px', borderRadius: '20px', fontSize: '14px', marginTop: '10px', display: 'inline-block', fontWeight: 'bold' }}>
              {profile.role === 'middleman' ? `บัญชีคนกลาง ระดับ ${profile.level || 1}` : profile.role === 'seller' ? 'บัญชีผู้ขายสินค้า' : 'บัญชีผู้ซื้อ'}
            </span>
          </div>

          <div style={{ padding: '0 30px 30px 30px', display: 'flex', gap: '15px', marginTop: '30px' }}>
            <Link to="/edit-profile" style={{ flex: 1, textDecoration: 'none' }}>
              <button style={{ width: '100%', padding: '15px', backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
                จัดการโปรไฟล์
              </button>
            </Link>
            
            {(profile.role === 'middleman' || profile.role === 'seller') && (
              <button 
                onClick={() => {
                  const publicProfileUrl = `${window.location.origin}/user/${profile.id}`;
                  navigator.clipboard.writeText(publicProfileUrl);
                  alert(`คัดลอกลิงก์โปรไฟล์สาธารณะสำเร็จ!\n\nลิงก์ของคุณคือ:\n${publicProfileUrl}`);
                }}
                style={{ flex: 1, padding: '15px', backgroundColor: profile.role === 'middleman' ? '#3ecf8e' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
              >
                คัดลอกลิงก์อ้างอิงเครดิต
              </button>
            )}
          </div>
        </div>

        {/* =========================================
            ส่วนที่ 2: สถิติแยกตามประเภทผู้ใช้งาน (Role-Based Dashboard)
        ========================================== */}
        
        {/* 🟢 DASHBOARD สำหรับคนกลาง (Middleman) */}
        {profile.role === 'middleman' && (
          <div style={{ padding: '0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <p style={{ color: '#166534', margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold' }}>รายได้ค่าธรรมเนียมสะสม</p>
              <h3 style={{ fontSize: '28px', margin: 0, color: '#16a34a', fontWeight: '900' }}>฿{totalCommission.toLocaleString()}</h3>
            </div>
            <div style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <p style={{ color: '#b45309', margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold' }}>รายได้รายการล่าสุด</p>
              <h3 style={{ fontSize: '28px', margin: 0, color: '#d97706', fontWeight: '900' }}>+฿{latestCommission.toLocaleString()}</h3>
            </div>
            <div style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <p style={{ color: '#666', margin: '0 0 5px 0', fontSize: '14px' }}>ยอดเงินหมุนเวียนในระบบ</p>
              <h3 style={{ fontSize: '24px', margin: 0, color: '#111' }}>฿{totalVolume.toLocaleString()}</h3>
            </div>
            <div style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <p style={{ color: '#666', margin: '0 0 5px 0', fontSize: '14px' }}>ดูแลรายการสำเร็จ</p>
              <h3 style={{ fontSize: '24px', margin: 0, color: '#111' }}>{successfulDeals.length} ครั้ง</h3>
            </div>
          </div>
        )}

        {/* 🔵 DASHBOARD สำหรับผู้ขาย (Seller) */}
        {profile.role === 'seller' && (
          <div style={{ padding: '0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb', borderTop: '4px solid #3b82f6', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <p style={{ color: '#1e3a8a', margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold' }}>ยอดขายรวมสุทธิ</p>
              <h3 style={{ fontSize: '28px', margin: 0, color: '#2563eb', fontWeight: '900' }}>฿{totalVolume.toLocaleString()}</h3>
            </div>
            <div style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <p style={{ color: '#666', margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold' }}>รายการขายที่สำเร็จ</p>
              <h3 style={{ fontSize: '28px', margin: 0, color: '#10b981', fontWeight: '900' }}>{successfulDeals.length} รายการ</h3>
            </div>
            <div style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <p style={{ color: '#666', margin: '0 0 5px 0', fontSize: '14px' }}>รายการรอดำเนินการ</p>
              <h3 style={{ fontSize: '24px', margin: 0, color: '#f59e0b' }}>{pendingDeals.length} รายการ</h3>
            </div>
          </div>
        )}

        {/* 🟣 DASHBOARD สำหรับผู้ซื้อ (Buyer) */}
        {profile.role === 'buyer' && (
          <div style={{ padding: '0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb', borderTop: '4px solid #8b5cf6', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <p style={{ color: '#4c1d95', margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold' }}>ยอดสั่งซื้อสะสม</p>
              <h3 style={{ fontSize: '28px', margin: 0, color: '#7c3aed', fontWeight: '900' }}>฿{totalVolume.toLocaleString()}</h3>
            </div>
            <div style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <p style={{ color: '#666', margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold' }}>เครดิตการซื้อสำเร็จ</p>
              <h3 style={{ fontSize: '28px', margin: 0, color: '#10b981', fontWeight: '900' }}>{successfulDeals.length} ครั้ง</h3>
            </div>
            <div style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <p style={{ color: '#666', margin: '0 0 5px 0', fontSize: '14px' }}>รายการหมดเวลา/ยกเลิก</p>
              <h3 style={{ fontSize: '24px', margin: 0, color: '#ef4444' }}>{timeoutDeals.length} ครั้ง</h3>
            </div>
            <div style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <p style={{ color: '#666', margin: '0 0 5px 0', fontSize: '14px' }}>ยอดใช้จ่ายเฉลี่ย/บิล</p>
              <h3 style={{ fontSize: '24px', margin: 0, color: '#111' }}>฿{avgSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
            </div>
          </div>
        )}

        {/* =========================================
            ส่วนที่ 3: ประวัติการทำธุรกรรม (History List)
        ========================================== */}
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', padding: '30px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#111', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>
            ประวัติการทำรายการในระบบ
          </h3>
          
          {dealsHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <span style={{ fontSize: '14px', display: 'block' }}>ยังไม่มีประวัติการทำธุรกรรม</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {dealsHistory.map((historyDeal, index) => {
                // กำหนดสีและข้อความของสถานะ
                let statusColor = '#f59e0b';
                let statusBg = '#fef3c7';
                if (historyDeal.status === 'ยืนยันรับสินค้าเรียบร้อย') {
                  statusColor = '#16a34a'; statusBg = '#dcfce7';
                } else if (historyDeal.status === 'หมดเวลาชำระเงิน') {
                  statusColor = '#dc2626'; statusBg = '#fee2e2';
                }

                return (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#111', fontSize: '16px' }}>{historyDeal.item_name}</h4>
                      <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>
                        มูลค่า: ฿{Number(historyDeal.price).toLocaleString()} | 
                        {profile.role === 'buyer' ? ` ผู้ขาย: ${historyDeal.seller_name}` : ` ผู้ซื้อ: ${historyDeal.buyer_name}`}
                      </p>
                    </div>
                    
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <span style={{ backgroundColor: statusBg, color: statusColor, padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                        {historyDeal.status}
                      </span>
                      {/* ปุ่มสำหรับกดเข้าไปดูรายละเอียดดีล */}
                      <Link to={`/deal/${historyDeal.id}`} style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold' }}>
                        ดูรายละเอียด
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}