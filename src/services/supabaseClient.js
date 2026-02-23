import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// เมย์แอบติดเครื่องดักฟังไว้เช็คกุญแจตรงนี้นะคะ
console.log("เช็ค URL ของที่รัก:", supabaseUrl); 

export const supabase = createClient(supabaseUrl, supabaseAnonKey)