'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminMain() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!savedUser.is_admin) {
      alert('관리자 권한이 없습니다.');
      router.push('/dashboard');
    }
    setUser(savedUser);
  }, [router]);

  const menus = [
    { id: 1, title: '📅 경기 일정 관리', desc: '새 경기 생성 및 모집', path: '/admin/matches', icon: '🗓️' },
    { id: 4, title: '👥 전체 회원 관리', desc: '선수 추가, 수정 및 삭제', path: '/admin/users', icon: '👤' }, // 추가
    { id: 2, title: '📊 선수 실력 관리', desc: '선수별 실력 등급 수정', path: '/admin/skill', icon: '📈' },
    { id: 3, title: '⚽ 스쿼드 배정/확정', desc: '경기별 인원 배정 및 게시', path: '/admin/matches', icon: '🏆' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col p-6">
        
        <div className="mb-10 pt-4">
          <p className="text-[10px] font-black text-purple-600 mb-1 uppercase tracking-tighter">Admin Center</p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">관리자 센터</h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">{user?.name} 관리자님 접속 중</p>
        </div>

        <div className="flex flex-col gap-4">
          {menus.map((menu) => (
            <button 
              key={menu.id} // key를 가장 위로 올리고 고유한 ID를 사용합니다.
              onClick={() => router.push(menu.path)}
              className="bg-white p-6 rounded-[32px] border-2 border-slate-50 text-left shadow-sm hover:shadow-md hover:border-purple-100 transition-all flex items-center gap-4 active:scale-95 outline-none"
            >
              <span className="text-3xl" role="img" aria-label="icon">{menu.icon}</span>
              <div>
                <h2 className="text-lg font-black text-slate-800">{menu.title}</h2>
                <p className="text-slate-400 text-[11px] leading-tight mt-0.5">{menu.desc}</p>
              </div>
            </button>
          ))}
        </div>
        
        <button 
          onClick={() => router.push('/dashboard')}
          className="mt-auto mb-6 w-full py-4 rounded-2xl text-slate-400 text-xs font-bold hover:bg-slate-50 transition-colors uppercase tracking-widest"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}