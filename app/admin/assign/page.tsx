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
    const { data } = await supabase.from('schedules').select('*').eq('match_id', matchId).order('time_slot', { ascending: true });

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

  // ✅ [복구] 자동 배정 알고리즘
  const runAutoAssign = async () => {
    if (!matchId) return alert('경기 정보가 없습니다.');
    if (!confirm('기존 배정 내용이 초기화되고 새로 배정됩니다. 진행하시겠습니까?')) return;
    
    setLoading(true);
    const { data: players } = await supabase.from('profiles').select('*');
    const { data: attendance } = await supabase.from('attendance').select('*').eq('match_id', matchId);

    if (!players || !attendance) {
      setLoading(false);
      return alert('데이터를 불러오지 못했습니다.');
    }

    let tempSchedule: ScheduleSlot[] = timeSlots.map(time => ({ time, players: [] }));
    let playerCounts: any = {};
    players.forEach(p => playerCounts[p.id] = 0);

    timeSlots.forEach((time, idx) => {
      const candidates = players.filter(p => {
        const att = attendance.find(a => a.user_id === p.id);
        const isResting = idx === 0 || !tempSchedule[idx - 1].players.find((sp: any) => sp.id === p.id);
        return att?.available_times.includes(time) && isResting;
      }).sort((a, b) => playerCounts[a.id] - playerCounts[b.id]);

      const selected = candidates.slice(0, 10);
      selected.forEach(p => playerCounts[p.id]++);
      tempSchedule[idx].players = selected.map(p => ({ id: String(p.id), name: p.name }));
    });

    setSchedule(tempSchedule);
    setLoading(false);
  };

  // 드래그 핸들러 (기존과 동일)
  const onDragStart = (player: Player, fromTime: string) => { if (isEditable) setDraggedPlayer({ player, fromTime }); };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (toTime: string) => {
    if (!draggedPlayer || !isEditable) return;
    const { player, fromTime } = draggedPlayer;
    if (fromTime === toTime) return;

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
      alert('스쿼드가 최종 확정되었습니다! 🏆');
      setIsEditable(false);
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans text-slate-900">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col p-6 overflow-y-auto">
        
        {/* 헤더 */}
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

        {/* ✅ [복구] 자동 배정 버튼: 수정 모드일 때만 노출 */}
        {isEditable && (
          <button 
            onClick={runAutoAssign}
            disabled={loading}
            className="w-full bg-blue-50 text-blue-600 py-4 rounded-[24px] font-black text-sm mb-8 border-2 border-blue-100 shadow-sm active:scale-95 transition-all"
          >
            {loading ? '배정 계산 중...' : '⚡ 자동 배정 알고리즘 실행'}
          </button>
        )}

        {/* 스쿼드 리스트 */}
        <div className="space-y-6 pb-32">
          {schedule.map((slot) => {
            const isInvalidCount = slot.players.length !== 10;
            return (
              <div 
                key={slot.time}
                onDragOver={onDragOver}
                onDrop={() => onDrop(slot.time)}
                className={`p-5 rounded-[32px] border-2 transition-all duration-300 ${isInvalidCount ? 'bg-yellow-50 border-yellow-100' : 'bg-slate-50 border-slate-50'}`}
              >
                <div className="flex justify-between items-center mb-4 px-1">
                  <span className="font-black text-slate-800 text-lg">{slot.time} SET</span>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full ${isInvalidCount ? 'bg-yellow-200 text-yellow-700' : 'bg-slate-200 text-slate-500'}`}>{slot.players.length}명</span>
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
                  {slot.players.length === 0 && <div className="py-8 border-2 border-dashed border-slate-200 rounded-2xl text-center text-[10px] text-slate-300 font-bold italic">여기로 드래그</div>}
                </div>
              </div>
            );
          })}
        </div>

        {isEditable && (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-6 bg-gradient-to-t from-white via-white to-transparent">
            <button onClick={handleConfirm} disabled={saving} className="w-full bg-blue-600 text-white py-5 rounded-[30px] font-black text-xl shadow-2xl active:scale-95 transition-all">
              {saving ? '데이터 저장 중...' : '최종 스쿼드 확정 게시'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssignPage() {
  return <Suspense fallback={<div className="p-10 text-center font-bold text-slate-400">Loading...</div>}><AssignContent /></Suspense>;
}