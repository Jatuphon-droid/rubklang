import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { calculateTransactionFee } from '../utils/feeCalculator';
import { useNavigate } from 'react-router-dom';

export default function CreateDeal() {
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [feePayer, setFeePayer] = useState('buyer'); 
  const [loading, setLoading] = useState(false);
  const [middlemanName, setMiddlemanName] = useState('กำลังดึงข้อมูล...'); // เพิ่ม State สำหรับชื่อคนกลาง
  const navigate = useNavigate();

  // ดึงชื่อคนกลางเมื่อเปิดหน้าเว็บ
  useEffect(() => {
    fetchMiddlemanProfile();
  }, []);

  const fetchMiddlemanProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single();
      if (data) setMiddlemanName(data.username);
    } else {
      // เมย์เอาส่วนแจ้งเตือนและเด้งไปหน้า Login ออกนะคะ 
      // และเปลี่ยนให้ตั้งชื่อคนกลางเป็นค่าเริ่มต้นแทนค่ะ
      setMiddlemanName('จตุพล โพธิศิริ'); 
    }
  };

  // คำนวณค่าธรรมเนียมการทำรายการ
  const fee = calculateTransactionFee(price);
  const itemPrice = parseFloat(price) || 0;

  let buyerMustPay = 0;
  let sellerWillReceive = 0;

  if (feePayer === 'buyer') {
    buyerMustPay = itemPrice + fee;
    sellerWillReceive = itemPrice;
  } else if (feePayer === 'seller') {
    buyerMustPay = itemPrice;
    sellerWillReceive = itemPrice - fee;
  } else if (feePayer === 'half') {
    buyerMustPay = itemPrice + (fee / 2);
    sellerWillReceive = itemPrice - (fee / 2);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('deals')
      .insert([
        {
          item_name: itemName,
          price: itemPrice,
          fee: fee,
          buyer_name: buyerName,
          seller_name: sellerName,
          fee_payer: feePayer,
          user_id: user ? user.id : null,           // ใส่ ID คนกลาง
          middleman_name: middlemanName, // ใส่ชื่อคนกลางที่ดึงมา
          status: 'รอชำระเงิน'         // ตั้งสถานะเริ่มต้น
        }
      ])
      .select();

    if (error) {
      alert('เกิดข้อผิดพลาดในการสร้างดีล: ' + error.message);
    } else if (data && data.length > 0) {
      alert('สร้างดีลสำเร็จ ระบบกำลังนำท่านไปยังหน้ารายละเอียดการทำธุรกรรม');
      navigate(`/deal/${data[0].id}`); // นำทางไปหน้ารายละเอียดดีล
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: '650px', backgroundColor: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#111', fontWeight: '800' }}>สร้างดีลรับกลางใหม่</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={labelStyle}>ชื่อสินค้า (เช่น ไอเทมเกม, รหัสเกม)</label>
              <input type="text" required value={itemName} onChange={(e) => setItemName(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>ราคาสินค้า (บาท)</label>
              <input type="number" required min="1" value={price} onChange={(e) => setPrice(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={labelStyle}>คนกลางผู้ดูแล</label>
              <input readOnly type="text" value={middlemanName} style={{ ...inputStyle, backgroundColor: '#f3f4f6', cursor: 'not-allowed', color: '#3ecf8e', fontWeight: 'bold' }} />
            </div>
            <div>
              <label style={labelStyle}>ค่าธรรมเนียมแพลตฟอร์ม</label>
              <input readOnly type="text" value={`฿ ${fee.toLocaleString()}`} style={{ ...inputStyle, backgroundColor: '#f9fafb', color: '#666', border: '1px dashed #ccc' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={labelStyle}>ชื่อผู้ซื้อ</label>
              <input type="text" required value={buyerName} onChange={(e) => setBuyerName(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>ชื่อผู้ขาย</label>
              <input type="text" required value={sellerName} onChange={(e) => setSellerName(e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* ส่วนเลือกผู้รับผิดชอบค่าธรรมเนียม */}
          <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '12px', border: '1px solid #eee' }}>
            <label style={{ ...labelStyle, display: 'block', marginBottom: '15px' }}>ผู้รับผิดชอบค่าธรรมเนียม</label>
            <div style={{ display: 'flex', gap: '30px', color: '#444' }}>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="radio" value="buyer" checked={feePayer === 'buyer'} onChange={() => setFeePayer('buyer')} /> ผู้ซื้อ
              </label>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="radio" value="half" checked={feePayer === 'half'} onChange={() => setFeePayer('half')} /> แบ่งจ่ายคนละครึ่ง
              </label>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="radio" value="seller" checked={feePayer === 'seller'} onChange={() => setFeePayer('seller')} /> ผู้ขาย
              </label>
            </div>
          </div>

          {/* สรุปยอดเงิน */}
          {itemPrice > 0 && (
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #3ecf8e', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: '#666' }}>ยอดที่ต้องโอนเข้าบัญชีกลาง:</span>
                <span style={{ color: '#111', fontWeight: 'bold', fontSize: '18px' }}>฿ {buyerMustPay.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>ยอดสุทธิที่ผู้ขายจะได้รับ:</span>
                <span style={{ color: '#3ecf8e', fontWeight: 'bold', fontSize: '18px' }}>฿ {sellerWillReceive.toLocaleString()}</span>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'กำลังสร้างดีล...' : 'สร้างลิงก์รับกลาง'}
          </button>

        </form>
      </div>
    </div>
  );
}

// สไตล์พื้นฐาน
const labelStyle = { fontSize: '14px', color: '#666', fontWeight: 'bold', marginBottom: '8px', display: 'block' };
const inputStyle = { width: '100%', padding: '14px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', backgroundColor: '#fff', color: '#333' };
const buttonStyle = { width: '100%', padding: '18px', backgroundColor: '#3ecf8e', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 15px rgba(62, 207, 142, 0.2)' };