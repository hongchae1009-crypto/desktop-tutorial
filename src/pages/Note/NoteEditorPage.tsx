import { useState } from 'react';
import type { ResearchNote, ProcedureStep, NoteStatus, NoteReagentRow } from '@/types/note';
import MaterialsTable from './components/MaterialsTable';
import SchemeCanvas from './components/SchemeCanvas';

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

const SECTIONS = [
  { key: 'objective',    label: '실험 목적',         icon: '🎯' },
  { key: 'scheme',       label: '반응 스킴',          icon: '⚗️' },
  { key: 'reagentRows',  label: '시작물질 / 반응물',  icon: '🧪' },
  { key: 'procedure',    label: '실험 방법',          icon: '📋' },
  { key: 'results',      label: '실험 결과',          icon: '📊' },
  { key: 'discussion',   label: '고찰',               icon: '💬' },
] as const;

interface Props {
  note: ResearchNote;
  onBack: () => void;
  onSave: (updated: ResearchNote) => void;
}

export default function NoteEditorPage({ note, onBack, onSave }: Props) {
  const [draft, setDraft] = useState<ResearchNote>(note);
  const [activeSection, setActiveSection] = useState<string>('objective');
  const [saved, setSaved] = useState(true);

  function update<K extends keyof ResearchNote>(key: K, val: ResearchNote[K]) {
    setDraft((p) => ({ ...p, [key]: val, updatedAt: new Date().toISOString() }));
    setSaved(false);
  }

  function handleSave() {
    onSave(draft);
    setSaved(true);
  }
  function handleComplete() {
    const updated = { ...draft, status: 'completed' as NoteStatus, updatedAt: new Date().toISOString() };
    setDraft(updated); onSave(updated); setSaved(true);
  }
  function handleSign() {
    const updated = { ...draft, status: 'signed' as NoteStatus, updatedAt: new Date().toISOString() };
    setDraft(updated); onSave(updated); setSaved(true);
  }

  // 절차 단계
  function addStep() {
    update('procedure', [...draft.procedure, { id: `s${Date.now()}`, text: '' }]);
  }
  function updateStep(id: string, text: string) {
    update('procedure', draft.procedure.map((s) => s.id === id ? { ...s, text } : s));
  }
  function removeStep(id: string) {
    update('procedure', draft.procedure.filter((s) => s.id !== id));
  }
  function moveStep(id: string, dir: -1 | 1) {
    const idx = draft.procedure.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const next = [...draft.procedure];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    update('procedure', next);
  }

  // 시약 행 (MaterialsTable에서 통합 관리)
  function handleReagentRowsChange(rows: NoteReagentRow[]) {
    update('reagentRows', rows);
  }

  const sc = STATUS_COLOR[draft.status];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* 상단 툴바 */}
      <div style={{
        background: 'var(--bg)', borderBottom: '1px solid var(--bd)',
        padding: '10px 20px', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--tx3)', padding: '4px 6px' }}>
          ← 목록
        </button>
        <div style={{ width: '1px', height: '16px', background: 'var(--bd)' }} />
        <span style={{ fontSize: '11px', color: 'var(--tx3)' }}>
          🏠 / 연구노트 / <span style={{ fontFamily: 'monospace', color: 'var(--blue)' }}>{draft.noteNumber}</span>
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
          {!saved && <span style={{ fontSize: '10px', color: 'var(--tx3)' }}>저장되지 않음</span>}
          <span style={{
            fontSize: '10px', padding: '2px 8px', borderRadius: '10px',
            background: sc.bg, color: sc.color, border: `0.5px solid ${sc.border}`, fontWeight: 500,
          }}>{STATUS_LABEL[draft.status]}</span>
          <button onClick={handleSave} style={{
            padding: '6px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
            border: '1px solid var(--bd2)', background: 'var(--bg)', color: 'var(--tx2)', fontWeight: 500,
          }}>저장</button>
          {draft.status === 'draft' && (
            <button onClick={handleComplete} style={{
              padding: '6px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
              border: 'none', background: 'var(--blue)', color: '#fff', fontWeight: 500,
            }}>완료 처리</button>
          )}
          {draft.status === 'completed' && (
            <button onClick={handleSign} style={{
              padding: '6px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
              border: 'none', background: '#0F6E56', color: '#fff', fontWeight: 500,
            }}>✍ 서명</button>
          )}
        </div>
      </div>

      {/* 바디 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 좌측 아웃라인 */}
        <div style={{
          width: '200px', flexShrink: 0, background: 'var(--bg2)',
          borderRight: '1px solid var(--bd)', padding: '16px 10px',
          display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto',
        }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.04em', padding: '0 6px', marginBottom: '6px' }}>섹션</div>
          {SECTIONS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => {
                setActiveSection(key);
                document.getElementById(`section-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '7px 8px', borderRadius: '7px', width: '100%', textAlign: 'left',
                border: 'none', cursor: 'pointer', fontSize: '12px',
                background: activeSection === key ? 'var(--blue-bg, #e8f0fa)' : 'transparent',
                color: activeSection === key ? 'var(--blue)' : 'var(--tx2)',
                fontWeight: activeSection === key ? 500 : 400,
              }}
            >
              <span style={{ fontSize: '13px' }}>{icon}</span>
              {label}
            </button>
          ))}

          {/* 메타 요약 */}
          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--bd)', fontSize: '10px', color: 'var(--tx3)', lineHeight: 2 }}>
            <div>작성자: {draft.researcher}</div>
            <div>날짜: {draft.date}</div>
            {draft.project && <div>프로젝트: {draft.project}</div>}
            <div style={{ fontFamily: 'monospace', color: 'var(--blue)', fontWeight: 500 }}>{draft.noteNumber}</div>
          </div>
        </div>

        {/* 우측 에디터 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: 'var(--bg3, #f0f1f4)', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* ─── 제목 카드 ─── */}
          <div style={{ background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--bd)', padding: '20px 24px' }}>
            {/* 노트 번호 + 날짜/작성자/프로젝트 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {/* 노트 번호 - 편집 가능 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', color: 'var(--tx3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em' }}>노트번호</span>
                <input
                  value={draft.noteNumber}
                  onChange={(e) => update('noteNumber', e.target.value)}
                  style={{
                    fontFamily: 'monospace', fontSize: '13px', fontWeight: 700,
                    color: 'var(--blue)', border: 'none', outline: 'none',
                    background: 'var(--blue-bg, #e8f0fa)', padding: '3px 10px',
                    borderRadius: '6px', width: '120px',
                  }}
                />
              </div>
              <MetaField label="날짜" value={draft.date} type="date" onChange={(v) => update('date', v)} />
              <MetaField label="작성자" value={draft.researcher} onChange={(v) => update('researcher', v)} />
              <MetaField label="프로젝트" value={draft.project ?? ''} onChange={(v) => update('project', v)} placeholder="(선택)" />
            </div>

            {/* 실험명 */}
            <input
              type="text"
              value={draft.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="실험명을 입력하세요 (예: KHMDS를 이용한 enolate 형성 및 알킬화 반응)"
              style={{
                width: '100%', fontSize: '18px', fontWeight: 700, color: 'var(--tx)',
                border: 'none', borderBottom: '1px solid var(--bd)', outline: 'none',
                background: 'transparent', fontFamily: 'inherit',
                paddingBottom: '10px', marginBottom: '12px', boxSizing: 'border-box',
              }}
            />

            {/* 태그 */}
            <TagEditor tags={draft.tags} onChange={(tags) => update('tags', tags)} />
          </div>

          {/* ─── 실험 목적 ─── */}
          <Section id="objective" icon="🎯" label="실험 목적" onVisible={() => setActiveSection('objective')}>
            <TextArea
              value={draft.objective}
              onChange={(v) => update('objective', v)}
              placeholder="이 실험의 목적과 가설을 작성하세요."
              rows={4}
            />
          </Section>

          {/* ─── 반응 스킴 ─── */}
          <Section id="scheme" icon="⚗️" label="반응 스킴" onVisible={() => setActiveSection('scheme')}>
            <SchemeCanvas
              value={draft.schemeImage}
              onChange={(dataUrl) => update('schemeImage', dataUrl || undefined)}
            />
          </Section>

          {/* ─── 시작물질 / 반응물 ─── */}
          <Section id="reagentRows" icon="🧪" label="시작물질 / 반응물" onVisible={() => setActiveSection('reagentRows')}>
            <MaterialsTable
              rows={draft.reagentRows}
              onChange={handleReagentRowsChange}
            />
          </Section>

          {/* ─── 실험 방법 ─── */}
          <Section id="procedure" icon="📋" label="실험 방법" onVisible={() => setActiveSection('procedure')}>
            <ProcedureEditor
              steps={draft.procedure}
              onAdd={addStep}
              onChange={updateStep}
              onRemove={removeStep}
              onMove={moveStep}
            />
          </Section>

          {/* ─── 실험 결과 ─── */}
          <Section id="results" icon="📊" label="실험 결과" onVisible={() => setActiveSection('results')}>
            <TextArea
              value={draft.results}
              onChange={(v) => update('results', v)}
              placeholder="수율, 수득량, 분석 데이터(NMR, MS, TLC 등) 등 실험 결과를 기록하세요."
              rows={8}
              mono
            />
          </Section>

          {/* ─── 고찰 ─── */}
          <Section id="discussion" icon="💬" label="고찰" onVisible={() => setActiveSection('discussion')}>
            <TextArea
              value={draft.discussion}
              onChange={(v) => update('discussion', v)}
              placeholder="결과 해석, 문제점, 개선 방향 등을 자유롭게 작성하세요."
              rows={6}
            />
          </Section>

          {/* 서명 섹션 */}
          {draft.status === 'signed' && (
            <div style={{ background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--bd)', padding: '16px 24px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tx2)', marginBottom: '10px' }}>✍ 서명</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '10px 20px', border: '1px solid var(--bd2)', borderRadius: '8px', fontSize: '14px', fontStyle: 'italic', color: 'var(--tx2)', background: 'var(--bg2)' }}>
                  {draft.researcher}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--tx3)' }}>
                  {new Date(draft.updatedAt).toLocaleString('ko-KR')} 서명 완료
                </div>
              </div>
            </div>
          )}

          {/* 모아실험 연동 */}
          <div style={{ background: 'var(--bg)', borderRadius: '12px', border: '1px dashed var(--bd2)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '16px' }}>🧫</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--tx2)' }}>모아실험 연동</div>
              <div style={{ fontSize: '11px', color: 'var(--tx3)', marginTop: '2px' }}>관련 모아실험 프로토콜을 연결하면 시약 정보를 자동으로 불러올 수 있습니다</div>
            </div>
            <button style={{
              marginLeft: 'auto', padding: '6px 12px', borderRadius: '8px',
              border: '1px solid var(--bd2)', background: 'var(--bg)', color: 'var(--tx3)',
              fontSize: '11px', cursor: 'not-allowed', opacity: 0.6,
            }} disabled>준비 중</button>
          </div>

          <div style={{ height: '40px', flexShrink: 0 }} />
        </div>
      </div>
    </div>
  );
}

// ─── 공통 서브 컴포넌트 ──────────────────────────────────────────────────────

function Section({ id, icon, label, children, onVisible }: {
  id: string; icon: string; label: string; children: React.ReactNode; onVisible?: () => void;
}) {
  return (
    <div
      id={`section-${id}`}
      style={{ background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--bd)', padding: '20px 24px' }}
      onMouseEnter={onVisible}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <span style={{ fontSize: '15px' }}>{icon}</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--tx)' }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

function TextArea({ value, onChange, placeholder, rows = 4, mono = false }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; mono?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%', resize: 'vertical',
        padding: '10px 12px', borderRadius: '8px',
        border: '1px solid var(--bd)', background: 'var(--bg2)',
        fontSize: '12px', lineHeight: 1.7, color: 'var(--tx)',
        fontFamily: mono ? 'var(--fm, monospace)' : 'inherit',
        outline: 'none', transition: 'border-color .15s',
        boxSizing: 'border-box',
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--blue-bd, #b5d4f4)'; e.currentTarget.style.background = 'var(--bg)'; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--bd)'; e.currentTarget.style.background = 'var(--bg2)'; }}
    />
  );
}

function MetaField({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <label style={{ fontSize: '10px', color: 'var(--tx3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: '5px 9px', borderRadius: '6px', fontSize: '12px',
          border: '1px solid var(--bd)', background: 'var(--bg2)', color: 'var(--tx)',
          outline: 'none', fontFamily: 'inherit',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--blue-bd)'; e.currentTarget.style.background = 'var(--bg)'; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--bd)'; e.currentTarget.style.background = 'var(--bg2)'; }}
      />
    </div>
  );
}

function TagEditor({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('');
  function add() {
    const v = input.trim().replace(/^#/, '');
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput('');
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
      {tags.map((tag) => (
        <span key={tag} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: 'var(--bg2)', color: 'var(--tx2)', border: '0.5px solid var(--bd)' }}>
          #{tag}
          <button onClick={() => onChange(tags.filter((t) => t !== tag))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx3)', fontSize: '12px', padding: 0, lineHeight: 1 }}>×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
        placeholder="태그 추가 (Enter)"
        style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', border: '1px dashed var(--bd2)', outline: 'none', width: '100px', background: 'transparent', color: 'var(--tx2)' }}
      />
    </div>
  );
}

function ProcedureEditor({ steps, onAdd, onChange, onRemove, onMove }: {
  steps: ProcedureStep[];
  onAdd: () => void;
  onChange: (id: string, text: string) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {steps.map((step, idx) => (
        <div key={step.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <div style={{
            width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, marginTop: '8px',
            background: 'var(--blue-bg)', color: 'var(--blue)', fontSize: '10px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{idx + 1}</div>
          <textarea
            value={step.text}
            onChange={(e) => onChange(step.id, e.target.value)}
            placeholder={`단계 ${idx + 1}`}
            rows={2}
            style={{
              flex: 1, resize: 'vertical', padding: '8px 10px', borderRadius: '8px',
              border: '1px solid var(--bd)', background: 'var(--bg2)', fontSize: '12px',
              lineHeight: 1.6, color: 'var(--tx)', fontFamily: 'inherit', outline: 'none',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--blue-bd)'; e.currentTarget.style.background = 'var(--bg)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--bd)'; e.currentTarget.style.background = 'var(--bg2)'; }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
            <button onClick={() => onMove(step.id, -1)} disabled={idx === 0} style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? 'var(--bd2)' : 'var(--tx3)', fontSize: '12px', padding: '2px' }}>▲</button>
            <button onClick={() => onMove(step.id, 1)} disabled={idx === steps.length - 1} style={{ background: 'none', border: 'none', cursor: idx === steps.length - 1 ? 'default' : 'pointer', color: idx === steps.length - 1 ? 'var(--bd2)' : 'var(--tx3)', fontSize: '12px', padding: '2px' }}>▼</button>
            <button onClick={() => onRemove(step.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red, #c0392b)', fontSize: '13px', padding: '2px' }}>×</button>
          </div>
        </div>
      ))}
      <button onClick={onAdd} style={{
        marginTop: '4px', padding: '7px', borderRadius: '8px', width: '100%',
        border: '1px dashed var(--bd2)', background: 'transparent', color: 'var(--tx3)',
        fontSize: '12px', cursor: 'pointer', transition: 'background .12s',
      }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg2)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        + 단계 추가
      </button>
    </div>
  );
}
