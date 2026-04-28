'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SignUp() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const router = useRouter();

  const handleSignUp = async () => {
    if (!name || !phone) return alert('모든 정보를 입력해 주세요.');
    
    const { error } = await supabase.from('profiles').insert([{ 
      name, 
      phone, 
      skill_level: 1, 
      is_admin: false 
    }]);

    if (error) {
      alert('이미 등록된 번호이거나 오류가 발생했습니다.');
    } else {
      alert('한성백제 FC 멤버가 되신 것을 환영합니다!');
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center font-sans">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col p-10">
        
        {/* 네비게이션 헤더 */}
        <div className="flex justify-between items-center mb-16">
          <button onClick={() => router.push('/')} className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-full text-xl hover:bg-slate-100 transition-colors">🏠</button>
          <span className="text-[10px] font-black text-slate-300 tracking-[0.2em] uppercase">Auth / Join</span>
        </div>

        {/* 타이틀 영역 */}
        <div className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">
            새로운 멤버<br />
            <span className="text-slate-900">등록하기</span>
          </h1>
          <p className="mt-4 text-slate-400 font-medium text-sm">한성백제 FC 스쿼드 관리 서비스 이용을 위해<br />기본 정보를 등록합니다.</p>
        </div>

        {/* 입력 폼 영역 */}
        <div className="flex-1 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Full Name</label>
            <input 
              type="text" 
              placeholder="본인의 실명을 입력하세요"
              className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-[24px] font-bold text-slate-900 focus:bg-white focus:border-slate-100 focus:ring-4 focus:ring-slate-50 transition-all outline-none"
              onChange={(e) => setName(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Phone Number</label>
            <input 
              type="tel" 
              placeholder="숫자만 입력 (01012345678)"
              className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-[24px] font-bold text-slate-900 focus:bg-white focus:border-slate-100 focus:ring-4 focus:ring-slate-50 transition-all outline-none"
              onChange={(e) => setPhone(e.target.value)} 
            />
          </div>
          <p className="text-[11px] text-slate-300 font-medium px-2 leading-relaxed">
            * 가입 시 기본 실력 등급은 <span className="text-slate-400 font-bold underline">1단계</span>로 설정되며, 추후 관리자에 의해 조정될 수 있습니다.
          </p>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="mt-10 space-y-4">
          <button 
            onClick={handleSignUp}
            className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-lg shadow-xl shadow-slate-200 active:scale-[0.98] transition-all"
          >
            가입 완료하기
          </button>
          
          <button 
            onClick={() => router.push('/login')}
            className="w-full bg-white text-slate-400 py-4 font-bold text-sm hover:text-slate-600 transition-colors"
          >
            이미 계정이 있으신가요? <span className="text-slate-900 underline underline-offset-4 ml-1">로그인</span>
          </button>
        </div>
      </div>
    </div>
  );
}