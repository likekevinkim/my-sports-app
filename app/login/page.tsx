'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('name', name)
      .eq('phone', phone)
      .maybeSingle();

    if (data) {
      localStorage.setItem('user', JSON.stringify(data));
      router.push('/dashboard');
    } else {
      alert('입력하신 정보가 일치하지 않습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center font-sans">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col p-10">
        
        {/* 네비게이션 헤더 */}
        <div className="flex justify-between items-center mb-16">
          <button onClick={() => router.push('/')} className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-full text-xl hover:bg-slate-100 transition-colors">🏠</button>
          <span className="text-[10px] font-black text-slate-300 tracking-[0.2em] uppercase">Auth / Login</span>
        </div>

        {/* 타이틀 영역 */}
        <div className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">
            다시 만나서<br />
            <span className="text-blue-600">반가워요!</span>
          </h1>
          <p className="mt-4 text-slate-400 font-medium text-sm">기존에 등록한 이름과<br />전화번호를 입력해 주세요.</p>
        </div>

        {/* 입력 폼 영역 */}
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Name</label>
            <input 
              type="text" 
              autoComplete="off" // 브라우저 자동완성 방지
              placeholder="이름을 입력하세요" // 연한 회색 안내 문구
              className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-[24px] font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
              onChange={(e) => setName(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Password (Phone)</label>
            <input 
              type="password" 
              autoComplete="new-password" // 브라우저 자동완성 방지
              placeholder="전화번호를 입력하세요" // 연한 회색 안내 문구
              className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-[24px] font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
              onChange={(e) => setPhone(e.target.value)} 
            />
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="mt-10 space-y-4">
          <button 
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-6 rounded-[32px] font-black text-lg shadow-xl shadow-blue-100 active:scale-[0.98] transition-all"
          >
            입장하기
          </button>
          
          <button 
            onClick={() => router.push('/signup')}
            className="w-full bg-white text-slate-400 py-4 font-bold text-sm hover:text-slate-600 transition-colors"
          >
            아직 계정이 없으신가요? <span className="text-blue-600 underline underline-offset-4 ml-1">회원가입</span>
          </button>
        </div>
      </div>
    </div>
  );
}