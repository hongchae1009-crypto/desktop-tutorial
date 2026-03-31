/**
 * RegisterModal — 시약 등록 모달
 * - 단건 등록: 구매링크→autofill, CAS→PubChem조회, 보관조건칩, 전체필드, 시약장선택
 * - 엑셀 일괄: 드래그앤드롭, parseExcel(), 미리보기테이블(3행), 템플릿다운로드
 */
import { useEffect, useRef, useState } from 'react';
import type { Cabinet, ReagentItem, StorageCondition } from '@/types/reagent';
import { fetchByCas, fetchByName, autofillFromLink } from '@/utils/pubchem';
import { downloadTemplate, parseExcel } from '@/utils/excel';
import type { ParsedReagentRow } from '@/utils/excel';
import { useToast } from '../Toast';

interface RegisterModalProps {
  cabinets: Cabinet[];
  activeCabinetId: string;
  onClose: () => void;
  onRegister: (reagent: Omit<ReagentItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onBulkRegister?: (rows: ParsedReagentRow[], cabinetId: string) => void;
}

const STORAGE_CHIP_CONFIG: { key: StorageCondition; label: string; style: string }[] = [
  { key: 'RT',    label: '실온',         style: 'blue' },
  { key: '냉장',  label: '냉장 2~8°C',   style: 'green' },
  { key: '냉동',  label: '냉동 -20°C',   style: 'green' },
  { key: '극저온', label: '초저온 -80°C', style: 'green' },
  { key: '차광',  label: '차광',         style: 'amber' },
  { key: '위험물', label: '위험물',       style: 'amber' },
  { key: '불활성', label: '불활성 기체',  style: 'amber' },
];

const chipActiveClass: Record<string, React.CSSProperties> = {
  blue:  { background: '#E6F1FB', color: '#185FA5', borderColor: '#85B7EB' },
  green: { background: '#E1F5EE', color: '#3B6D11', borderColor: '#5DCAA5' },
  amber: { background: '#FAEEDA', color: '#854F0B', borderColor: '#EF9F27' },
};

const CAS_RE = /^\d{2,7}-\d{2}-\d$/;

export default function RegisterModal({
  cabinets,
  activeCabinetId,
  onClose,
  onRegister,
  onBulkRegister,
}: RegisterModalProps) {
  const { showToast } = useToast();
  const overlayRef = useRef<HTMLDivElement>(null);

  // ── 탭 (단건 / 엑셀) ──────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

  // ── 단건 등록 상태 ────────────────────────────────────────
  const [linkInput, setLinkInput] = useState('');
  const [autofillBanner, setAutofillBanner] = useState<string | null>(null);
  const [autofillLoading, setAutofillLoading] = useState(false);

  const [compoundName, setCompoundName] = useState('');
  const [casNumber, setCasNumber] = useState('');
  const [supplier, setSupplier] = useState('');
  const [productNumber, setProductNumber] = useState('');
  const [mw, setMw] = useState('');
  const [mwAutoTag, setMwAutoTag] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('g');
  const [location, setLocation] = useState('');
  const [cabinetId, setCabinetId] = useState(
    cabinets.filter((c) => !c.isFavorite).find((c) => c.id === activeCabinetId)?.id ??
    cabinets.filter((c) => !c.isFavorite)[0]?.id ?? ''
  );
  const [storageConditions, setStorageConditions] = useState<StorageCondition[]>([]);
  const [autofilled, setAutofilled] = useState<Set<string>>(new Set());
  const [isSynthesized, setIsSynthesized] = useState(false);

  const [smiles, setSmiles] = useState('');
  const [inchiKey, setInchiKey] = useState('');

  const [casLookupLoading, setCasLookupLoading] = useState(false);
  const [casLookupError, setCasLookupError] = useState(false);
  const [nameLookupLoading, setNameLookupLoading] = useState(false);

  // ── 완료 화면 ─────────────────────────────────────────────
  const [success, setSuccess] = useState<{ compound: string; cabinet: string; pin: string } | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // ── 엑셀 일괄 상태 ────────────────────────────────────────
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkParsed, setBulkParsed] = useState<ParsedReagentRow[] | null>(null);
  const [bulkCabinetId, setBulkCabinetId] = useState(
    cabinets.filter((c) => !c.isFavorite).find((c) => c.id === activeCabinetId)?.id ??
    cabinets.filter((c) => !c.isFavorite)[0]?.id ?? ''
  );
  const [bulkFileErr, setBulkFileErr] = useState('');
  const [bulkDragOver, setBulkDragOver] = useState(false);
  const [bulkSuccess, setBulkSuccess] = useState<{ success: number; failed: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  // ESC 닫기
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // CAS 유효 형식 입력 시 자동 PubChem 조회 (debounce 800ms)
  useEffect(() => {
    if (!CAS_RE.test(casNumber.trim()) || casLookupLoading) return;
    const timer = setTimeout(() => { doCasLookup(); }, 800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [casNumber]);

  // ── 유효성 ────────────────────────────────────────────────
  const singleReady = compoundName.trim() && casNumber.trim() && quantity.trim() && location.trim() && cabinetId;
  const bulkReady = !!bulkParsed && !!bulkCabinetId;

  // ── 자동완성 ──────────────────────────────────────────────
  async function doAutofill() {
    const url = linkInput.trim();
    setAutofillLoading(true);
    try {
      const data = await autofillFromLink(url);
      if (!data) {
        showToast('지원하지 않는 링크예요');
        return;
      }
      const filled = new Set<string>();
      if (data.compoundName) { setCompoundName(data.compoundName); filled.add('compound'); }
      if (data.casNumber) { setCasNumber(data.casNumber); filled.add('cas'); }
      if (data.supplier) { setSupplier(data.supplier); filled.add('supplier'); }
      if (data.productNumber) { setProductNumber(data.productNumber); filled.add('product'); }
      if (data.mw) { setMw(String(data.mw)); filled.add('mw'); }
      setAutofilled(filled);
      setAutofillBanner(`✓ ${data.supplier ?? '공급자'}에서 정보를 자동으로 채웠어요`);
    } finally {
      setAutofillLoading(false);
    }
  }

  function resetAutofill() {
    setCompoundName(''); setCasNumber(''); setSupplier('');
    setProductNumber(''); setMw(''); setSmiles(''); setInchiKey('');
    setAutofilled(new Set());
    setAutofillBanner(null); setLinkInput('');
    setMwAutoTag(false);
  }

  // ── CAS PubChem 조회 ──────────────────────────────────────
  async function doCasLookup() {
    setCasLookupLoading(true);
    setCasLookupError(false);
    try {
      const data = await fetchByCas(casNumber.trim());
      if (!data) throw new Error('not found');
      const filled = new Set<string>(autofilled);
      if (data.mw) { setMw(String(data.mw)); setMwAutoTag(true); filled.add('mw'); }
      if (data.iupacName && !compoundName.trim()) { setCompoundName(data.iupacName); filled.add('compound'); }
      if (data.smiles) { setSmiles(data.smiles); filled.add('smiles'); }
      if (data.inchiKey) setInchiKey(data.inchiKey);
      setAutofilled(filled);
    } catch {
      setCasLookupError(true);
      setTimeout(() => setCasLookupError(false), 2000);
    } finally {
      setCasLookupLoading(false);
    }
  }

  // ── 물질명 PubChem 조회 ───────────────────────────────────
  async function doNameLookup() {
    const name = compoundName.trim();
    if (name.length < 2) return;
    setNameLookupLoading(true);
    try {
      const data = await fetchByName(name);
      if (!data) { showToast('PubChem에서 물질을 찾지 못했어요'); return; }
      const filled = new Set<string>(autofilled);
      if (data.casNumber && !casNumber.trim()) { setCasNumber(data.casNumber); filled.add('cas'); }
      if (data.mw) { setMw(String(data.mw)); setMwAutoTag(true); filled.add('mw'); }
      if (data.smiles) { setSmiles(data.smiles); filled.add('smiles'); }
      if (data.inchiKey) setInchiKey(data.inchiKey);
      if (data.iupacName) { setCompoundName(data.iupacName); filled.add('compound'); }
      setAutofilled(filled);
      showToast('PubChem에서 정보를 자동으로 채웠어요');
    } catch {
      showToast('PubChem 조회 중 오류가 발생했어요');
    } finally {
      setNameLookupLoading(false);
    }
  }

  // ── 보관 조건 칩 ──────────────────────────────────────────
  function toggleChip(cond: StorageCondition) {
    setStorageConditions((prev) =>
      prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond]
    );
  }

  // ── 단건 등록 제출 ────────────────────────────────────────
  async function submitSingle() {
    if (!singleReady) return;
    setSubmitLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const cab = cabinets.find((c) => c.id === cabinetId);
    const pin = `K0${1940 + Math.floor(Math.random() * 99)}`;
    onRegister({
      isFavorite: false,
      pinCode: pin,
      compoundName,
      casNumber,
      smiles: smiles || undefined,
      inchiKey: inchiKey || undefined,
      mw: mw ? parseFloat(mw) : undefined,
      supplier: supplier || undefined,
      productNumber: productNumber || undefined,
      location,
      quantity: parseFloat(quantity) || 0,
      unit,
      storageConditions: storageConditions.length ? storageConditions : undefined,
      isSynthesized: isSynthesized || undefined,
      cabinetId,
      registeredBy: '채은 Choi',
      isActive: true,
    });
    setSuccess({ compound: compoundName, cabinet: cab?.name ?? '', pin });
    setSubmitLoading(false);
  }

  // ── 엑셀 파일 처리 ────────────────────────────────────────
  function handleBulkFile(file: File) {
    setBulkFileErr('');
    const ext = '.' + file.name.split('.').pop()!.toLowerCase();
    if (!['.xlsx', '.csv'].includes(ext)) {
      setBulkFileErr('xlsx 또는 csv 파일만 업로드 가능해요');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setBulkFileErr('파일 크기가 10MB를 초과했어요');
      return;
    }
    setBulkFile(file);
    parseExcel(file).then((rows) => {
      setBulkParsed(rows);
    }).catch(() => setBulkFileErr('파일 파싱에 실패했어요'));
  }

  async function submitBulk() {
    if (!bulkReady || !bulkParsed) return;
    setSubmitLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const failed = bulkParsed.filter((r) => r._casValid === false).length;
    const successCount = bulkParsed.length - failed;
    if (onBulkRegister) onBulkRegister(bulkParsed, bulkCabinetId);
    setBulkSuccess({ success: successCount, failed });
    setSubmitLoading(false);
  }

  function resetForm() {
    setSuccess(null); setBulkSuccess(null);
    setCompoundName(''); setCasNumber(''); setSupplier(''); setProductNumber('');
    setMw(''); setSmiles(''); setInchiKey('');
    setQuantity(''); setLocation(''); setStorageConditions([]); setIsSynthesized(false);
    setAutofilled(new Set()); setAutofillBanner(null); setLinkInput('');
    setMwAutoTag(false); setBulkFile(null); setBulkParsed(null); setBulkFileErr('');
    setSubmitLoading(false);
  }

  const nonFavCabinets = cabinets.filter((c) => !c.isFavorite);

  // ── 렌더 ──────────────────────────────────────────────────
  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal
      aria-label="시약 등록"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
        zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        width: '520px', maxHeight: '90vh',
        background: 'var(--surface)', borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* 헤더 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <span style={{ fontSize: '15px', fontWeight: 500 }}>시약 등록</span>
          <button onClick={onClose} style={{ fontSize: '16px', color: 'var(--hint)', cursor: 'pointer', background: 'none', border: 'none', lineHeight: 1 }}>✕</button>
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {(['single', 'bulk'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '10px', fontSize: '13px', border: 'none', cursor: 'pointer',
                background: activeTab === tab ? 'var(--surface)' : 'var(--surface2)',
                color: activeTab === tab ? 'var(--blue)' : 'var(--muted)',
                fontWeight: activeTab === tab ? 500 : 400,
                fontFamily: 'inherit',
                borderBottom: activeTab === tab ? '2px solid var(--blue)' : '2px solid transparent',
              }}
            >
              {tab === 'single' ? '단건 등록' : '엑셀 일괄 등록'}
            </button>
          ))}
        </div>

        {/* 완료 화면 (단건) */}
        {success && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#EAF3DE', color: '#3B6D11', fontSize: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontWeight: 700 }}>✓</div>
            <div style={{ fontSize: '17px', fontWeight: 500, marginBottom: '10px' }}>시약이 등록됐어요!</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '24px' }}
              dangerouslySetInnerHTML={{ __html: `"${success.compound}"이(가) <strong>${success.cabinet}</strong>에 추가됐어요.<br>핀 번호 <strong>${success.pin}</strong>이 자동으로 부여됐어요.` }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn" onClick={resetForm}>계속 등록</button>
              <button className="btn btn-primary" onClick={onClose}>닫기</button>
            </div>
          </div>
        )}

        {/* 완료 화면 (엑셀) */}
        {bulkSuccess && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#EAF3DE', color: '#3B6D11', fontSize: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontWeight: 700 }}>✓</div>
            <div style={{ fontSize: '17px', fontWeight: 500, marginBottom: '10px' }}>시약이 등록됐어요!</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '24px' }}>
              <strong>{bulkSuccess.success}개</strong> 시약이 등록됐어요!
              {bulkSuccess.failed > 0 && <><br />{bulkSuccess.failed}개는 오류로 건너뜄어요.</>}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn" onClick={resetForm}>계속 등록</button>
              <button className="btn btn-primary" onClick={onClose}>닫기</button>
            </div>
          </div>
        )}

        {/* 단건 등록 폼 */}
        {!success && !bulkSuccess && activeTab === 'single' && (
          <>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {/* §0 구매 링크 자동완성 */}
              <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r-lg) var(--r-lg) 0 0', padding: '14px 20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '8px' }}>
                  구매 링크로 자동완성
                  <span style={{ fontWeight: 400, color: 'var(--muted)', marginLeft: '6px' }}>Sigma-Aldrich, TCI, Alfa Aesar 지원</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    placeholder="구매 링크를 붙여넣으면 정보를 자동으로 채워요"
                    style={{ flex: 1, height: '34px', border: '1px solid var(--border2)', borderRadius: 'var(--r)', padding: '0 10px', fontSize: '13px', fontFamily: 'inherit', background: 'var(--surface)', color: 'var(--text)', outline: 'none' }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--blue)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border2)')}
                  />
                  <button
                    disabled={linkInput.trim().length < 10 || autofillLoading}
                    onClick={doAutofill}
                    className="btn"
                    style={{ height: '34px', whiteSpace: 'nowrap', opacity: (linkInput.trim().length < 10 || autofillLoading) ? 0.45 : 1 }}
                  >
                    {autofillLoading ? '조회 중...' : '자동완성'}
                  </button>
                </div>
                {autofillBanner && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', padding: '7px 10px', background: '#EAF3DE', borderRadius: 'var(--r)', color: '#3B6D11', fontSize: '12px' }}>
                    <span>{autofillBanner}</span>
                    <button onClick={resetAutofill} style={{ background: 'none', border: 'none', color: '#3B6D11', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>초기화</button>
                  </div>
                )}
              </div>

              <div style={{ height: '1px', background: 'var(--border)', margin: '0 20px' }} />

              {/* §1 식별 정보 */}
              <div style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '12px' }}>식별 정보</div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                    컴파운드명 <span style={{ color: 'var(--red)' }}>*</span>
                    <span style={{ fontWeight: 400, color: 'var(--hint)', marginLeft: '6px', fontSize: '11px' }}>이름 입력 후 🔍로 PubChem 자동완성</span>
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      value={compoundName}
                      onChange={(e) => setCompoundName(e.target.value)}
                      readOnly={autofilled.has('compound')}
                      placeholder="예) 4-Aminophenol"
                      style={{
                        flex: 1, height: '34px', border: '1px solid var(--border2)', borderRadius: 'var(--r)',
                        padding: '0 10px', fontSize: '13px', fontFamily: 'inherit', outline: 'none',
                        background: autofilled.has('compound') ? '#EAF3DE' : 'var(--surface)',
                        color: 'var(--text)',
                        borderColor: autofilled.has('compound') ? '#3B6D11' : undefined,
                      }}
                      onFocus={(e) => { if (!autofilled.has('compound')) e.currentTarget.style.borderColor = 'var(--blue)'; }}
                      onBlur={(e) => { if (!autofilled.has('compound')) e.currentTarget.style.borderColor = 'var(--border2)'; }}
                    />
                    <button
                      disabled={compoundName.trim().length < 2 || nameLookupLoading}
                      onClick={doNameLookup}
                      className="btn"
                      title="물질명으로 PubChem 검색"
                      style={{
                        height: '34px', whiteSpace: 'nowrap', fontSize: '13px',
                        opacity: (compoundName.trim().length < 2 || nameLookupLoading) ? 0.45 : 1,
                      }}
                    >
                      {nameLookupLoading ? '...' : '🔍'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>CAS 번호 <span style={{ color: 'var(--red)' }}>*</span></label>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        value={casNumber}
                        onChange={(e) => setCasNumber(e.target.value)}
                        readOnly={autofilled.has('cas')}
                        placeholder="123-30-8"
                        style={{
                          flex: 1, height: '34px', border: '1px solid var(--border2)', borderRadius: 'var(--r)',
                          padding: '0 10px', fontSize: '13px', fontFamily: 'inherit', outline: 'none',
                          background: autofilled.has('cas') ? '#EAF3DE' : 'var(--surface)',
                          color: 'var(--text)',
                          borderColor: autofilled.has('cas') ? '#3B6D11' : undefined,
                        }}
                      />
                      <button
                        disabled={!CAS_RE.test(casNumber.trim()) || casLookupLoading}
                        onClick={doCasLookup}
                        className="btn"
                        style={{
                          height: '34px', whiteSpace: 'nowrap',
                          opacity: (!CAS_RE.test(casNumber.trim()) || casLookupLoading) ? 0.45 : 1,
                          ...(casLookupError ? { background: '#FCEBEB', color: 'var(--red)', borderColor: 'var(--red)' } : {}),
                        }}
                      >
                        {casLookupLoading ? '...' : casLookupError ? '없음' : '조회↗'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>공급자</label>
                    <input
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      readOnly={autofilled.has('supplier')}
                      placeholder="Sigma-Aldrich"
                      style={{ width: '100%', height: '34px', border: '1px solid var(--border2)', borderRadius: 'var(--r)', padding: '0 10px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: autofilled.has('supplier') ? '#EAF3DE' : 'var(--surface)', color: 'var(--text)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>제품번호</label>
                    <input value={productNumber} onChange={(e) => setProductNumber(e.target.value)} placeholder="A3861" style={{ width: '100%', height: '34px', border: '1px solid var(--border2)', borderRadius: 'var(--r)', padding: '0 10px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: 'var(--surface)', color: 'var(--text)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                      MW
                      {mwAutoTag && <span style={{ fontSize: '10px', background: '#EAF3DE', color: '#3B6D11', padding: '1px 5px', borderRadius: '3px', marginLeft: '4px' }}>자동완성</span>}
                    </label>
                    <input type="number" step="any" value={mw} onChange={(e) => setMw(e.target.value)} placeholder="109.13" style={{ width: '100%', height: '34px', border: '1px solid var(--border2)', borderRadius: 'var(--r)', padding: '0 10px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: autofilled.has('mw') ? '#EAF3DE' : 'var(--surface)', color: 'var(--text)' }} />
                  </div>
                </div>

                {/* SMILES — PubChem 자동완성 시만 표시 */}
                {smiles && (
                  <div style={{ marginBottom: '4px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                      SMILES
                      <span style={{ fontSize: '10px', background: '#EAF3DE', color: '#3B6D11', padding: '1px 5px', borderRadius: '3px', marginLeft: '4px' }}>자동완성</span>
                    </label>
                    <input
                      value={smiles}
                      onChange={(e) => setSmiles(e.target.value)}
                      style={{
                        width: '100%', height: '34px', border: '1px solid #3B6D11', borderRadius: 'var(--r)',
                        padding: '0 10px', fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace",
                        outline: 'none', boxSizing: 'border-box',
                        background: '#EAF3DE', color: '#3B6D11',
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ height: '1px', background: 'var(--border)', margin: '0 20px' }} />

              {/* §2 보관 정보 */}
              <div style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '12px' }}>보관 정보</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>용량 <span style={{ color: 'var(--red)' }}>*</span></label>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input type="number" min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="500" style={{ flex: 1, height: '34px', border: '1px solid var(--border2)', borderRadius: 'var(--r)', padding: '0 10px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', background: 'var(--surface)', color: 'var(--text)' }} />
                      <select value={unit} onChange={(e) => setUnit(e.target.value)} style={{ width: '64px', height: '34px', border: '1px solid var(--border2)', borderRadius: 'var(--r)', padding: '0 8px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', background: 'var(--surface)', color: 'var(--text)' }}>
                        {['g', 'mg', 'kg', 'mL', 'L', '개'].map((u) => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>위치 <span style={{ color: 'var(--red)' }}>*</span></label>
                    <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="냉장-2" style={{ width: '100%', height: '34px', border: '1px solid var(--border2)', borderRadius: 'var(--r)', padding: '0 10px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: 'var(--surface)', color: 'var(--text)' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>보관 조건 <span style={{ fontSize: '11px', color: 'var(--hint)' }}>(선택)</span></label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {STORAGE_CHIP_CONFIG.map(({ key, label, style: chipStyle }) => {
                      const active = storageConditions.includes(key);
                      return (
                        <button
                          key={key}
                          onClick={() => toggleChip(key)}
                          style={{
                            height: '28px', padding: '0 12px', border: '1px solid var(--border2)',
                            borderRadius: '14px', fontSize: '12px', fontFamily: 'inherit', cursor: 'pointer',
                            transition: 'all .15s',
                            ...(active ? chipActiveClass[chipStyle] : { background: 'var(--surface2)', color: 'var(--muted)' }),
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>시약장 <span style={{ color: 'var(--red)' }}>*</span></label>
                  <select value={cabinetId} onChange={(e) => setCabinetId(e.target.value)} style={{ width: '100%', height: '34px', border: '1px solid var(--border2)', borderRadius: 'var(--r)', padding: '0 8px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', background: 'var(--surface)', color: 'var(--text)' }}>
                    <option value="">시약장을 선택해주세요</option>
                    {nonFavCabinets.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* 자체 합성 시약 플래그 */}
              <label
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 10px', borderRadius: 'var(--r)', cursor: 'pointer',
                  background: isSynthesized ? '#EAF3DE' : 'var(--surface2)',
                  border: `1px solid ${isSynthesized ? '#5DCAA5' : 'var(--border2)'}`,
                  transition: 'background .15s, border-color .15s',
                  marginTop: '2px',
                }}
              >
                <input
                  type="checkbox"
                  checked={isSynthesized}
                  onChange={(e) => setIsSynthesized(e.target.checked)}
                  style={{ accentColor: '#1D9E75', flexShrink: 0 }}
                />
                <span style={{ fontSize: '12px', color: 'var(--text)', userSelect: 'none' }}>
                  🔬 자체 합성 시약
                  <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '6px' }}>COA 발행 가능</span>
                </span>
              </label>
            </div>

            {/* 푸터 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
              <span style={{ fontSize: '12px', color: singleReady ? '#3B6D11' : 'var(--muted)' }}>
                {singleReady ? '등록 준비됐어요' : '* 필수 항목을 입력해주세요'}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn" onClick={onClose}>취소</button>
                <button
                  className="btn btn-primary"
                  disabled={!singleReady || submitLoading}
                  onClick={submitSingle}
                  style={{ opacity: (!singleReady || submitLoading) ? 0.7 : 1 }}
                >
                  {submitLoading ? '등록 중...' : '등록'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* 엑셀 일괄 등록 폼 */}
        {!success && !bulkSuccess && activeTab === 'bulk' && (
          <>
            <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>
              {/* 드롭존 */}
              {!bulkFile ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setBulkDragOver(true); }}
                  onDragLeave={() => setBulkDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setBulkDragOver(false); if (e.dataTransfer.files[0]) handleBulkFile(e.dataTransfer.files[0]); }}
                  onClick={() => bulkFileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${bulkDragOver ? 'var(--blue)' : 'var(--border2)'}`,
                    borderRadius: 'var(--r)', padding: '24px', textAlign: 'center',
                    cursor: 'pointer', color: 'var(--muted)', fontSize: '13px',
                    background: bulkDragOver ? 'var(--blue-lt)' : 'transparent',
                    transition: 'border-color .15s, background .15s',
                  }}
                >
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>📥</div>
                  <div>파일을 드래그하거나 <strong>클릭</strong>해서 업로드</div>
                  <div style={{ fontSize: '11px', marginTop: '4px', color: 'var(--hint)' }}>.xlsx, .csv | 최대 10MB</div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--surface2)' }}>
                  <span style={{ flex: 1, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bulkFile.name}</span>
                  <span style={{ fontSize: '10px', background: '#EAF3DE', color: '#3B6D11', borderRadius: '4px', padding: '2px 6px', flexShrink: 0 }}>업로드 준비됨</span>
                  <button onClick={() => { setBulkFile(null); setBulkParsed(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '14px', lineHeight: 1, padding: '0 2px' }}>✕</button>
                </div>
              )}

              <input ref={bulkFileInputRef} type="file" accept=".xlsx,.csv" style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.[0]) handleBulkFile(e.target.files[0]); e.target.value = ''; }} />

              {bulkFileErr && <div style={{ color: 'var(--red)', fontSize: '12px', marginTop: '6px' }}>{bulkFileErr}</div>}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                <button onClick={() => downloadTemplate()} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>📥 템플릿 다운로드</button>
              </div>

              {/* 미리보기 */}
              {bulkParsed && bulkParsed.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '12px', fontWeight: 500 }}>
                    <span>총 {bulkParsed.length}행</span>
                    <span style={{ fontWeight: 400, color: 'var(--muted)' }}>상위 3행 미리보기</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr>
                          {['컴파운드명', 'CAS 번호', '용량', '단위', '위치', '상태'].map((h) => (
                            <th key={h} style={{ background: 'var(--surface2)', padding: '5px 8px', border: '1px solid var(--border)', textAlign: 'left', color: 'var(--muted)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bulkParsed.slice(0, 3).map((row, i) => (
                          <tr key={i} style={{ background: row._casValid === false ? '#FCEBEB' : undefined }}>
                            <td style={{ padding: '5px 8px', border: '1px solid var(--border)' }}>{row.compoundName ?? ''}</td>
                            <td style={{ padding: '5px 8px', border: '1px solid var(--border)' }}>{row.casNumber ?? ''}</td>
                            <td style={{ padding: '5px 8px', border: '1px solid var(--border)' }}>{row.quantity ?? ''}</td>
                            <td style={{ padding: '5px 8px', border: '1px solid var(--border)' }}>{row.unit ?? ''}</td>
                            <td style={{ padding: '5px 8px', border: '1px solid var(--border)' }}>{row.location ?? ''}</td>
                            <td style={{ padding: '5px 8px', border: '1px solid var(--border)' }}>
                              {row._casValid === false
                                ? <span style={{ fontSize: '10px', background: 'var(--red)', color: '#fff', borderRadius: '3px', padding: '1px 4px' }}>CAS 오류</span>
                                : '✓'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>등록할 시약장 <span style={{ color: 'var(--red)' }}>*</span></label>
                <select value={bulkCabinetId} onChange={(e) => setBulkCabinetId(e.target.value)} style={{ width: '100%', height: '34px', border: '1px solid var(--border2)', borderRadius: 'var(--r)', padding: '0 8px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', background: 'var(--surface)', color: 'var(--text)' }}>
                  <option value="">시약장을 선택해주세요</option>
                  {nonFavCabinets.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--muted)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text)' }}>필수 컬럼:</strong> 컴파운드명, CAS 번호, 위치, 용량<br />
                <strong style={{ color: 'var(--text)' }}>선택 컬럼:</strong> 핀번호, 공급자, SMILES, MW, 순도, 주의사항<br />
                첫 행은 헤더로 인식. 최대 500행까지 한 번에 등록 가능.
              </div>
            </div>

            {/* 푸터 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
              <span style={{ fontSize: '12px', color: bulkReady ? '#3B6D11' : 'var(--muted)' }}>
                {bulkReady ? '등록 준비됐어요' : '* 파일과 시약장을 선택해주세요'}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn" onClick={onClose}>취소</button>
                <button
                  className="btn btn-primary"
                  disabled={!bulkReady || submitLoading}
                  onClick={submitBulk}
                  style={{ opacity: (!bulkReady || submitLoading) ? 0.7 : 1 }}
                >
                  {submitLoading ? '등록 중...' : '일괄 등록'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
