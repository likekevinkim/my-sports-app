'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchParams, useRouter } from 'next/navigation';

interface Player {
  id: string;
  name: string;
  skill_level?: number;
}

interface ScheduleSlot {
  time: string;
  players: Player[];
}

function AssignContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const matchId = searchParams.get('matchId');

  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draggedPlayer, setDraggedPlayer] = useState<{ player: Player; fromTime: string } | null>(null);

  const timeSlots = ["08:00", "08:20", "08:40", "09:00", "09:20", "09:40", "10:00", "10:20", "10:40", "11:00", "11:20", "11:40"];

  useEffect(() => {
    fetchData();
  }, [matchId]);

  const fetchData = async () => {
    if (!matchId) return;
    setLoading(true);
    const { data } = await supabase
      .from('schedules')
      .select('*')
      .eq('match_id', matchId)
      .order('time_slot', { ascending: true });

    if (data && data.length > 0) {
      const formatted: ScheduleSlot[] = data.map((d: any) => ({
        time: d.time_slot,
        players: d.player_names ? d.player_names.split(', ').map((name: string, i: number) => ({
          id: d.player_ids?.split(',')[i] || `p-${name}-${i}`,
          name: name
        })) : []
      }));
      setSchedule(formatted);
      setIsEditable(false);
    } else {
      setIsEditable(true);
    }
    setLoading(false);
  };

  // ✅ 핵심: 10명 강제 채우기 및 휴식 우선 배정 알고리즘
  const runAutoAssign = async () => {
    if (!matchId) return alert('경기 정보가 없습니다.');
    if (!confirm('기존 배정 내용이 초기화되고 새로 배정됩니다. 진행하시겠습니까?')) return;
    
    setLoading(true);
    const { data: allProfiles } = await supabase.from('profiles').select('*');
    const { data: attendance } = await supabase.from('attendance').select('*').eq('match_id', matchId);

    if (!allProfiles || !attendance) {
      setLoading(false);
      return alert('데이터를 불러오지 못했습니다.');
    }

    const attendingUserIds = attendance.map(a => a.user_id);
    const attendingPlayers = allProfiles.filter(p => attendingUserIds.includes(p.id));

    let tempSchedule: ScheduleSlot[] = timeSlots.map(time => ({ time, players: [] }));
    let playerPlayCounts: Record<string, number> = {}; 
    attendingPlayers.forEach(p => playerPlayCounts[p.id] = 0);

    timeSlots.forEach((time, idx) => {
      const availableCandidates = attendingPlayers.filter(p => {
        const att = attendance.find(a => a.user_id === p.id);
        return att?.available_times.includes(time);
      });

      const prevSetPlayerIds = idx > 0 ? tempSchedule[idx - 1].players.map(p => String(p.id)) : [];

      // 1순위: 쉬었던 사람, 2순위: 총 경기 수 적은 사람
      const sortedCandidates = [...availableCandidates].sort((a, b) => {
        const aIsResting = !prevSetPlayerIds.includes(String(a.id));
        const bIsResting = !prevSetPlayerIds.includes(String(b.id));

        if (aIsResting && !bIsResting) return -1;
        if (!aIsResting && bIsResting) return 1;
        return playerPlayCounts[a.id] - playerPlayCounts[b.id];
      });

      // 무조건 상위 10명 추출 (연속 경기 선수가 포함되더라도 10명을 채움)
      const selected = sortedCandidates.slice(0, 10);
      
      selected.forEach(p => playerPlayCounts[p.id]++);
      tempSchedule[idx].players = selected.map(p => ({ 
        id: String(p.id), 
        name: p.name,
        skill_level: p.skill_level 
      }));
    });

    setSchedule(tempSchedule);
    setLoading(false);
  };

  const onDragStart = (player: Player, fromTime: string) => { 
    if (isEditable) setDraggedPlayer({ player, fromTime }); 
  };
  
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  
  const onDrop = (toTime: string) => {
    if (!draggedPlayer || !isEditable) return;
    const { player, fromTime } = draggedPlayer;
    if (fromTime === toTime) return;

    // 중복 체크
    const targetSlot = schedule.find(s => s.time === toTime);
    if (targetSlot?.players.some(p => p.name === player.name)) {
      alert(`⚠️ ${player.name} 선수는 이미 ${toTime} 세트에 있습니다.`);
      return;
    }

    setSchedule(prev => prev.map(slot => {
      if (slot.time === fromTime) return { ...slot, players: slot.players.filter(p => p.id !== player.id) };
      if (slot.time === toTime) return { ...slot, players: [...slot.players, player] };
      return slot;
    }));
    setDraggedPlayer(null);
  };

  const handleConfirm = async () => {
    if (!matchId) return;
    setSaving(true);
    try {
      await supabase.from('schedules').delete().eq('match_id', matchId);
      const insertData = schedule.map((slot) => ({
        match_id: parseInt(matchId),
        time_slot: slot.time,
        player_names: slot.players.map(p => p.name).join(', '),
        player_ids: slot.players.map(p => p.id).join(','),
        avg_skill: 0 
      }));
      await supabase.from('schedules').insert(insertData);
      alert('스쿼드가 성공적으로 저장되었습니다! 🏆');
      setIsEditable(false);
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans text-slate-900">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col p-6 overflow-y-auto">
        
        <div className="mb-6 pt-4 flex justify-between items-start">
          <div className="flex-1">
            <button onClick={() => router.push('/admin/matches')} className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">← Back to Matches</button>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">스쿼드 {isEditable ? '편집' : '조회'}</h1>
          </div>
          <button 
            onClick={() => setIsEditable(!isEditable)} 
            className={`px-4 py-2 rounded-xl text-xs font-black shadow-lg transition-all ${isEditable ? 'bg-slate-900 text-white' : 'bg-amber-500 text-white'}`}
          >
            {isEditable ? '수정 완료' : '수정 활성화'}
          </button>
        </div>

        {isEditable && (
          <button 
            onClick={runAutoAssign}
            disabled={loading}
            className="w-full bg-blue-50 text-blue-600 py-4 rounded-[24px] font-black text-sm mb-8 border-2 border-blue-100 shadow-sm active:scale-95 transition-all"
          >
            {loading ? '배정 중...' : '⚡ 자동 배정 알고리즘 실행'}
          </button>
        )}

        <div className="space-y-6 pb-32">
          {schedule.map((slot) => {
            const isShortage = slot.players.length < 10;
            return (
              <div 
                key={slot.time}
                onDragOver={onDragOver}
                onDrop={() => onDrop(slot.time)}
                className={`p-5 rounded-[32px] border-2 transition-all duration-300 ${isShortage ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-50'}`}
              >
                <div className="flex justify-between items-center mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-800 text-lg">{slot.time} SET</span>
                    {isShortage && (
                      <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                        선수부족
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full ${isShortage ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-500'}`}>
                    {slot.players.length} / 10명
                  </span>
                </div>
                <div className="space-y-2">
                  {slot.players.map((p) => (
                    <div 
                      key={p.id}
                      draggable={isEditable}
                      onDragStart={() => onDragStart(p, slot.time)}
                      className={`flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-transparent ${isEditable ? 'cursor-grab active:cursor-grabbing hover:border-blue-300' : ''}`}
                    >
                      <span className="text-sm font-bold text-slate-700">{isEditable && <span className="mr-2 text-slate-300">:::</span>}{p.name}</span>
                    </div>
                  ))}
                  {slot.players.length === 0 && <div className="py-8 border-2 border-dashed border-slate-200 rounded-2xl text-center text-[10px] text-slate-300 font-bold italic uppercase">Drop Player Here</div>}
                </div>
              </div>
            );
          })}
        </div>

        {isEditable && (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-6 bg-gradient-to-t from-white via-white to-transparent">
            <button onClick={handleConfirm} disabled={saving} className="w-full bg-blue-600 text-white py-5 rounded-[30px] font-black text-xl shadow-2xl active:scale-95 transition-all">
              {saving ? '저장 중...' : '최종 스쿼드 확정 게시'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssignPage() {
  return <Suspense fallback={<div className="p-10 text-center font-bold text-slate-400 uppercase tracking-widest">Loading...</div>}><AssignContent /></Suspense>;
}