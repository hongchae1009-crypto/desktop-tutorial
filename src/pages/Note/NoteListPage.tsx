import { useState } from 'react';
import type { ResearchNote, NoteStatus } from '@/types/note';

const STATUS_LABEL: Record<NoteStatus, string> = {
  draft: '작성 중',
  completed: '완료',
  signed: '서명 완료',
};
const STATUS_COLOR: Record<NoteStatus, { bg: string; color: string; border: string }> = {
  draft:     { bg: '#F3F4F6', color: '#6B7280', border: '#D1D5DB' },
  completed: { bg: '#E6F1FB', color: '#185FA5', border: '#85B7EB' },
  signed:    { bg: '#E1F5EE', color: '#0F6E56', border: '#9FE1CB' },
};

interface Props {
  notes: ResearchNote[];
  onCreate: () => void;
  onOpen: (id: string) => void;
}

export default function NoteListPage({ notes, onCreate, onOpen }: Props) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<NoteStatus | 'all'>('all');

  const filtered = notes.filter((n) => {
    const matchStatus = statusFilter === 'all' || n.status === statusFilter;
    const kw = query.toLowerCase();
    const matchQuery = !kw ||
      n.title.toLowerCase().includes(kw) ||
      (n.project ?? '').toLowerCase().includes(kw) ||
      n.tags.some((t) => t.toLowerCase().includes(kw));
    return matchStatus && matchQuery;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* 헤더 */}
      <div style={{
        background: 'var(--bg, #fff)', borderBottom: '1px solid var(--bd, #e2e4e9)',
        padding: '10px 24px 0', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--tx, #1a1c21)' }}>연구노트</div>
            <div style={{ fontSize: '11px', color: 'var(--tx3, #9099aa)', marginTop: '2px' }}>실험 기록을 상세히 작성하고 관리합니다</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--tx3, #9099aa)' }}>총 {notes.length}개</span>
            <button onClick={onCreate} style={{
              background: 'var(--blue, #1a6bb5)', color: '#fff',
              border: 'none', borderRadius: '8px', padding: '7px 14px',
              fontSize: '12px', fontWeight: 500, cursor: 'pointer',
            }}>
              + 새 연구노트
            </button>
          </div>
        </div>

        {/* 검색 + 필터 */}
        <div style={{ display: 'flex', gap: '8px', paddingBottom: '10px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
            <input
              type="text"
              placeholder="제목, 프로젝트, 태그 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%', padding: '7px 32px 7px 12px',
                border: '1px solid var(--bd2, #d0d4dc)', borderRadius: '8px',
                fontSize: '12px', background: 'var(--bg2, #f7f8fa)', outline: 'none',
              }}
            />
            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--tx3)', fontSize: '13px' }}>⌕</span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['all', 'draft', 'completed', 'signed'] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: '6px 12px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer',
                border: '1px solid',
                background: statusFilter === s ? 'var(--blue, #1a6bb5)' : 'var(--bg, #fff)',
                color: statusFilter === s ? '#fff' : 'var(--tx2, #4a5060)',
                borderColor: statusFilter === s ? 'var(--blue, #1a6bb5)' : 'var(--bd, #e2e4e9)',
              }}>
                {s === 'all' ? '전체' : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 목록 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--tx3)', gap: '8px', paddingTop: '60px' }}>
            <div style={{ fontSize: '32px' }}>📓</div>
            <div style={{ fontSize: '13px' }}>연구노트가 없습니다</div>
            <button onClick={onCreate} style={{
              marginTop: '8px', background: 'var(--blue)', color: '#fff',
              border: 'none', borderRadius: '8px', padding: '8px 16px',
              fontSize: '12px', cursor: 'pointer',
            }}>+ 첫 연구노트 작성</button>
          </div>
        ) : (
          filtered.map((note) => <NoteCard key={note.id} note={note} onClick={() => onOpen(note.id)} />)
        )}
      </div>
    </div>
  );
}

function NoteCard({ note, onClick }: { note: ResearchNote; onClick: () => void }) {
  const sc = STATUS_COLOR[note.status];
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg, #fff)', border: '1px solid var(--bd, #e2e4e9)',
        borderRadius: '10px', padding: '14px 18px', cursor: 'pointer',
        transition: 'border-color .15s, box-shadow .15s',
        display: 'flex', alignItems: 'flex-start', gap: '14px',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '#85B7EB';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,.08)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--bd, #e2e4e9)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      {/* 날짜 블록 */}
      <div style={{ textAlign: 'center', minWidth: '44px', flexShrink: 0 }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--blue, #1a6bb5)', lineHeight: 1 }}>
          {note.date.slice(8)}
        </div>
        <div style={{ fontSize: '10px', color: 'var(--tx3)', marginTop: '2px' }}>
          {note.date.slice(0, 7).replace('-', '.')}
        </div>
      </div>

      {/* 구분선 */}
      <div style={{ width: '1px', alignSelf: 'stretch', background: 'var(--bd, #e2e4e9)', flexShrink: 0 }} />

      {/* 내용 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {note.title}
          </span>
          <span style={{
            fontSize: '10px', padding: '1px 8px', borderRadius: '10px', flexShrink: 0,
            background: sc.bg, color: sc.color, border: `0.5px solid ${sc.border}`, fontWeight: 500,
          }}>
            {STATUS_LABEL[note.status]}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--tx3)', marginBottom: '6px' }}>
          {note.project && <span>📁 {note.project}</span>}
          <span>👤 {note.researcher}</span>
        </div>
        {note.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {note.tags.map((tag) => (
              <span key={tag} style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '10px', background: 'var(--bg2)', color: 'var(--tx2)', border: '0.5px solid var(--bd)' }}>
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 화살표 */}
      <div style={{ color: 'var(--tx3)', fontSize: '14px', flexShrink: 0, alignSelf: 'center' }}>›</div>
    </div>
  );
}
