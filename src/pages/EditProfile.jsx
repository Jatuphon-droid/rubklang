import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function EditProfile() {
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState(''); 
  const [contactInfo, setContactInfo] = useState(''); 
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setUsername(data.username || '');
        setAvatarUrl(data.avatar_url || '');
        setBio(data.bio || ''); 
        setContactInfo(data.contact_info || ''); 
      }
    }
  };

  const uploadAvatar = async (event) => {
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(publicUrl);
      alert('อัปโหลดรูปภาพสำเร็จ');
      
    } catch (error) {
      alert('อัปโหลดรูปภาพไม่สำเร็จ: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ไม่พบข้อมูลผู้ใช้งาน');

      const { error } = await supabase
        .from('profiles')
        .update({ 
          username: username, 
          avatar_url: avatarUrl,
          bio: bio, 
          contact_info: contactInfo 
        })
        .eq('id', user.id);

      if (error) throw error;

      alert('บันทึกการเปลี่ยนแปลงสำเร็จ');
      navigate('/profile');
    } catch (error) {
      alert('บันทึกไม่สำเร็จ: ' + error.message);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 20px', color: '#333' }}>
      <div style={{ width: '100%', maxWidth: '550px', backgroundColor: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#111' }}>แก้ไขโปรไฟล์</h2>
        
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* ส่วนอัปโหลดรูปภาพ */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#f3f4f6', margin: '0 auto 15px', overflow: 'hidden', border: '3px solid #3ecf8e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {avatarUrl ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{fontSize: '14px', color: '#999', fontWeight: 'bold'}}>รูปโปรไฟล์</span>}
            </div>
            <input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} style={{ fontSize: '12px', color: '#333' }} />
            <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>{uploading ? 'กำลังอัปโหลด...' : 'แนะนำไฟล์ PNG หรือ JPG'}</p>
          </div>

          {/* ข้อมูลทั่วไป */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: '#444', fontWeight: 'bold' }}>ชื่อที่แสดง (Username)</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="กรอกชื่อผู้ใช้งาน"
              style={inputStyle} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: '#444', fontWeight: 'bold' }}>ข้อมูลเบื้องต้น (Bio)</label>
            <textarea 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              placeholder="แนะนำตัวสั้นๆ หรือแจ้งเงื่อนไขการรับงานของคุณ"
              rows="3"
              style={{ ...inputStyle, resize: 'vertical' }} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: '#444', fontWeight: 'bold' }}>ช่องทางการติดต่อ (สาธารณะ)</label>
            <input 
              type="text" 
              value={contactInfo} 
              onChange={(e) => setContactInfo(e.target.value)} 
              placeholder="เช่น Line ID, Facebook, หรือ เบอร์โทรศัพท์"
              style={inputStyle} 
            />
          </div>

          <button type="submit" style={{ 
            padding: '16px', 
            backgroundColor: '#3ecf8e', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '8px', 
            fontWeight: 'bold', 
            fontSize: '18px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(62, 207, 142, 0.2)',
            marginTop: '10px'
          }}>
            บันทึกการเปลี่ยนแปลง
          </button>
        </form>
      </div>
    </div>
  );
}

// แยก Style ของ Input ออกมาให้โค้ดดูสะอาดขึ้น
const inputStyle = {
  padding: '12px', 
  border: '2px solid #eee', 
  borderRadius: '8px', 
  fontSize: '15px',
  backgroundColor: '#fff', 
  color: '#111',
  width: '100%',
  boxSizing: 'border-box'
};