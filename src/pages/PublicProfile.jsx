import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

export default function PublicProfile() {
  const { id } = useParams(); // รับค่า ID ของผู้ใช้งานจาก URL
  const [profile, setProfile] = useState(null);
  const [publicDeals, setPublicDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [highestBill, setHighestBill] = useState(0);

  useEffect(() => {
    fetchPublicData();
  }, [id]);

  const fetchPublicData = async () => {
    try {
      // 1. ดึงข้อมูลโปรไฟล์ (เลือกมาเฉพาะข้อมูลที่เปิดเผยได้)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, role, level, avatar_url, bio, contact_info, total_deals, successful_sales, successful_purchases')
        .eq('id', id)
        .single();

      if (profileError) throw profileError;
      if (profileData) setProfile(profileData);

      // 2. ดึงประวัติธุรกรรมที่สำเร็จแล้ว (เพื่อนำมาแสดงและหาค่าดีลสูงสุด)
      const { data: dealsData } = await supabase
        .from('deals')
        .select('item_name, price, status, created_at')
        .eq('user_id', id)
        .eq('status', 'ยืนยันรับสินค้าเรียบร้อย')
        .order('created_at', { ascending: false });

      if (dealsData && dealsData.length > 0) {
        setPublicDeals(dealsData);
        // หาค่าธุรกรรมที่มีมูลค่าสูงสุด
        const maxPrice = Math.max(...dealsData.map(deal => Number(deal.price)));
        setHighestBill(maxPrice);
      }
    } catch (error) {
      console.error('ไม่สามารถดึงข้อมูลโปรไฟล์ได้:', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>กำลังโหลดข้อมูลผู้ใช้งาน...</div>;
  if (!profile) return <div style={{ textAlign: 'center', padding: '50px', color: '#ef4444' }}>ไม่พบข้อมูลผู้ใช้งานในระบบ</div>;

  // แปลงชื่อประเภทบัญชีให้เป็นภาษาไทยที่เหมาะสม
  let roleText = 'ผู้ใช้งานทั่วไป';
  if (profile.role === 'middleman') roleText = 'คนกลางรับประกันธุรกรรม';
  if (profile.role === 'seller') roleText = 'ผู้ขายสินค้า';

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 20px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ width: '100%', maxWidth: '850px' }}>
        
        {/* ข้อมูลส่วนตัว (Header) */}
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', padding: '40px', textAlign: 'center', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
          <div style={{ width: '120px', height: '120px', backgroundColor: '#f3f4f6', borderRadius: '50%', margin: '0 auto 20px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '4px solid #f0fdf4' }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: '#ccc', fontSize: '14px', fontWeight: 'bold' }}>ไม่มีรูปภาพ</span>
            )}
          </div>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '32px', color: '#111', fontWeight: '800' }}>{profile.username}</h2>
          
          <div style={{ display: 'inline-flex', gap: '10px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{ backgroundColor: '#111', color: '#fff', padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
              {roleText}
            </span>
            {profile.role === 'middleman' && (
              <span style={{ backgroundColor: '#3ecf8e', color: '#fff', padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
                ระดับความน่าเชื่อถือ: {profile.level || 1}
              </span>
            )}
          </div>

          <div style={{ marginTop: '25px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '12px', textAlign: 'left', border: '1px solid #eee' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>ข้อมูลเบื้องต้น (Bio)</h4>
            <p style={{ margin: 0, color: '#666', fontSize: '15px', lineHeight: '1.6' }}>
              {profile.bio || 'ผู้ใช้งานท่านนี้ยังไม่ได้เพิ่มข้อมูลเบื้องต้น'}
            </p>
            <hr style={{ borderColor: '#eee', margin: '15px 0' }} />
            <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>ช่องทางการติดต่อ</h4>
            <p style={{ margin: 0, color: '#666', fontSize: '15px' }}>
              {profile.contact_info || 'ยังไม่ได้ระบุช่องทางการติดต่อสาธารณะ'}
            </p>
          </div>
        </div>

        {/* สถิติความน่าเชื่อถือ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '15px', fontWeight: 'bold' }}>การทำธุรกรรมสำเร็จ (ครั้ง)</p>
            <h3 style={{ margin: 0, fontSize: '32px', color: '#3ecf8e', fontWeight: '900' }}>
              {profile.role === 'middleman' ? profile.total_deals : (profile.successful_sales + profile.successful_purchases) || 0}
            </h3>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '15px', fontWeight: 'bold' }}>มูลค่าธุรกรรมสูงสุด (บาท)</p>
            <h3 style={{ margin: 0, fontSize: '32px', color: '#f59e0b', fontWeight: '900' }}>
              ฿{highestBill.toLocaleString()}
            </h3>
          </div>
        </div>

        {/* ประวัติธุรกรรมสาธารณะ */}
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', padding: '30px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#111', borderBottom: '2px solid #f3f4f6', paddingBottom: '15px' }}>
            ประวัติการทำธุรกรรมล่าสุด
          </h3>
          
          {publicDeals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <span style={{ fontSize: '15px', display: 'block' }}>ยังไม่มีประวัติการทำธุรกรรมสาธารณะ</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {publicDeals.slice(0, 10).map((deal, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '10px', border: '1px solid #eee' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '16px' }}>{deal.item_name}</h4>
                    <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>
                      มูลค่า: ฿{Number(deal.price).toLocaleString()}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                      สำเร็จ
                    </span>
                  </div>
                </div>
              ))}
              {publicDeals.length > 10 && (
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <span style={{ color: '#999', fontSize: '14px' }}>แสดงผลเฉพาะ 10 รายการล่าสุด</span>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}