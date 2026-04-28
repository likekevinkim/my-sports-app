import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 앞에 'export'가 붙어 있어야 다른 파일(login/page.tsx 등)에서 가져다 쓸 수 있습니다.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);