'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchParams, useRouter } from 'next/navigation';

interface Player {
  id: string;
  name: string;
  skill_level?: number;
  birth_date?: string; // 생년월일 필드 추가
  age?: number;        // 계산된 나이
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

  // ✅ 나이 계산 함수 (기준일: 2026년 1월 1일)
  const calculateAge = (birthDate: string | undefined) => {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const referenceDate = new Date('2026-01-01'); // 올해 1월 1일 기준
    let age = referenceDate.getFullYear() - birth.getFullYear();
    return age;
  };

  useEffect(() => {
    fetchData();
  }, [matchId]);

  const fetchData = async () => {
    if (!matchId) return;
    setLoading(true);
    
    // 선수 정보를 한 번에 가져오기 위해 profiles도 같이 활용하는 것이 좋지만, 
    // 일단 저장된 스케줄을 먼저 가져옵니다.
    const { data: scheduleData } = await supabase
      .from('schedules')
      .select('*')
      .eq('match_id', matchId)
      .order('time_slot', { ascending: true });

    const { data: profileData } = await supabase.from('profiles').select('id, name, skill_level, birth_date');

    if (scheduleData && scheduleData.length > 0 && profileData) {
      const formatted: ScheduleSlot[] = scheduleData.map((d: any) => {
        const playerIds = d.player_ids?.split(',') || [];
        const players = playerIds.map((id: string) => {
          const profile = profileData.find(p => String(p.id) === id);
          return {
            id: id,
            name: profile?.name || 'Unknown',
            skill_level: profile?.skill_level || 0,
            age: calculateAge(profile?.birth_date)
          };
        });
        return { time: d.time_slot, players };
      });
      setSchedule(formatted);
      setIsEditable(false);
    } else {
      setIsEditable(true);
    }
    setLoading(false);
  };

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

      const sortedCandidates = [...availableCandidates].sort((a, b) => {
        const aIsResting = !prevSetPlayerIds.includes(String(a.id));
        const bIsResting = !prevSetPlayerIds.includes(String(b.id));
        if (aIsResting && !bIsResting) return -1;
        if (!aIsResting && bIsResting) return 1;
        return playerPlayCounts[a.id] - playerPlayCounts[b.id];
      });

      const selected = sortedCandidates.slice(0, 10);
      selected.forEach(p => playerPlayCounts[p.id]++);
      
      tempSchedule[idx].players = selected.map(p => ({ 
        id: String(p.id), 
        name: p.name,
        skill_level: p.skill_level || 0,
        age: calculateAge(p.birth_date)
      }));
    });

    setSchedule(tempSchedule);
    setLoading(false);
  };

  // 드래그 앤 드롭 핸들러 (이전과 동일)
  const onDragStart = (player: Player, fromTime: string) => { if (isEditable) setDraggedPlayer({ player, fromTime }); };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (toTime: string) => {
    if (!draggedPlayer || !isEditable) return;
    const { player, fromTime } = draggedPlayer;
    if (fromTime === toTime) return;
    const targetSlot = schedule.find(s => s.time === toTime);
    if (targetSlot?.players.some(p => p.id === player.id)) {
      alert(`⚠️ ${player.name} 선수는 이미 이 세트에 있습니다.`);
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
        player_ids: slot.players.map(p => String(p.id)).join(','),
        avg_skill: slot.players.length > 0 ? (slot.players.reduce((sum, p) => sum + (p.skill_level || 0), 0) / slot.players.length) : 0
      }));
      await supabase.from('schedules').insert(insertData);
      alert('스쿼드가 저장되었습니다!');
      setIsEditable(false);
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans text-slate-900">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col p-6 overflow-y-auto">
        
        <div className="mb-6 pt-4 flex justify-between items-start">
          <div className="flex-1">
            <button onClick={() => router.push('/admin/matches')} className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">← Back</button>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">스쿼드 관리</h1>
          </div>
          <button 
            onClick={() => setIsEditable(!isEditable)} 
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${isEditable ? 'bg-slate-900 text-white' : 'bg-amber-500 text-white'}`}
          >
            {isEditable ? '수정 완료' : '수정 활성화'}
          </button>
        </div>

        {isEditable && (
          <button onClick={runAutoAssign} className="w-full bg-blue-600 text-white py-4 rounded-[24px] font-black text-sm mb-8 shadow-lg">
            ⚡ 자동 배정 알고리즘 실행
          </button>
        )}

        <div className="space-y-6 pb-32">
          {schedule.map((slot) => {
            const isShortage = slot.players.length < 10;
            
            // ✅ 실시간 통계 계산
            const avgSkill = slot.players.length > 0
              ? (slot.players.reduce((sum, p) => sum + (p.skill_level || 0), 0) / slot.players.length).toFixed(1)
              : "0.0";
            
            const avgAge = slot.players.length > 0
              ? (slot.players.reduce((sum, p) => sum + (p.age || 0), 0) / slot.players.length).toFixed(1)
              : "0.0";

            return (
              <div key={slot.time} onDragOver={onDragOver} onDrop={() => onDrop(slot.time)}
                className={`p-5 rounded-[32px] border-2 transition-all ${isShortage ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-50'}`}>
                
                <div className="flex justify-between items-start mb-4 px-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-800 text-lg">{slot.time} SET</span>
                      {isShortage && <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold animate-pulse">SHORTAGE</span>}
                    </div>
                    {/* ✅ 평균 점수 및 평균 나이 표시 */}
                    <div className="mt-1 flex gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Avg Skill</span>
                        <span className="text-[11px] font-black text-blue-600">{avgSkill}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Avg Age</span>
                        <span className="text-[11px] font-black text-emerald-600">{avgAge}세</span>
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full ${isShortage ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-500'}`}>
                    {slot.players.length} / 10
                  </span>
                </div>
                
                <div className="space-y-2">
                  {slot.players.map((p) => (
                    <div key={p.id} draggable={isEditable} onDragStart={() => onDragStart(p, slot.time)}
                      className={`flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-transparent ${isEditable ? 'cursor-grab' : ''}`}>
                      <div className="flex items-center">
                        {isEditable && <span className="mr-3 text-slate-300 text-xs">⠿</span>}
                        <span className="text-sm font-bold text-slate-700">
                          {p.name} <span className="text-slate-400 font-normal ml-1">({p.age})</span>
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-300">Lv.{p.skill_level}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {isEditable && (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-6 bg-gradient-to-t from-white to-transparent">
            <button onClick={handleConfirm} disabled={saving} className="w-full bg-slate-900 text-white py-5 rounded-[30px] font-black text-xl shadow-2xl">
              {saving ? 'SAVING...' : '최종 확정'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssignPage() {
  return <Suspense fallback={<div>Loading...</div>}><AssignContent /></Suspense>;
}