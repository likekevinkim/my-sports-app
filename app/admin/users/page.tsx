'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function UserManagement() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 입력 폼 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [skill, setSkill] = useState(1);

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

  // 회원 추가 또는 수정 저장
  const handleSave = async () => {
    if (!name || !phone) return alert('이름과 번호를 입력하세요.');

    if (editingId) {
      // 수정 모드
      const { error } = await supabase
        .from('profiles')
        .update({ name, phone, skill_level: skill })
        .eq('id', editingId);
      if (!error) alert('수정되었습니다.');
    } else {
      // 신규 등록 모드
      const { error } = await supabase
        .from('profiles')
        .insert([{ name, phone, skill_level: skill, is_admin: false }]);
      if (!error) alert('등록되었습니다.');
    }

    closeModal();
    fetchPlayers();
  };

  // 회원 삭제
  const handleDelete = async (id: string, playerName: string) => {
    if (confirm(`${playerName} 선수를 정말 삭제하시겠습니까?`)) {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (!error) fetchPlayers();
    }
  };

  const openModal = (player?: any) => {
    if (player) {
      setEditingId(player.id);
      setName(player.name);
      setPhone(player.phone);
      setSkill(player.skill_level);
    } else {
      setEditingId(null);
      setName('');
      setPhone('');
      setSkill(1);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col p-6">
        
        {/* 헤더 */}
        <div className="mb-8 pt-4">
          <button onClick={() => router.push('/admin')} className="text-[10px] font-black text-slate-400 mb-2 uppercase">← Back to Admin</button>
          <div className="flex justify-between items-end">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">회원 관리</h1>
            <button onClick={() => openModal()} className="bg-blue-600 text-white w-10 h-10 rounded-full font-black text-xl shadow-lg shadow-blue-100 flex items-center justify-center">＋</button>
          </div>
        </div>

        {/* 선수 목록 */}
        <div className="flex-1 space-y-3 overflow-y-auto pb-10">
          {loading ? (
            <p className="text-center py-20 text-slate-300 font-bold">선수 명단 로딩 중...</p>
          ) : (
            players.map(player => (
              <div key={player.id} className="p-5 border-2 border-slate-50 rounded-[28px] bg-white flex justify-between items-center shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-slate-800">{player.name}</span>
                    <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">Lv.{player.skill_level}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold tracking-tighter mt-0.5">{player.phone}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(player)} className="text-xs font-black text-slate-400 bg-slate-50 px-3 py-2 rounded-xl hover:text-blue-600">수정</button>
                  <button onClick={() => handleDelete(player.id, player.name)} className="text-xs font-black text-red-300 bg-red-50/50 px-3 py-2 rounded-xl hover:text-red-600">삭제</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 신규등록/수정 모달(팝업) */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-end z-50">
            <div className="w-full max-w-[430px] bg-white rounded-t-[40px] p-8 animate-in slide-in-from-bottom-full duration-300">
              <h2 className="text-2xl font-black text-slate-900 mb-6">{editingId ? '선수 정보 수정' : '신규 선수 등록'}</h2>
              
              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">이름</label>
                  <input value={name} onChange={e => setName(e.target.value)} type="text" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold mt-1 outline-none focus:ring-2 focus:ring-blue-500" placeholder="이름 입력" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">전화번호</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold mt-1 outline-none focus:ring-2 focus:ring-blue-500" placeholder="01012345678" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">실력 레벨 (1-5)</label>
                  <div className="flex gap-2 mt-1">
                    {[1, 2, 3, 4, 5].map(lv => (
                      <button key={lv} onClick={() => setSkill(lv)} className={`flex-1 py-3 rounded-xl font-black transition-all ${skill === lv ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>{lv}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={closeModal} className="flex-1 py-5 rounded-[24px] font-black text-slate-400 bg-slate-100">취소</button>
                <button onClick={handleSave} className="flex-2 bg-blue-600 text-white py-5 px-10 rounded-[24px] font-black text-lg shadow-xl shadow-blue-100">저장하기</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}