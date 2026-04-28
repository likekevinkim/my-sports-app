'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [mode, setMode] = useState<'menu' | 'input' | 'result'>('menu'); // 화면 모드 상태
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]); // 확정 스쿼드 데이터
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const timeSlots: string[] = [];
  let current = new Date();
  current.setHours(8, 0, 0);
  const end = new Date();
  end.setHours(11, 40, 0);
  while (current <= end) {
    timeSlots.push(current.toTimeString().slice(0, 5));
    current.setMinutes(current.getMinutes() + 20);
  }

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(savedUser));
    fetchMatches();
  }, [router]);

  const fetchMatches = async () => {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('is_active', true)
      .order('match_date', { ascending: true });
    
    if (data) setMatches(data);
    setLoading(false);
  };

  // 확정 스쿼드 불러오기
  const fetchFinalSchedules = async (matchId: string) => {
    const { data } = await supabase
      .from('schedules')
      .select('*')
      .eq('match_id', matchId)
      .order('time_slot', { ascending: true });
    if (data) setResults(data);
  };

  const handleSelectMatch = async (match: any) => {
    setSelectedMatch(match);
    if (mode === 'input') {
      const { data: attendance } = await supabase
        .from('attendance')
        .select('available_times')
        .eq('match_id', match.id)
        .eq('user_id', user.id)
        .maybeSingle();
      setSelectedTimes(attendance?.available_times || []);
    } else {
      fetchFinalSchedules(match.id);
    }
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from('attendance')
      .upsert({
        user_id: user.id,
        match_id: selectedMatch.id,
        available_times: selectedTimes,
      }, { onConflict: 'match_id, user_id' });

    if (!error) {
      alert('스케줄 저장이 완료되었습니다!');
      setMode('menu');
      setSelectedMatch(null);
      window.scrollTo(0, 0);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col p-6 overflow-y-auto">
        
        {/* 헤더 (모드에 상관없이 항상 표시) */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <p className="text-[10px] font-black text-blue-500 mb-1 tracking-tighter uppercase">Player Dashboard</p>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{user?.name} <span className="text-xl">선수</span></h1>
            <button onClick={() => setMode('menu')} className="text-[10px] font-bold text-blue-400 mt-2 hover:underline mr-4">메뉴로 돌아가기</button>
            <button onClick={() => { localStorage.removeItem('user'); router.push('/login'); }} className="text-[10px] font-bold text-slate-400 mt-2 hover:text-red-400 transition-colors">로그아웃</button>
          </div>
          {user?.is_admin && (
            <button onClick={() => router.push('/admin')} className="bg-purple-600 text-white px-4 py-2 rounded-2xl text-[11px] font-black">ADMIN</button>
          )}
        </div>

        {/* --- 1. 메인 메뉴 모드 --- */}
        {mode === 'menu' && (
          <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300">
            <button 
              onClick={() => setMode('input')}
              className="group bg-blue-600 p-8 rounded-[32px] text-left shadow-xl shadow-blue-100 active:scale-95 transition-all"
            >
              <span className="text-4xl mb-4 block">📅</span>
              <h3 className="text-white text-xl font-black">참가 스케줄 입력</h3>
              <p className="text-blue-100 text-xs mt-1">경기에 참여 가능한 시간을 선택합니다.</p>
            </button>

            <button 
              onClick={() => setMode('result')}
              className="group bg-slate-900 p-8 rounded-[32px] text-left shadow-xl shadow-slate-200 active:scale-95 transition-all"
            >
              <span className="text-4xl mb-4 block">⚽</span>
              <h3 className="text-white text-xl font-black">경기 스쿼드 확인</h3>
              <p className="text-slate-400 text-xs mt-1">관리자가 확정한 최종 명단을 확인합니다.</p>
            </button>
          </div>
        )}

        {/* --- 2. 스케줄 입력 및 스쿼드 확인 공통 경기 선택 부분 --- */}
        {mode !== 'menu' && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <h2 className="text-[11px] font-black text-slate-400 mb-4 tracking-widest uppercase px-1">
              {mode === 'input' ? '1. 스케줄 입력 대상 선택' : '1. 결과를 확인할 경기 선택'}
            </h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-6">
              {matches.map(m => (
                <button
                  key={m.id}
                  onClick={() => handleSelectMatch(m)}
                  className={`flex-shrink-0 w-24 h-24 rounded-3xl border-2 flex flex-col items-center justify-center transition-all ${
                    selectedMatch?.id === m.id 
                    ? 'border-blue-600 bg-blue-600 text-white shadow-lg' 
                    : 'border-slate-100 bg-slate-50 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] font-bold opacity-60">{m.match_date.split('-')[1]}월</span>
                  <span className="text-2xl font-black">{m.match_date.split('-')[2]}</span>
                </button>
              ))}
            </div>

            {/* --- 2-A. 스케줄 입력 폼 --- */}
            {mode === 'input' && selectedMatch && (
              <div className="mt-4 animate-in fade-in slide-in-from-bottom-4">
                <button onClick={() => setSelectedTimes(selectedTimes.length === timeSlots.length ? [] : timeSlots)}
                  className="w-full mb-4 py-4 rounded-3xl font-black text-xs border-2 bg-slate-50 border-slate-50 text-slate-400">
                  {selectedTimes.length === timeSlots.length ? '✓ 전체 해제' : '＋ 모든 시간대 선택'}
                </button>
                <div className="grid grid-cols-3 gap-3 mb-10">
                  {timeSlots.map(time => (
                    <button key={time} onClick={() => setSelectedTimes(prev => prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time])}
                      className={`py-5 rounded-2xl text-sm font-black border-2 transition-all ${selectedTimes.includes(time) ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-300'}`}>
                      {time}
                    </button>
                  ))}
                </div>
                <button onClick={handleSave} className="w-full bg-blue-600 text-white py-5 rounded-[28px] font-black text-lg shadow-xl shadow-blue-200">
                  스케줄 확정 저장
                </button>
              </div>
            )}

            {/* --- 2-B. 최종 스쿼드 결과 표시 --- */}
            {mode === 'result' && selectedMatch && (
              <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-slate-900 font-black text-lg mb-4">🏆 최종 배정 명단</h3>
                {results.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm bg-slate-50 rounded-3xl border-2 border-dashed">
                    아직 관리자가 스쿼드를 확정하지 않았습니다.
                  </div>
                ) : (
                  results.map((res) => (
                    <div key={res.id} className={`p-5 rounded-3xl border-2 ${res.player_names.includes(user.name) ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-white'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-black text-slate-900">{res.time_slot} 세트</span>
                        {res.player_names.includes(user.name) && <span className="bg-blue-500 text-white text-[10px] px-2 py-1 rounded-full font-bold">내 경기</span>}
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">{res.player_names}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}