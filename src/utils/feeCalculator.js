// src/utils/feeCalculator.js

export const calculateTransactionFee = (price) => {
  const amount = parseFloat(price);
  
  if (!amount || amount <= 0) return 0;

  // เรทตามที่ประธานบริษัทสั่งการ (ไม่มีเพดานกั้น): 
  // 0-1000 = 8%, 1001-5000 = 5%, 5001-10000 = 3%, 10000+ = 2%
  if (amount <= 1000) {
    return amount * 0.08; 
  } else if (amount <= 5000) {
    return amount * 0.05; 
  } else if (amount <= 10000) {
    return amount * 0.03; 
  } else {
    // ยอดเกิน 10,000 บาท คิด 2% ล้วนๆ ปลดล็อคขีดจำกัดความรวย!
    return amount * 0.02; 
  }
};