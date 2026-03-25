import React, { useEffect, useState } from 'react';
import type { AttFile, BaseTarget, MoaCard, ReagentModalTarget } from '../../types/moa';
import { useQuantTable } from './components/QuantTable/useQuantTable';
import { useResultTable } from './components/ResultTable/useResultTable';
import QuantTable from './components/QuantTable';
import ResultTable from './components/ResultTable';
import RecordTabs from './components/RecordTabs';
import YieldChart from './components/YieldChart';
import ReagentSearchModal from './components/modals/ReagentSearchModal';
import PreviewModal from './components/modals/PreviewModal';
import { buildAiPrompt, copyToClipboard } from '../../utils/aiExport';

interface MoaDetailViewProps {
  card: MoaCard;
  onBack: () => void;
}

const MoaDetailView: React.FC<MoaDetailViewProps> = ({ card, onBack }) => {
  const qt = useQuantTable();
  const rt = useResultTable(qt.exp);

  // 실험 행 sync
  useEffect(() => {
    rt.syncRows(qt.exp);
  }, [qt.exp.length]);

  // 시약 검색 모달 (결과 테이블용 화합물 검색)
  const [cpdSearchIdx, setCpdSearchIdx] = useState<number | null>(null);

  // 미리보기 모달
  const [preview, setPreview] = useState<{ ri: number; fi: number } | null>(null);

  // AI 내보내기
  const [aiCopied, setAiCopied] = useState(false);
  const handleAiExport = async () => {
    const prompt = buildAiPrompt({ card, exp: qt.exp, com: qt.com, baseTarget: qt.baseTarget, resData: rt.resData });
    const ok = await copyToClipboard(prompt);
    if (ok) {
      setAiCopied(true);
      setTimeout(() => setAiCopied(false), 2000);
    }
  };

  // Undo 토스트
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUndo = () => {
    const desc = qt.doUndo();
    if (desc) {
      setToastVisible(false);
    }
  };

  const handleQuantChange = () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastVisible(true);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 3500);
  };

  // 프리뷰 파일 목록 (전체 att 중 해당 ri)
  const previewFiles: AttFile[] = preview ? (rt.att[preview.ri] ?? []) : [];

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* ── 사이드바 ── */}
      <div style={{
        width: 160, flexShrink: 0, background: '#fff',
        borderRight: '0.5px solid #e2e4e9', padding: '6px 0', overflowY: 'auto',
      }}>
        {[
          { section: '내 연구실', items: ['연구실 공지사항', '계정정보', '그룹', '프로젝트'] },
          { section: '인벤토리',  items: ['시약 구매', '구매 현황', '시약장', '소모품', '장비'] },
          { section: '연구노트',  items: ['연구노트', '모아 실험', '랩북 피드'] },
        ].map(({ section, items }) => (
          <React.Fragment key={section}>
            <div style={{ fontSize: 9, color: '#9099aa', fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase', padding: '7px 12px 2px' }}>
              {section}
            </div>
            {items.map(item => (
              <div
                key={item}
                style={{
                  padding: '5px 12px', fontSize: 11, cursor: 'pointer',
                  color: item === '모아 실험' ? '#1a6bb5' : '#4a5060',
                  fontWeight: item === '모아 실험' ? 500 : 400,
                  background: item === '모아 실험' ? '#e8f0fa' : 'transparent',
                  borderLeft: item === '모아 실험' ? '2px solid #1a6bb5' : 'none',
                  paddingLeft: item === '모아 실험' ? 10 : 12,
                }}
              >
                {item}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* ── 메인 ── */}
      <div style={{ flex: 1, minWidth: 0, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', overflowX: 'hidden' }}>

        {/* Scheme 카드 */}
        <div style={{ background: '#fff', border: '0.5px solid #e2e4e9', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '0.5px solid #e2e4e9' }}>
            <span style={{ fontSize: 9, fontWeight: 500, color: '#4a5060', textTransform: 'uppercase', letterSpacing: 0.5 }}>Scheme</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={handleAiExport}
                title="실험 데이터를 AI 상담용 텍스트로 클립보드에 복사"
                style={{
                  fontSize: 10, padding: '3px 10px', borderRadius: 5,
                  border: `0.5px solid ${aiCopied ? '#1D9E75' : '#b5d4f4'}`,
                  background: aiCopied ? '#f0fdf8' : '#e8f0fa',
                  color: aiCopied ? '#1D9E75' : '#1a6bb5',
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  transition: 'all .15s',
                }}
              >
                {aiCopied ? '✓ 복사됨' : '🤖 AI와 상담'}
              </button>
              <button style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, border: '0.5px solid #e2e4e9', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                편집
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '10px 32px' }}>
            {['E', 'A', 'B', 'C'].map((label, i) => (
              <React.Fragment key={label}>
                <div style={{ textAlign: 'center' }}>
                  {i === 0 && (
                    <div style={{ fontSize: 8, background: '#faeeda', color: '#633806', padding: '1px 5px', borderRadius: 3, border: '0.5px solid #EF9F27', display: 'inline-block', marginBottom: 2 }}>
                      변수
                    </div>
                  )}
                  <div style={{ fontSize: 20, fontWeight: 500, color: i === 0 ? '#BA7517' : '#1a6bb5', lineHeight: 1 }}>{label}</div>
                  <div style={{ fontSize: 9, color: '#9099aa', marginTop: 2 }}>{i === 0 ? '실험별 상이' : 'x mmol'}</div>
                </div>
                {i < 3 && <span style={{ fontSize: 14, color: '#9099aa', paddingBottom: 11 }}>+</span>}
              </React.Fragment>
            ))}
            <div style={{ flex: 1, maxWidth: 180, margin: '0 12px' }}>
              <div style={{ height: 1.5, background: '#1a1c21', position: 'relative' }}>
                <div style={{ content: '', position: 'absolute', right: -1, top: -3.5, borderLeft: '7px solid #1a1c21', borderTop: '4px solid transparent', borderBottom: '4px solid transparent' }} />
              </div>
            </div>
            <div style={{ background: '#e8f0fa', border: '0.5px solid #b5d4f4', borderRadius: 8, padding: '7px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 500, color: '#1a6bb5' }}>F</div>
            </div>
          </div>
        </div>

        {/* Starting 정량 카드 */}
        <div style={{ background: '#fff', border: '0.5px solid #e2e4e9', borderRadius: 8, overflow: 'visible', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '0.5px solid #e2e4e9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 9, fontWeight: 500, color: '#4a5060', textTransform: 'uppercase', letterSpacing: 0.5 }}>Starting 정량</span>
              <span style={{ fontSize: 9, color: '#999', fontStyle: 'italic' }}>
                ⭐ 라디오 = 기준물질 선택 · eq → mmol·weight(mg) 자동 · 오차 <span style={{ color: '#BA7517' }}>■</span>±5~10% <span style={{ color: '#c0392b' }}>■</span>&gt;10%
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {/* 실험 추가 */}
              <button
                onClick={() => { qt.addExpRow(); handleQuantChange(); }}
                style={{ fontSize: 11, padding: '4px 11px', borderRadius: 5, border: '0.5px solid #b5d4f4', background: '#fff', color: '#1a6bb5', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 3 }}
              >
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#1a6bb5" strokeWidth="1.4"/><path d="M8 5v6M5 8h6" stroke="#1a6bb5" strokeWidth="1.5" strokeLinecap="round"/></svg>
                실험 추가
              </button>
              {/* 공통시약 추가 */}
              <button
                onClick={() => { qt.addComCol(); handleQuantChange(); }}
                style={{ fontSize: 11, padding: '4px 11px', borderRadius: 5, border: '0.5px solid #9FE1CB', background: '#fff', color: '#1D9E75', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 3 }}
              >
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#1D9E75" strokeWidth="1.4"/><path d="M8 5v6M5 8h6" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round"/></svg>
                공통시약 추가
              </button>
              <div style={{ width: 1, height: 15, background: '#e2e4e9' }} />
              {/* 참고값 토글 */}
              <span style={{ fontSize: 9, color: '#4a5060' }}>참고값</span>
              <label style={{ position: 'relative', width: 28, height: 15, cursor: 'pointer', flexShrink: 0, display: 'inline-block' }}>
                <input
                  type="checkbox"
                  checked={qt.refOn}
                  onChange={e => qt.setRefOn(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute', inset: 0,
                  background: qt.refOn ? '#1a6bb5' : '#f7f8fa',
                  border: `0.5px solid ${qt.refOn ? '#1a6bb5' : '#d0d4dc'}`,
                  borderRadius: 8, transition: '.2s',
                }}>
                  <span style={{
                    position: 'absolute', height: 9, width: 9,
                    left: qt.refOn ? 16 : 2, top: 2,
                    background: qt.refOn ? '#fff' : '#9099aa',
                    borderRadius: '50%', transition: '.2s',
                  }} />
                </span>
              </label>
            </div>
          </div>

          {/* QuantTable */}
          <div style={{ padding: '10px 12px' }}>
            <QuantTable
              exp={qt.exp}
              com={qt.com}
              baseTarget={qt.baseTarget}
              refOn={qt.refOn}
              onSetBase={(t: BaseTarget) => { qt.setBase(t); handleQuantChange(); }}
              onUpdateExpField={(ri, field, value) => qt.updateExpField(ri, field, value)}
              onUpdateExpMeasure={(ri, value) => qt.updateExpMeasure(ri, value)}
              onUpdateComCell={(ci, ri, value) => qt.updateComCell(ci, ri, value)}
              onUpdateComField={(ci, field, value) => qt.updateComField(ci, field, value)}
              onDelExpRow={(ri) => { qt.delExpRow(ri); handleQuantChange(); }}
              onDelComCol={(ci) => { qt.delComCol(ci); handleQuantChange(); }}
              onOpenReagentModal={(target: ReagentModalTarget) => qt.setReagentModal(target)}
            />
          </div>

          {/* 실험 기록 탭 */}
          <RecordTabs exp={qt.exp} />
        </div>

        {/* 실험결과 카드 */}
        <div style={{ background: '#fff', border: '0.5px solid #e2e4e9', borderRadius: 8, flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '0.5px solid #e2e4e9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 9, fontWeight: 500, color: '#4a5060', textTransform: 'uppercase', letterSpacing: 0.5 }}>실험 결과</span>
              <span style={{ fontSize: 9, color: '#999', fontStyle: 'italic' }}>화합물명 🔍 → MW 연동 → 수득량 입력 시 mmol 자동계산</span>
            </div>
            <button style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, border: '0.5px solid #9FE1CB', background: '#f0fdf8', color: '#1D9E75', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="#1D9E75" strokeWidth="1.3"/><path d="M8 5v6M5 8h6" stroke="#1D9E75" strokeWidth="1.4" strokeLinecap="round"/></svg>
              시약 등록
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px' }}>
            <div style={{ overflowX: 'auto', borderRight: '0.5px solid #e2e4e9' }}>
              <ResultTable
                exp={qt.exp}
                resData={rt.resData}
                att={rt.att}
                getMmol={rt.getMmol}
                onUpdateYield={rt.updateYield}
                onUpdateMg={rt.updateMg}
                onUpdatePur={rt.updatePur}
                onUpdateMeth={rt.updateMeth}
                onUpdateCpdName={rt.updateCpdName}
                onOpenCpdSearch={(ri) => setCpdSearchIdx(ri)}
                onOpenRegModal={(_ri) => {/* TODO: 등록 모달 */}}
                onAddFiles={rt.addFiles}
                onRemoveFile={rt.removeFile}
                onOpenPreview={(ri, fi) => setPreview({ ri, fi })}
              />
            </div>
            <YieldChart exp={qt.exp} yields={rt.getYields()} />
          </div>
        </div>

        {/* 댓글 카드 (스텁) */}
        <div style={{ background: '#fff', border: '0.5px solid #e2e4e9', borderRadius: 8, flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ padding: '6px 12px', borderBottom: '0.5px solid #e2e4e9' }}>
            <span style={{ fontSize: 9, fontWeight: 500, color: '#4a5060', textTransform: 'uppercase', letterSpacing: 0.5 }}>댓글</span>
          </div>
          <div style={{ padding: '8px 14px', color: '#9099aa', fontSize: 11 }}>댓글 기능은 추후 구현 예정입니다.</div>
        </div>

        {/* 메모 카드 (스텁) */}
        <div style={{ background: '#fff', border: '0.5px solid #e2e4e9', borderRadius: 8, flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 12px', cursor: 'pointer' }}>
            <span style={{ fontSize: 9, fontWeight: 500, color: '#4a5060', textTransform: 'uppercase', letterSpacing: 0.5 }}>메모</span>
            <span style={{ fontSize: 11, color: '#9099aa' }}>▼</span>
          </div>
        </div>
      </div>

      {/* ── 시약 검색 모달 (QuantTable용) ── */}
      {qt.reagentModal && (
        <ReagentSearchModal
          title={qt.reagentModal.kind === 'exp' ? '변수시약 검색' : '공통시약 검색'}
          onSelect={(r) => qt.applyReagent(r)}
          onClose={() => qt.setReagentModal(null)}
        />
      )}

      {/* ── 시약 검색 모달 (결과 테이블용 화합물) ── */}
      {cpdSearchIdx !== null && (
        <ReagentSearchModal
          title="화합물 검색"
          onSelect={(r) => { rt.applyCpd(cpdSearchIdx, r); setCpdSearchIdx(null); }}
          onClose={() => setCpdSearchIdx(null)}
        />
      )}

      {/* ── 미리보기 모달 ── */}
      {preview && previewFiles.length > 0 && (
        <PreviewModal
          files={previewFiles}
          initialIdx={preview.fi}
          onClose={() => setPreview(null)}
        />
      )}

      {/* ── Undo 토스트 ── */}
      <div style={{
        position: 'fixed', bottom: 20, left: '50%', transform: `translateX(-50%) translateY(${toastVisible ? 0 : 10}px)`,
        background: '#2a2d35', color: '#fff', fontSize: 11, padding: '8px 18px',
        borderRadius: 20, display: 'flex', alignItems: 'center', gap: 12, zIndex: 9997,
        opacity: toastVisible ? 1 : 0, transition: 'opacity .2s, transform .2s',
        pointerEvents: toastVisible ? 'auto' : 'none', fontFamily: 'inherit',
      }}>
        <span>"{qt.lastDesc}" 변경됨</span>
        <span
          onClick={handleUndo}
          style={{ fontSize: 11, color: '#7dd3fc', cursor: 'pointer', fontWeight: 500 }}
        >
          되돌리기
        </span>
      </div>
    </div>
  );
};

export default MoaDetailView;
