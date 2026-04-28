'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Match {
  id: number;
  match_date: string;
}

export default function MatchAdmin() {
  const [matchDate, setMatchDate] = useState<string>('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [confirmedMatchIds, setConfirmedMatchIds] = useState<number[]>([]); // 확정된 경기 ID들
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const fetchMatches = async () => {
    setLoading(true);
    try {
      // 1. 전체 경기 목록 가져오기
      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: false });

      // 2. 이미 스케줄이 확정된 경기 ID 목록 가져오기
      const { data: schedulesData } = await supabase
        .from('schedules')
        .select('match_id');

      if (matchesData) setMatches(matchesData);
      if (schedulesData) {
        // 중복 제거 후 ID 배열 생성
        const ids = Array.from(new Set(schedulesData.map((s: any) => s.match_id)));
        setConfirmedMatchIds(ids as number[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  // 경기 생성/수정/삭제 로직 (기존과 동일)
  const createMatch = async () => {
    if (!matchDate) return alert('날짜를 선택하세요.');
    const { error } = await supabase.from('matches').insert([{ match_date: matchDate }]);
    if (!error) { fetchMatches(); setMatchDate(''); }
  };

  const deleteMatch = async (id: number) => {
    if (!confirm('경기를 삭제하면 관련 출석 및 스쿼드 데이터가 모두 삭제됩니다.')) return;
    await supabase.from('schedules').delete().eq('match_id', id);
    await supabase.from('attendance').delete().eq('match_id', id);
    const { error } = await supabase.from('matches').delete().eq('id', id);
    if (!error) fetchMatches();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col p-6 overflow-y-auto">
        
        <div className="mb-8 pt-4">
          <button onClick={() => router.push('/admin')} className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">← Back to Admin</button>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">경기 일정 관리</h1>
        </div>

        {/* 새 경기 생성 */}
        <div className="bg-slate-900 p-6 rounded-[32px] mb-10 shadow-xl shadow-slate-200">
          <input 
            type="date" 
            value={matchDate} 
            onChange={(e) => setMatchDate(e.target.value)} 
            className="w-full bg-slate-800 border-none p-4 rounded-2xl text-white font-bold mb-3 outline-none" 
          />
          <button onClick={createMatch} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black active:scale-95 transition-all">새 경기 모집 시작</button>
        </div>

        {/* 경기 리스트 */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-center py-10 text-slate-300 font-bold">로딩 중...</p>
          ) : (
            matches.map((m) => {
              const isConfirmed = confirmedMatchIds.includes(m.id);
              return (
                <div key={m.id} className={`p-5 border-2 rounded-[32px] flex justify-between items-center bg-white shadow-sm ${isConfirmed ? 'border-blue-50' : 'border-slate-50'}`}>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-black mb-1 uppercase tracking-tighter">Match Date</span>
                    <span className="text-xl font-black text-slate-800">{m.match_date}</span>
                  </div>
                  
                  <div className="flex flex-col gap-2 items-end">
                    <button 
                      onClick={() => router.push(`/admin/assign?matchId=${m.id}`)} 
                      className={`px-4 py-2 rounded-xl text-[11px] font-black shadow-md transition-all active:scale-95 ${
                        isConfirmed 
                          ? 'bg-blue-50 text-blue-600 border border-blue-100' // 확정된 경우
                          : 'bg-slate-900 text-white' // 미확정인 경우
                      }`}
                    >
                      {isConfirmed ? '확정 스쿼드 보기' : '스쿼드 관리/배정'}
                    </button>
                    <button onClick={() => deleteMatch(m.id)} className="text-[10px] text-red-200 font-bold hover:text-red-500">삭제</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}