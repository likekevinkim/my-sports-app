'use client';

import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col items-center justify-center p-8 text-center">
        
        {/* 상단 로고/아이콘 영역 */}
        <div className="mb-10 animate-bounce">
          <span className="text-8xl">⚽</span>
        </div>

        {/* 메인 타이틀 */}
        <div className="mb-12">
          <p className="text-blue-600 font-black text-sm tracking-widest mb-2 uppercase">Seoul Amateur Football</p>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">
            한성백제 FC<br />
            <span className="text-blue-600">스쿼드 관리</span>
          </h1>
          <p className="mt-4 text-slate-400 font-medium text-sm">
            공정한 배정, 즐거운 축구<br />
            지금 바로 시작해보세요.
          </p>
        </div>

        {/* 시작 버튼 영역 */}
        <div className="w-full space-y-4">
          <button 
            onClick={() => router.push('/login')}
            className="w-full bg-slate-900 text-white py-5 rounded-[28px] font-black text-lg shadow-xl shadow-slate-200 active:scale-[0.98] transition-all"
          >
            로그인하기
          </button>
          
          <button 
            onClick={() => router.push('/signup')}
            className="w-full bg-white text-slate-900 py-5 rounded-[28px] font-black text-lg border-2 border-slate-100 hover:bg-slate-50 active:scale-[0.98] transition-all"
          >
            신규 회원가입
          </button>
        </div>

        <p className="mt-12 text-[10px] text-slate-300 font-bold tracking-widest uppercase">
          Since 1976 Hanseong-Baekje FC
        </p>
      </div>
    </div>
  );
}