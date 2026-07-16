import { createClient } from "@supabase/supabase-js";

/* ============================================================
   إعدادات Supabase — لا تعدّلي هذا الملف مباشرة.
   عبّئي القيم في ملف .env (انسخيه من .env.example) بعد إنشاء
   مشروعك على https://supabase.com
   راجعي README.md لخطوات الإعداد كاملة خطوة بخطوة (بدون أي بطاقة بنكية).
   ============================================================ */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
