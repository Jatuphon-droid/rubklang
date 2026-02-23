import { Link } from 'react-router-dom';

export default function Home() {
  const heroImageUrl = "/hero-bg.png"; 

  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: "'Prompt', sans-serif", 
      color: '#333333',
      maxWidth: '1400px', 
      margin: '0 auto'     
    }}>
      
      {/* 🚀 Hero Banner */}
      <div style={{ 
        backgroundImage: `url('${heroImageUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        boxShadow: 'inset 0 0 0 2000px rgba(0, 0, 0, 0.65)', 
        padding: '100px 60px',
        borderRadius: '20px',
        marginBottom: '60px',
        display: 'flex',
        alignItems: 'center',
        minHeight: '500px'
      }}>
        <div style={{ maxWidth: '600px' }}>
          <h1 style={{ fontSize: '56px', margin: '0 0 25px 0', color: '#ffffff', lineHeight: '1.1', fontWeight: '800', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            ซื้อขายปลอดภัย <br/>
            <span style={{ color: '#3ecf8e', textShadow: '0 0 15px rgba(62, 207, 142, 0.5)' }}>ระดับเดียวกับธนาคาร</span>
          </h1>
          <p style={{ fontSize: '20px', color: '#f0f0f0', marginBottom: '50px', lineHeight: '1.6', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
            Rub-Klang.com แพลตฟอร์มรับกลาง (Escrow) ที่น่าเชื่อถือที่สุด ถือเงินไว้จนกว่าคุณจะได้รับสินค้า หมดปัญหาการฉ้อโกง 100%
          </p>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <Link to="/create-deal" style={{ padding: '18px 35px', backgroundColor: '#3ecf8e', color: '#0a0a0a', textDecoration: 'none', borderRadius: '8px', fontSize: '20px', fontWeight: 'bold', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(62, 207, 142, 0.3)' }}>
              เริ่มต้นสร้างดีล
            </Link>
            <button 
              onClick={() => {
                const section = document.getElementById('how-it-works');
                if (section) {
                  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              style={{ padding: '18px 35px', backgroundColor: 'rgba(255,255,255,0.9)', color: '#333333', border: '2px solid #ffffff', borderRadius: '8px', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', backdropFilter: 'blur(5px)' }}
            >
              วิธีการใช้งาน
            </button>
          </div>
        </div>
      </div>

      {/* 🛡️ Section: ความเชื่อมั่น */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '80px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '45px 20px', borderRadius: '16px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
          <h3 style={{ fontSize: '48px', margin: '0 0 10px 0', color: '#111111', fontWeight: '800' }}>100%</h3>
          <p style={{ margin: '15px 0 5px 0', color: '#333333', fontSize: '18px', fontWeight: 'bold' }}>รับประกันความปลอดภัย</p>
          <p style={{ margin: '0', color: '#666666', fontSize: '14px' }}>เงินไม่หาย ได้รับสินค้าแน่นอน 100%</p>
        </div>
        <div style={{ backgroundColor: '#ffffff', padding: '45px 20px', borderRadius: '16px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
          <h3 style={{ fontSize: '48px', margin: '0 0 10px 0', color: '#111111', fontWeight: '800' }}>24/7</h3>
          <p style={{ margin: '15px 0 5px 0', color: '#333333', fontSize: '18px', fontWeight: 'bold' }}>ตรวจสอบได้ตลอดเวลา</p>
          <p style={{ margin: '0', color: '#666666', fontSize: '14px' }}>ระบบทำงานอัตโนมัติแม่นยำทุกขั้นตอน</p>
        </div>
        <div style={{ backgroundColor: '#ffffff', padding: '45px 20px', borderRadius: '16px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
          <h3 style={{ fontSize: '48px', margin: '0 0 10px 0', color: '#111111', fontWeight: '800' }}>0%</h3>
          <p style={{ margin: '15px 0 5px 0', color: '#333333', fontSize: '18px', fontWeight: 'bold' }}>ปราศจากการฉ้อโกง</p>
          <p style={{ margin: '0', color: '#666666', fontSize: '14px' }}>ป้องกันการบิดหรือหนีงานได้สมบูรณ์แบบ</p>
        </div>
      </div>

      
      {/* 🛠️ Section: ขั้นตอนการทำงาน */}
      <h2 id="how-it-works" style={{ textAlign: 'center', fontSize: '32px', marginBottom: '40px', color: '#111111', fontWeight: 'bold', scrollMarginTop: '100px' }}>ขั้นตอนการใช้งาน</h2>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '80px' }}>
        <div style={{ flex: '1 1 300px', backgroundColor: '#ffffff', padding: '40px 30px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e0e0e0' }}>
          <div style={{ width: '80px', height: '80px', backgroundColor: '#f0fdf4', color: '#3ecf8e', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>1</div>
          <h3 style={{ color: '#111111', fontSize: '22px' }}>สร้างดีลและตกลงราคา</h3>
          <p style={{ color: '#666666', lineHeight: '1.6' }}>สร้างลิงก์ดีลรับกลาง ระบุราคาสินค้าและเงื่อนไขให้ชัดเจน</p>
        </div>
        <div style={{ flex: '1 1 300px', backgroundColor: '#ffffff', padding: '40px 30px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e0e0e0' }}>
          <div style={{ width: '80px', height: '80px', backgroundColor: '#fffbeb', color: '#f59e0b', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>2</div>
          <h3 style={{ color: '#111111', fontSize: '22px' }}>ชำระเงินเข้าบัญชีกลาง</h3>
          <p style={{ color: '#666666', lineHeight: '1.6' }}>สแกนคิวอาร์โค้ดเพื่อโอนเงินเข้าบัญชีกลาง ยอดเงินจะถูกรักษาไว้อย่างปลอดภัย</p>
        </div>
        <div style={{ flex: '1 1 300px', backgroundColor: '#ffffff', padding: '40px 30px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e0e0e0' }}>
          <div style={{ width: '80px', height: '80px', backgroundColor: '#eff6ff', color: '#3b82f6', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>3</div>
          <h3 style={{ color: '#111111', fontSize: '22px' }}>ยืนยันรับสินค้าและโอนเงิน</h3>
          <p style={{ color: '#666666', lineHeight: '1.6' }}>เมื่อผู้ซื้อกดยืนยันการรับสินค้า ระบบจะทำการโอนเงินให้ผู้ขายทันที</p>
        </div>
      </div>

      {/* 📜 Footer */}
      <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '40px', paddingBottom: '20px', textAlign: 'center', color: '#666666', fontSize: '14px' }}>
        <p>© 2026 Rub-Klang.com - แพลตฟอร์มรับกลางซื้อขายสินค้าออนไลน์ที่น่าเชื่อถือที่สุด</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginTop: '20px', flexWrap: 'wrap' }}>
          <Link to="#" style={{ color: '#333', textDecoration: 'none' }}>เกี่ยวกับเรา</Link>
          <Link to="#" style={{ color: '#333', textDecoration: 'none' }}>ข้อตกลงและเงื่อนไข</Link>
          <Link to="#" style={{ color: '#333', textDecoration: 'none' }}>นโยบายความเป็นส่วนตัว</Link>
          <Link to="#" style={{ color: '#3ecf8e', textDecoration: 'none', fontWeight: 'bold' }}>ติดต่อศูนย์ช่วยเหลือ</Link>
        </div>
      </div>

    </div>
  );
}