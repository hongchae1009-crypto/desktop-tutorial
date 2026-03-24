import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ResearchNote } from '@/types/note';
import { MOCK_NOTES } from '@/data/noteData';
import NoteListPage from './NoteListPage';
import NoteEditorPage from './NoteEditorPage';

type View = 'list' | 'editor';

const SNB_SECTIONS = (onNavigate: (p: string) => void) => [
  { label: '정보', items: [{ icon: '💬', name: '나의질문', active: false, badge: '', onClick: undefined }] },
  { label: '내 연구실', items: [
    { icon: '📢', name: '연구실 공지사항', active: false, badge: '', onClick: undefined },
    { icon: '⚙️', name: '계정정보', active: false, badge: '', onClick: undefined },
    { icon: '👥', name: '그룹', active: false, badge: '', onClick: undefined },
    { icon: '📁', name: '프로젝트', active: false, badge: '', onClick: undefined },
  ]},
  { label: '인벤토리', items: [
    { icon: '🛒', name: '시약 구매', active: false, badge: '', onClick: undefined },
    { icon: '📋', name: '구매 현황', active: false, badge: '', onClick: undefined },
    { icon: '🧪', name: '시약장', active: false, badge: '', onClick: () => onNavigate('/reagent') },
    { icon: '📦', name: '소모품', active: false, badge: '', onClick: undefined },
    { icon: '🔬', name: '장비', active: false, badge: '', onClick: undefined },
  ]},
  { label: '연구노트', items: [
    { icon: '📓', name: '연구노트', active: true, badge: '', onClick: () => onNavigate('/note') },
    { icon: '🧫', name: '모아 실험', active: false, badge: '', onClick: () => onNavigate('/') },
    { icon: '📰', name: '랩북 피드', active: false, badge: '11', onClick: undefined },
  ]},
  { label: '커뮤니티', items: [{ icon: '🌐', name: '커뮤니티', active: false, badge: '', onClick: undefined }] },
];

export default function NotePage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<ResearchNote[]>(MOCK_NOTES);
  const [view, setView] = useState<View>('list');
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeNote = notes.find((n) => n.id === activeId) ?? null;
  const sections = SNB_SECTIONS(navigate);

  function handleCreate() {
    const now = new Date().toISOString();
    const newNote: ResearchNote = {
      id: `note_${Date.now()}`,
      title: '',
      date: new Date().toISOString().slice(0, 10),
      researcher: '채은',
      project: '',
      status: 'draft',
      tags: [],
      objective: '',
      materials: '',
      procedure: [],
      results: '',
      discussion: '',
      linkedMoaIds: [],
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveId(newNote.id);
    setView('editor');
  }

  function handleOpen(id: string) {
    setActiveId(id);
    setView('editor');
  }

  function handleSave(updated: ResearchNote) {
    setNotes((prev) => prev.map((n) => n.id === updated.id ? updated : n));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* GNB */}
      <header style={{
        height: '48px', flexShrink: 0,
        background: 'var(--bg, #fff)', borderBottom: '1px solid var(--bd, #e2e4e9)',
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: '12px', zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 500, fontSize: '15px', color: 'var(--tx, #111)' }}>
          <div style={{ width: '28px', height: '28px', background: 'var(--blue, #1a6bb5)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="7.5" r="5.5" stroke="white" strokeWidth="1.4"/>
              <path d="M4.5 7.5h6M7.5 4.5v6" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          Jinu<span style={{ color: 'var(--blue, #1a6bb5)' }}>note</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '12px', color: 'var(--tx3, #9099aa)' }}>채은</span>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--blue-bg, #e8f0fa)', color: 'var(--blue, #1a6bb5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 500, cursor: 'pointer' }}>CE</div>
        </div>
      </header>

      {/* 바디 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* SNB */}
        <nav aria-label="서비스 메뉴" style={{
          width: '200px', flexShrink: 0,
          background: 'var(--bg, #fff)', borderRight: '1px solid var(--bd, #e2e4e9)',
          overflowY: 'auto', padding: '10px 0 20px',
        }}>
          {sections.map((section) => (
            <div key={section.label} style={{ padding: '14px 10px 4px' }}>
              <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--tx3, #9099aa)', textTransform: 'uppercase', letterSpacing: '.06em', padding: '0 8px', marginBottom: '4px' }}>
                {section.label}
              </div>
              {section.items.map((item) => (
                <div key={item.name} onClick={item.onClick} style={{
                  display: 'flex', alignItems: 'center', gap: '9px',
                  padding: '7px 8px', borderRadius: '6px', fontSize: '12px',
                  color: item.active ? 'var(--blue, #1a6bb5)' : 'var(--tx3, #9099aa)',
                  background: item.active ? 'var(--blue-bg, #e8f0fa)' : 'transparent',
                  fontWeight: item.active ? 500 : 400,
                  cursor: item.onClick ? 'pointer' : 'default',
                  transition: 'background .12s, color .12s',
                }}>
                  <span style={{ width: '16px', textAlign: 'center', fontSize: '13px' }}>{item.icon}</span>
                  {item.name}
                  {item.badge && (
                    <span style={{ marginLeft: 'auto', fontSize: '9px', background: 'var(--blue)', color: '#fff', padding: '1px 6px', borderRadius: '10px' }}>
                      {item.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* 메인 */}
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {view === 'list' ? (
            <NoteListPage notes={notes} onCreate={handleCreate} onOpen={handleOpen} />
          ) : activeNote ? (
            <NoteEditorPage note={activeNote} onBack={() => setView('list')} onSave={handleSave} />
          ) : null}
        </main>
      </div>
    </div>
  );
}
