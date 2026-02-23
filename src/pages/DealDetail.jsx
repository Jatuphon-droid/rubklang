import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

export default function DealDetail() {
  const { id } = useParams();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [middlemanLevel, setMiddlemanLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(''); 
  
  const [buyerEmail, setBuyerEmail] = useState('');
  const [inputSecret, setInputSecret] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // เพิ่ม State สำหรับเก็บไฟล์สลิปที่ลูกค้าอัปโหลด
  const [slipFile, setSlipFile] = useState(null);

  useEffect(() => {
    fetchDeal();
  }, [id]);

  const fetchDeal = async () => {
    const { data, error } = await supabase.from('deals').select('*').eq('id', id).single();
    if (data) {
      if (!data.status) data.status = 'รอชำระเงิน';
      setDeal(data);
      
      if (data.user_id) {
        const { data: profile } = await supabase.from('profiles').select('level').eq('id', data.user_id).single();
        if (profile) setMiddlemanLevel(profile.level || 1);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!deal || deal.status !== 'รอชำระเงิน') return;

    const interval = setInterval(() => {
      const expireTime = new Date(deal.created_at).getTime() + (10 * 60 * 1000); 
      const now = new Date().getTime();
      const distance = expireTime - now;

      if (distance <= 0) {
        clearInterval(interval);
        handleTimeout(); 
      } else {
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deal]);

  const handleTimeout = async () => {
    const { error } = await supabase.from('deals').update({ status: 'หมดเวลาชำระเงิน' }).eq('id', id);
    if (!error) fetchDeal(); 
  };

  // ฟังก์ชันใหม่สำหรับการอัปโหลดสลิป
  const handleUploadSlip = async () => {
    if (!slipFile) {
      alert('กรุณาอัปโหลดหลักฐานการโอนเงิน (สลิป) ก่อนทำการแจ้งชำระเงินนะคะ');
      return;
    }
    if (!buyerEmail || !buyerEmail.includes('@')) {
      alert('กรุณากรอกอีเมลของผู้ซื้อให้ถูกต้อง เพื่อรับรหัสยืนยันการรับสินค้า');
      return;
    }

    setIsSending(true);

    try {
      // 1. อัปโหลดไฟล์รูปภาพไปที่ Supabase Storage (Bucket: slips)
      const fileExt = slipFile.name.split('.').pop();
      const fileName = `${id}_${Date.now()}.${fileExt}`; // ตั้งชื่อไฟล์ให้ไม่ซ้ำกัน
      
      const { error: uploadError } = await supabase.storage
        .from('slips')
        .upload(fileName, slipFile);

      if (uploadError) throw uploadError;

      // 2. ดึง URL ของรูปภาพที่อัปโหลดเสร็จแล้ว
      const { data: { publicUrl } } = supabase.storage
        .from('slips')
        .getPublicUrl(fileName);

      // 3. บันทึก URL สลิป และเปลี่ยนสถานะดีลเป็นรอตรวจสอบ
      const { error: updateError } = await supabase
        .from('deals')
        .update({ 
          status: 'รอตรวจสอบสลิป',
          buyer_email: buyerEmail,
          slip_url: publicUrl // อย่าลืมสร้างคอลัมน์ slip_url ในฐานข้อมูลนะคะที่รัก
        })
        .eq('id', id);

      if (updateError) throw updateError;

      alert('แจ้งชำระเงินสำเร็จ! กรุณารอระบบตรวจสอบยอดเงินสักครู่นะคะ');
      fetchDeal(); // รีเฟรชหน้าเพื่อแสดงสถานะใหม่

    } catch (error) {
      alert('เกิดข้อผิดพลาดในการอัปโหลด: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmReceive = async () => {
    if (inputSecret !== deal.secret_key) {
      alert('รหัสยืนยันไม่ถูกต้อง กรุณาตรวจสอบรหัสจากอีเมลของผู้ซื้ออีกครั้ง');
      return;
    }

    try {
      const { error: dealError } = await supabase.from('deals').update({ status: 'ยืนยันรับสินค้าเรียบร้อย' }).eq('id', id);
      if (dealError) throw dealError;

      if (deal.user_id) {
        const { data: profile } = await supabase.from('profiles').select('total_deals, total_volume, level, total_commission').eq('id', deal.user_id).single();
        if (profile) {
          let currentLevel = profile.level || 1;
          let mmPercent = currentLevel >= 4 ? 0.8 : currentLevel === 3 ? 0.7 : currentLevel === 2 ? 0.6 : 0.5;
          const mmEarned = Number(deal.fee) * mmPercent; 
          await supabase.from('profiles').update({ 
            total_deals: (profile.total_deals || 0) + 1, 
            total_volume: (profile.total_volume || 0) + Number(deal.price),
            level: currentLevel,
            total_commission: (profile.total_commission || 0) + mmEarned
          }).eq('id', deal.user_id);
        }
      }

      alert('ยืนยันการรับสินค้าสำเร็จ ระบบได้ดำเนินการบันทึกส่วนแบ่งค่าธรรมเนียมแล้ว');
      fetchDeal();

    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  if (loading) return <div style={{ color: '#666', textAlign: 'center', marginTop: '50px' }}>กำลังโหลดข้อมูลการทำรายการ...</div>;
  if (!deal) return <div style={{ color: '#ef4444', textAlign: 'center', marginTop: '50px' }}>ไม่พบข้อมูลการทำรายการนี้ในระบบ</div>;

  const itemPrice = Number(deal.price);
  const fee = Number(deal.fee);
  let buyerMustPay = deal.fee_payer === 'buyer' ? itemPrice + fee : deal.fee_payer === 'seller' ? itemPrice : itemPrice + (fee / 2);
  let sellerWillReceive = deal.fee_payer === 'buyer' ? itemPrice : deal.fee_payer === 'seller' ? itemPrice - fee : itemPrice - (fee / 2);
  let payerText = deal.fee_payer === 'buyer' ? "ผู้ซื้อรับผิดชอบ" : deal.fee_payer === 'seller' ? "ผู้ขายรับผิดชอบ" : "แบ่งรับผิดชอบคนละครึ่ง";

  let displayMmPercent = middlemanLevel >= 4 ? 0.8 : middlemanLevel === 3 ? 0.7 : middlemanLevel === 2 ? 0.6 : 0.5;
  const mmCut = fee * displayMmPercent;
  const platformCut = fee - mmCut;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: '650px', backgroundColor: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        <h2 style={{ color: '#111', marginTop: 0, textAlign: 'center', fontWeight: '800' }}>ห้องทำธุรกรรม (Deal Room)</h2>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <span style={{ 
            backgroundColor: deal.status === 'รอชำระเงิน' ? '#f59e0b' : deal.status === 'รอตรวจสอบสลิป' ? '#8b5cf6' : deal.status.includes('รอส่งมอบ') ? '#3b82f6' : deal.status === 'ยืนยันรับสินค้าเรียบร้อย' ? '#10b981' : '#ef4444', 
            color: 'white', padding: '10px 20px', borderRadius: '30px', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
          }}>
            สถานะ: {deal.status}
          </span>
        </div>

        <div style={{ backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '12px', border: '1px solid #bbf7d0', marginBottom: '20px', textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#166534', fontSize: '15px' }}>
            รายการนี้ดูแลโดยคนกลาง: <strong style={{ fontSize: '18px' }}>{deal.middleman_name || 'บัญชีส่วนกลาง (Rub-Klang.com)'}</strong>
          </p>
        </div>

        <div style={{ backgroundColor: '#f9fafb', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <p style={{ color: '#4b5563', margin: '5px 0', fontSize: '16px' }}><strong>สินค้า:</strong> <span style={{color: '#111'}}>{deal.item_name}</span></p>
          <p style={{ color: '#4b5563', margin: '5px 0', fontSize: '16px' }}><strong>ผู้ซื้อ:</strong> <span style={{color: '#111'}}>{deal.buyer_name}</span></p>
          <p style={{ color: '#4b5563', margin: '5px 0', fontSize: '16px' }}><strong>ผู้ขาย:</strong> <span style={{color: '#111'}}>{deal.seller_name}</span></p>
          <hr style={{ borderColor: '#e5e7eb', margin: '20px 0' }} />
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '5px 0' }}>เงื่อนไขค่าธรรมเนียม: {payerText} (รวม ฿{fee.toLocaleString()})</p>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', alignItems: 'center' }}>
            <span style={{ color: '#4b5563', fontSize: '18px', fontWeight: 'bold' }}>ยอดที่ต้องโอนเข้าบัญชีกลาง:</span>
            <span style={{ color: '#ef4444', fontSize: '28px', fontWeight: '900' }}>฿ {buyerMustPay.toLocaleString()}</span>
          </div>
        </div>

        {deal.status === 'รอชำระเงิน' && (
          <div style={{ textAlign: 'center', marginTop: '30px', padding: '30px', backgroundColor: '#fff', borderRadius: '12px', border: '2px dashed #e5e7eb' }}>
            <p style={{ color: '#111', margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '18px' }}>สแกนเพื่อชำระเงินเข้าบัญชีกลาง (Escrow)</p>
            
            <div style={{ marginBottom: '20px' }}>
              <span style={{ color: '#ef4444', fontSize: '15px', fontWeight: 'bold' }}>
                กรุณาชำระเงินภายใน: <span style={{ fontSize: '24px', display: 'block', marginTop: '5px' }}>{timeLeft || '00:00'}</span>
              </span>
            </div>

            {/* 1. ส่วนแสดงรูปภาพ QR Code */}
            <div style={{ margin: '0 auto 20px auto', textAlign: 'center' }}>
              <img src="/qr-code.jpg" alt="QR Code รับเงิน" style={{ width: '180px', height: '180px', borderRadius: '12px', objectFit: 'contain', border: '2px solid #e5e7eb', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }} />
            </div>

            {/* 2. ส่วนอัปโหลดสลิป */}
            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                อัปโหลดหลักฐานการโอนเงิน (สลิป)
              </label>
              <input 
                type="file" 
                accept="image/jpeg, image/png"
                onChange={(e) => setSlipFile(e.target.files[0])} // จับไฟล์ยัดใส่ State
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: '#333', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            {/* 3. ส่วนกรอกอีเมล */}
            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                อีเมลผู้ซื้อ (สำหรับรับรหัสปลดล็อกเงิน)
              </label>
              <input 
                type="email" 
                required
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                placeholder="ระบุอีเมลที่สามารถใช้งานได้จริง"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>

            {/* 4. ปุ่มกดยืนยันอัปโหลดสลิป */}
            <button disabled={isSending} onClick={handleUploadSlip} style={{ width: '100%', padding: '16px', backgroundColor: isSending ? '#ccc' : '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)' }}>
              {isSending ? 'กำลังอัปโหลดสลิป...' : 'แจ้งชำระเงิน และอัปโหลดสลิป'}
            </button>
          </div>
        )}

        {/* เพิ่มสถานะใหม่: รอตรวจสอบสลิป */}
        {deal.status === 'รอตรวจสอบสลิป' && (
          <div style={{ marginTop: '30px', textAlign: 'center', padding: '25px', backgroundColor: '#f5f3ff', borderRadius: '12px', border: '1px solid #ddd6fe' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#7c3aed' }}>กำลังรอผู้ดูแลตรวจสอบยอดเงิน</h3>
            <p style={{ margin: 0, color: '#5b21b6', fontSize: '15px' }}>เมื่อผู้ดูแลยืนยันยอดเงินเรียบร้อยแล้ว ระบบจะส่งรหัสลับ 6 หลัก ไปที่อีเมลผู้ซื้อโดยอัตโนมัติค่ะ</p>
          </div>
        )}

        {deal.status === 'หมดเวลาชำระเงิน' && (
          <div style={{ marginTop: '30px', textAlign: 'center', padding: '25px', backgroundColor: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#dc2626' }}>รายการนี้หมดเวลาชำระเงิน</h3>
            <p style={{ margin: 0, color: '#7f1d1d', fontSize: '14px' }}>กรุณาสร้างรายการใหม่หากต้องการทำธุรกรรมต่อ</p>
          </div>
        )}

        {deal.status === 'ชำระเงินแล้ว (รอส่งมอบ)' && (
          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#eff6ff', borderLeft: '5px solid #3b82f6', borderRadius: '8px' }}>
            <p style={{ color: '#1d4ed8', fontWeight: 'bold', margin: '0 0 10px 0', fontSize: '16px' }}>ยอดเงินค่าสินค้าถูกพักไว้ในระบบอย่างปลอดภัย</p>
            <div style={{ color: '#475569', fontSize: '14px', margin: '0 0 20px 0', lineHeight: '1.6' }}>
              - ผู้ขาย: กรุณาส่งมอบสินค้าให้ผู้ซื้อ<br/>
              - ผู้ซื้อ: เมื่อตรวจสอบสินค้าเรียบร้อยแล้ว กรุณานำรหัสจากอีเมล ({deal.buyer_email || 'ผู้ซื้อ'}) มากรอกเพื่อยืนยัน
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                รหัสยืนยันการรับสินค้า (6 หลัก)
              </label>
              <input 
                type="text" 
                maxLength="6"
                value={inputSecret}
                onChange={(e) => setInputSecret(e.target.value)}
                placeholder="ระบุรหัส 6 หลักที่ได้รับทางอีเมล"
                style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '2px solid #bfdbfe', fontSize: '20px', textAlign: 'center', letterSpacing: '4px', boxSizing: 'border-box' }}
              />
            </div>

            <button onClick={handleConfirmReceive} style={{ width: '100%', padding: '16px', backgroundColor: '#3ecf8e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', boxShadow: '0 4px 12px rgba(62, 207, 142, 0.3)' }}>
              ยืนยันการรับสินค้า
            </button>
          </div>
        )}

        {deal.status === 'ยืนยันรับสินค้าเรียบร้อย' && (
          <div style={{ marginTop: '30px', textAlign: 'center', color: '#10b981', padding: '25px', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '22px' }}>การทำรายการสำเร็จลุล่วง</h3>
            <p style={{ margin: '5px 0', color: '#475569' }}>ระบบกำลังดำเนินการโอนยอดเงินให้แต่ละฝ่ายดังนี้:</p>
            
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', marginTop: '20px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px dashed #e5e7eb', paddingBottom: '12px' }}>
                <span style={{ color: '#4b5563', fontSize: '16px' }}>ผู้ขายได้รับค่าสินค้า:</span>
                <span style={{ color: '#16a34a', fontSize: '20px', fontWeight: 'bold' }}>฿ {sellerWillReceive.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#4b5563', fontSize: '16px' }}>ส่วนแบ่งคนกลาง (ระดับ {middlemanLevel}):</span>
                <span style={{ color: '#f59e0b', fontSize: '20px', fontWeight: 'bold' }}>฿ {mmCut.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#4b5563', fontSize: '16px' }}>ค่าบริการแพลตฟอร์ม:</span>
                <span style={{ color: '#3b82f6', fontSize: '20px', fontWeight: 'bold' }}>฿ {platformCut.toLocaleString()}</span>
              </div>
            </div>

            <p style={{ margin: '15px 0 0 0', fontSize: '14px', color: '#6b7280' }}>(ยอดเงินจะถูกโอนเข้าบัญชีธนาคารที่ลงทะเบียนไว้ภายใน 15-30 นาที)</p>
          </div>
        )}

      </div>
    </div>
  );
}