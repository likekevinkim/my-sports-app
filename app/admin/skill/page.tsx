'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SkillManagement() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('name');
    if (data) setPlayers(data);
    setLoading(false);
  };

  // 실력 수치 즉시 업데이트
  const updateSkill = async (id: string, level: number) => {
    const { error } = await supabase
      .from('profiles')
      .update({ skill_level: level })
      .eq('id', id);

    if (!error) {
      // 로컬 상태 업데이트 (다시 fetch하지 않고 즉시 반영)
      setPlayers(prev => prev.map(p => p.id === id ? { ...p, skill_level: level } : p));
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col p-6">
        
        {/* 헤더 */}
        <div className="mb-8 pt-4">
          <button onClick={() => router.push('/admin')} className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
            ← Back to Admin
          </button>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">선수 실력 관리</h1>
          <p className="text-slate-400 text-xs mt-1 font-medium italic">레벨을 클릭하면 즉시 반영됩니다.</p>
        </div>

        {/* 선수 실력 리스트 */}
        <div className="flex-1 space-y-4 overflow-y-auto pb-10">
          {loading ? (
            <p className="text-center py-20 text-slate-300 font-bold">데이터 불러오는 중...</p>
          ) : (
            players.map(player => (
              <div key={player.id} className="p-5 border-2 border-slate-50 rounded-[32px] bg-white shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-black text-slate-800">{player.name}</span>
                  <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    Level {player.skill_level}
                  </span>
                </div>
                
                {/* 실력 선택 바 (1~5단계를 버튼으로 배치) */}
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((lv) => (
                    <button
                      key={lv}
                      onClick={() => updateSkill(player.id, lv)}
                      className={`flex-1 py-3 rounded-xl font-black text-xs transition-all duration-200 ${
                        player.skill_level === lv
                          ? 'bg-slate-900 text-white scale-105 shadow-md'
                          : 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-500'
                      }`}
                    >
                      {lv}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-slate-50">
          <p className="text-[10px] text-center text-slate-300 font-bold uppercase tracking-widest">
            Hanseong-Baekje FC Admin System
          </p>
        </div>
      </div>
    </div>
  );
}