/**
 * ReagentPage — 시약장 메인 페이지
 *
 * 레이아웃 (FR-02):
 *   GNB (48px) / [Sidebar 200px | Main flex | BasketPanel 200px]
 *
 * 상태 관리 원칙:
 *   - 장바구니: Zustand (basketStore) — 어떤 상태 전환에도 초기화 금지
 *   - 뷰 모드: localStorage ('jinunote_reagent_view') 로 복원
 *   - 선택 ID 집합: Zustand items 에서 파생 (실시간 동기화)
 */
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Cabinet, ReagentItem, RecentSearch, SortState, StorageCondition, ViewMode } from '@/types/reagent';
import type { ParsedReagentRow } from '@/utils/excel';
import { useBasketStore } from '@/store/basketStore';
import {
  MOCK_CABINETS,
  MOCK_REAGENTS,
  MOCK_RECENT_SEARCHES,
  MOCK_RECENT_USERS,
} from '@/data/reagentData';
import { paginate, totalPages } from '@/utils/pagination';
import { ToastProvider, useToast } from './components/Toast';

import PageHeader           from './components/PageHeader';
import CabinetTabBar        from './components/CabinetTabBar';
import RecentSearchChips    from './components/RecentSearchChips';
import ViewToggle           from './components/ViewToggle';
import CardView             from './components/CardView/CardView';
import QuantTable           from './components/QuantTable/QuantTable';
import Pagination           from './components/Pagination';
import BasketPanel          from './components/BasketPanel/BasketPanel';
import ReagentDataModal     from './components/ReagentDataModal/ReagentDataModal';
import RegisterModal        from './components/RegisterModal/RegisterModal';
import AddCabinetModal      from './components/AddCabinetModal/AddCabinetModal';
import SendToMoaModal       from './components/SendToMoaModal/SendToMoaModal';
import PrintModal           from './components/PrintModal/PrintModal';
import LabelModal          from './components/LabelModal/LabelModal';
import StructureSearchModal from './components/StructureSearchModal/StructureSearchModal';

const PER_PAGE_CARD  = 9;
const PER_PAGE_TABLE = 20;

function loadViewMode(): ViewMode {
  try {
    const v = localStorage.getItem('jinunote_reagent_view');
    return v === 'table' ? 'table' : 'card';
  } catch {
    return 'card';
  }
}

function ReagentPageInner() {
  const { showToast } = useToast();
  const basket = useBasketStore();
  const navigate = useNavigate();

  // ── 시약장 + 시약 (mutable state) ────────────────────────────
  const [cabinets, setCabinets] = useState<Cabinet[]>(MOCK_CABINETS);
  const [reagents, setReagents] = useState<ReagentItem[]>(MOCK_REAGENTS);

  // ── 시약장 탭 ────────────────────────────────────────────────
  const [activeCabId, setActiveCabId] = useState(MOCK_CABINETS[0].id);

  // ── 검색 ────────────────────────────────────────────────────
  const [query, setQuery] = useState('');

  // ── 최근 검색 (로컬) ─────────────────────────────────────────
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(MOCK_RECENT_SEARCHES);

  // ── 뷰 모드 ─────────────────────────────────────────────────
  const [view, setView] = useState<ViewMode>(loadViewMode);
  function changeView(v: ViewMode) {
    setView(v);
    localStorage.setItem('jinunote_reagent_view', v);
    setPage(1);
  }

  // ── 페이지 ──────────────────────────────────────────────────
  const [page, setPage] = useState(1);

  // ── 정렬 ────────────────────────────────────────────────────
  const [sortState, setSortState] = useState<SortState>({ key: 'pinCode', dir: 'desc' });
  function handleSort(key: keyof ReagentItem) {
    setSortState((s) => ({
      key,
      dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc',
    }));
    setPage(1);
  }

  // ── 모달 상태 ────────────────────────────────────────────────
  const [modalId, setModalId] = useState<string | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showAddCabinetModal, setShowAddCabinetModal] = useState(false);
  const [sendToMoaOpen, setSendToMoaOpen] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showStructureSearchModal, setShowStructureSearchModal] = useState(false);
  const [structureQuery, setStructureQuery] = useState('');

  const modalReagent = reagents.find((r) => r.id === modalId) ?? null;

  // ── 자주쓰는 탭 여부 ─────────────────────────────────────────
  const isFavTab = useMemo(() => {
    const cab = cabinets.find((c) => c.id === activeCabId);
    return !!cab?.isFavorite;
  }, [cabinets, activeCabId]);

  // ── 필터링 + 정렬 + 페이지네이션 ────────────────────────────
  const filtered = useMemo(() => {
    const kw = query.toLowerCase().trim();
    const cabinetFiltered = reagents.filter((r) => {
      const cab = cabinets.find((c) => c.id === activeCabId);
      if (!cab) return true;
      if (cab.isFavorite) return r.isFavorite && !r.isReference;
      return r.cabinetId === activeCabId;
    });

    const textFiltered = !kw
      ? cabinetFiltered
      : cabinetFiltered.filter(
          (r) =>
            r.compoundName.toLowerCase().includes(kw) ||
            (r.casNumber ?? '').toLowerCase().includes(kw) ||
            r.pinCode.toLowerCase().includes(kw) ||
            (r.alias ?? '').toLowerCase().includes(kw),
        );

    if (!structureQuery.trim()) return textFiltered;
    const sq = structureQuery.trim();
    return textFiltered.filter(
      (r) =>
        r.smiles === sq ||
        (r.inchiKey != null && r.inchiKey.startsWith(sq.substring(0, 14))),
    );
  }, [query, structureQuery, activeCabId, reagents, cabinets]);

  const sorted = useMemo(() => {
    if (!sortState.key) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortState.key as keyof ReagentItem];
      const bv = b[sortState.key as keyof ReagentItem];
      const cmp = String(av ?? '').localeCompare(String(bv ?? ''), 'ko');
      return sortState.dir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortState]);

  const perPage  = view === 'card' ? PER_PAGE_CARD : PER_PAGE_TABLE;
  const numPages = totalPages(sorted.length, perPage);
  const pageData = paginate(sorted, page, perPage);

  // ── 선택 ID 집합 (Zustand items에서 파생) ────────────────────
  const selectedIds = useMemo(() => new Set(Object.keys(basket.items)), [basket.items]);

  // ── 체크 핸들러 ──────────────────────────────────────────────
  const handleSelect = useCallback(
    (id: string, checked: boolean) => {
      if (checked) {
        const r = reagents.find((x) => x.id === id);
        if (r) basket.add({ id: r.id, pinCode: r.pinCode, name: r.compoundName, smiles: r.smiles });
      } else {
        basket.remove(id);
      }
    },
    [basket, reagents],
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      pageData.forEach((r) => {
        if (checked) basket.add({ id: r.id, pinCode: r.pinCode, name: r.compoundName, smiles: r.smiles });
        else basket.remove(r.id);
      });
    },
    [pageData, basket],
  );

  // ── 검색 ────────────────────────────────────────────────────
  function handleSearch(q: string) {
    setQuery(q);
    setPage(1);
    if (q.trim()) {
      const entry: RecentSearch = { keyword: q.trim(), searchedAt: new Date() };
      setRecentSearches((prev) => [entry, ...prev.filter((s) => s.keyword !== q.trim())].slice(0, 5));
    }
  }

  function applyChip(kw: string) {
    setQuery(kw);
    setPage(1);
  }

  // ── 시약 등록 핸들러 ─────────────────────────────────────────
  function handleRegister(item: Omit<ReagentItem, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date();
    const newReagent: ReagentItem = {
      ...item,
      id: `rgn_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setReagents((prev) => [newReagent, ...prev]);
    // 해당 시약장 count 업데이트
    setCabinets((prev) =>
      prev.map((c) =>
        c.id === newReagent.cabinetId ? { ...c, count: c.count + 1 } : c,
      ),
    );
    showToast(`${newReagent.compoundName} 등록 완료`);
    setShowRegisterModal(false);
  }

  function handleBulkRegister(rows: ParsedReagentRow[], cabinetId: string) {
    const now = new Date();
    const newReagents: ReagentItem[] = rows.map((row, i) => ({
      id: `rgn_${Date.now()}_${i}`,
      isFavorite: false,
      pinCode: row.pinCode ?? `B${String(i + 1).padStart(3, '0')}`,
      compoundName: row.compoundName ?? '(미입력)',
      alias: undefined,
      smiles: row.smiles,
      casNumber: row.casNumber,
      mw: row.mw,
      location: row.location ?? '',
      quantity: row.quantity ?? 0,
      unit: row.unit ?? 'g',
      supplier: row.supplier,
      productNumber: row.productNumber,
      purity: row.purity,
      notes: row.notes,
      cabinetId,
      registeredBy: '채은',
      isActive: true,
      storageConditions: [] as StorageCondition[],
      createdAt: now,
      updatedAt: now,
    }));
    setReagents((prev) => [...newReagents, ...prev]);
    const countMap: Record<string, number> = {};
    newReagents.forEach((r) => {
      countMap[r.cabinetId] = (countMap[r.cabinetId] ?? 0) + 1;
    });
    setCabinets((prev) =>
      prev.map((c) =>
        countMap[c.id] !== undefined ? { ...c, count: c.count + countMap[c.id] } : c,
      ),
    );
    showToast(`${newReagents.length}개 시약 일괄 등록 완료`);
    setShowRegisterModal(false);
  }

  // ── 시약장 추가 핸들러 ────────────────────────────────────────
  function handleCabinetCreated(newCab: Cabinet) {
    setCabinets((prev) => [...prev, newCab]);
    setShowAddCabinetModal(false);
    showToast(`${newCab.name} 시약장이 추가되었습니다`);
  }

  // ── 자주쓰는 시약장 추가/제거 ─────────────────────────────────
  function handleAddToFav() {
    const basketIds = Object.keys(basket.items);
    // 참조 시약이면 원본 ID로 교체
    const targetIds = basketIds.map((id) => {
      const r = reagents.find((x) => x.id === id);
      return r?.isReference && r.originId ? r.originId : id;
    });
    const updated = reagents.map((r) =>
      targetIds.includes(r.id) ? { ...r, isFavorite: true } : r,
    );
    setReagents(updated);
    basket.clear();
    showToast(`${targetIds.length}개 시약을 자주쓰는 시약장에 추가했습니다`);
  }

  function handleRemoveFromFav() {
    const basketIds = Object.keys(basket.items);
    const targetIds = basketIds.map((id) => {
      const r = reagents.find((x) => x.id === id);
      return r?.isReference && r.originId ? r.originId : id;
    });
    const updated = reagents.map((r) =>
      targetIds.includes(r.id) ? { ...r, isFavorite: false } : r,
    );
    setReagents(updated);
    basket.clear();
    showToast(`${targetIds.length}개 시약을 자주쓰는 시약장에서 제거했습니다`);
  }

  // ── 다른 시약장에 추가 (참조 시약 생성) ──────────────────────
  function handleAddToOtherCabinet(targetCabId: string, toAddIds: string[], alreadyCount: number) {
    const targetCab = cabinets.find((c) => c.id === targetCabId);
    if (!targetCab) return;

    const now = new Date();
    const newReferences: ReagentItem[] = toAddIds.flatMap((id, i) => {
      const origin = reagents.find((r) => r.id === id);
      if (!origin) return [];
      const ref: ReagentItem = {
        ...origin,
        id: `rgn_ref_${Date.now()}_${i}`,
        cabinetId: targetCabId,
        isReference: true,
        originId: origin.id,
        originCabinetName: cabinets.find((c) => c.id === origin.cabinetId)?.name ?? '',
        createdAt: now,
        updatedAt: now,
      };
      return [ref];
    });

    // 원본 시약의 referencedIn 업데이트
    const updatedReagents = reagents.map((r) => {
      if (toAddIds.includes(r.id)) {
        const refs = r.referencedIn ?? [];
        if (!refs.includes(targetCabId)) {
          return { ...r, referencedIn: [...refs, targetCabId] };
        }
      }
      return r;
    });

    setReagents([...updatedReagents, ...newReferences]);
    setCabinets((prev) =>
      prev.map((c) =>
        c.id === targetCabId ? { ...c, count: c.count + newReferences.length } : c,
      ),
    );

    basket.clear();

    const msgs: string[] = [];
    if (newReferences.length > 0) msgs.push(`${newReferences.length}개 참조 추가`);
    if (alreadyCount > 0) msgs.push(`${alreadyCount}개 이미 있음`);
    showToast(`${targetCab.name}: ${msgs.join(', ')}`);
  }

  // ── ReagentDataModal 저장 ─────────────────────────────────────
  function handleModalSave(id: string, data: Partial<ReagentItem>) {
    setReagents((prev) =>
      prev.map((r) => r.id === id ? { ...r, ...data, updatedAt: new Date() } : r),
    );
  }

  // ── 인쇄 대상: 장바구니 선택 시약 우선, 없으면 현재 탭 전체 ──
  const printTargets = useMemo(() => {
    const basketIds = Object.keys(basket.items);
    if (basketIds.length > 0) return reagents.filter((r) => basketIds.includes(r.id));
    return filtered;
  }, [basket.items, reagents, filtered]);

  function handlePrint() {
    if (printTargets.length === 0) {
      showToast('인쇄할 시약이 없어요. 시약을 선택하거나 검색해주세요');
      return;
    }
    setShowPrintModal(true);
  }

  function handleLabelPrint() {
    if (printTargets.length === 0) {
      showToast('라벨을 인쇄할 시약이 없어요. 시약을 선택하거나 검색해주세요');
      return;
    }
    setShowLabelModal(true);
  }

  function handleStructureSearch(smiles: string) {
    setStructureQuery(smiles);
    setPage(1);
  }

  function handleStructureClear() {
    setStructureQuery('');
    setPage(1);
  }

  function handleModalDisuse(id: string) {
    setReagents((prev) =>
      prev.map((r) => r.id === id ? { ...r, isActive: false, updatedAt: new Date() } : r),
    );
    setModalId(null);
    showToast('말소 처리되었습니다');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* ── GNB (48px) ── */}
      <header style={{
        height: '48px', flexShrink: 0,
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: '12px', zIndex: 100,
      }}>
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 500, fontSize: '15px', color: 'var(--text)', textDecoration: 'none' }}>
          <div style={{ width: '28px', height: '28px', background: 'var(--blue)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="7.5" r="5.5" stroke="white" strokeWidth="1.4"/>
              <path d="M4.5 7.5h6M7.5 4.5v6" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          Jinu<span style={{ color: 'var(--blue)' }}>note</span>
        </a>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>채은</span>
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%',
            background: 'var(--blue-lt)', color: 'var(--blue)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 500, cursor: 'pointer',
          }}>CE</div>
        </div>
      </header>

      {/* ── 바디 ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* 사이드바 (200px) */}
        <nav aria-label="서비스 메뉴" style={{
          width: '200px', flexShrink: 0,
          background: 'var(--surface)', borderRight: '1px solid var(--border)',
          overflowY: 'auto', padding: '10px 0 20px',
        }}>
          {([
            { label: '정보', items: [{ icon: '💬', name: '나의질문', active: false, badge: '', onClick: undefined }] },
            { label: '내 연구실', items: [{ icon: '📢', name: '연구실 공지사항', active: false, badge: '', onClick: undefined }, { icon: '⚙️', name: '계정정보', active: false, badge: '', onClick: undefined }, { icon: '👥', name: '그룹', active: false, badge: '', onClick: undefined }, { icon: '📁', name: '프로젝트', active: false, badge: '', onClick: undefined }] },
            { label: '인벤토리', items: [{ icon: '🛒', name: '시약 구매', active: false, badge: '', onClick: undefined }, { icon: '📋', name: '구매 현황', active: false, badge: '', onClick: undefined }, { icon: '🧪', name: '시약장', active: true, badge: '', onClick: undefined }, { icon: '📦', name: '소모품', active: false, badge: '', onClick: undefined }, { icon: '🔬', name: '장비', active: false, badge: '', onClick: undefined }] },
            { label: '연구노트', items: [{ icon: '📓', name: '연구노트', active: false, badge: '', onClick: () => navigate('/note') }, { icon: '🧫', name: '모아 실험', active: false, badge: '', onClick: () => navigate('/') }, { icon: '📰', name: '랩북 피드', active: false, badge: '11', onClick: undefined }] },
            { label: '커뮤니티', items: [{ icon: '🌐', name: '커뮤니티', active: false, badge: '', onClick: undefined }] },
          ] as Array<{ label: string; items: Array<{ icon: string; name: string; active: boolean; badge: string; onClick: (() => void) | undefined }> }>).map((section) => (
            <div key={section.label} style={{ padding: '14px 10px 4px' }}>
              <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--hint)', textTransform: 'uppercase', letterSpacing: '.06em', padding: '0 8px', marginBottom: '4px' }}>
                {section.label}
              </div>
              {section.items.map((item) => (
                <div
                  key={item.name}
                  onClick={item.onClick}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '9px',
                    padding: '7px 8px', borderRadius: 'var(--r)',
                    fontSize: '12px',
                    color: item.active ? 'var(--blue)' : 'var(--muted)',
                    background: item.active ? 'var(--blue-lt)' : 'transparent',
                    fontWeight: item.active ? 500 : 400,
                    cursor: item.onClick ? 'pointer' : 'default', transition: 'background .12s, color .12s',
                  }}
                >
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

        {/* ── 메인 ── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          <PageHeader
            searchValue={query}
            onSearch={handleSearch}
            onRegister={() => setShowRegisterModal(true)}
            onPrint={handlePrint}
            onLabelPrint={handleLabelPrint}
            onStructureSearch={() => setShowStructureSearchModal(true)}
            structureActive={!!structureQuery}
            reagents={sorted}
          />

          <CabinetTabBar
            cabinets={cabinets}
            reagents={reagents}
            activeCabinetId={activeCabId}
            onTabChange={(id) => { setActiveCabId(id); setPage(1); }}
            onAddCabinet={() => setShowAddCabinetModal(true)}
          />

          {/* 콘텐츠 영역 */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

              {/* 툴바 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexShrink: 0, gap: '8px' }}>
                <RecentSearchChips searches={recentSearches} onChipClick={applyChip} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', color: 'var(--hint)', whiteSpace: 'nowrap' }}>
                    총 {sorted.length}개 시약
                  </span>
                  <ViewToggle view={view} onChange={changeView} />
                </div>
              </div>

              {/* 카드 뷰 / 테이블 뷰 */}
              {view === 'card' ? (
                <CardView
                  reagents={pageData}
                  selectedIds={selectedIds}
                  onSelect={handleSelect}
                  onCardClick={setModalId}
                />
              ) : (
                <QuantTable
                  reagents={pageData}
                  selectedIds={selectedIds}
                  onSelect={handleSelect}
                  onSelectAll={handleSelectAll}
                  onRowClick={setModalId}
                  sortState={sortState}
                  onSort={handleSort}
                />
              )}

              {/* 페이지네이션 */}
              <Pagination
                currentPage={page}
                totalPages={numPages}
                onChange={(p) => { setPage(p); }}
              />
            </div>

            {/* 장바구니 패널 */}
            <BasketPanel
              cabinets={cabinets}
              activeCabinetId={activeCabId}
              allReagents={reagents}
              isFavTab={isFavTab}
              onAddToFav={handleAddToFav}
              onRemoveFromFav={handleRemoveFromFav}
              onAddToOtherCabinet={handleAddToOtherCabinet}
              onSendToMoa={() => setSendToMoaOpen(true)}
            />
          </div>
        </main>
      </div>

      {/* ── 시약 데이터 모달 ── */}
      {modalId && (
        <ReagentDataModal
          reagent={modalReagent}
          recentUsers={MOCK_RECENT_USERS}
          cabinets={cabinets.map((c) => ({ id: c.id, name: c.name }))}
          onClose={() => setModalId(null)}
          onSave={handleModalSave}
          onDisuse={handleModalDisuse}
        />
      )}

      {/* ── 시약 등록 모달 ── */}
      {showRegisterModal && (
        <RegisterModal
          cabinets={cabinets}
          activeCabinetId={activeCabId}
          onClose={() => setShowRegisterModal(false)}
          onRegister={handleRegister}
          onBulkRegister={handleBulkRegister}
        />
      )}

      {/* ── 시약장 추가 모달 ── */}
      {showAddCabinetModal && (
        <AddCabinetModal
          onClose={() => setShowAddCabinetModal(false)}
          onCreated={handleCabinetCreated}
        />
      )}

      {/* ── A4 인쇄 모달 ── */}
      <PrintModal
        open={showPrintModal}
        reagents={printTargets}
        cabinetName={cabinets.find((c) => c.id === activeCabId)?.name ?? ''}
        onClose={() => setShowPrintModal(false)}
      />

      {/* ── 라벨 인쇄 모달 ── */}
      <LabelModal
        open={showLabelModal}
        reagents={printTargets}
        onClose={() => setShowLabelModal(false)}
      />

      {/* ── 구조 검색 모달 ── */}
      <StructureSearchModal
        open={showStructureSearchModal}
        currentQuery={structureQuery}
        onSearch={handleStructureSearch}
        onClear={handleStructureClear}
        onClose={() => setShowStructureSearchModal(false)}
      />

      {/* ── 모아실험으로 넘기기 모달 ── */}
      <SendToMoaModal
        open={sendToMoaOpen}
        basket={basket.items}
        onClose={() => setSendToMoaOpen(false)}
        onSuccess={(_moaId) => {
          setSendToMoaOpen(false);
          basket.clear();
          showToast('모아실험으로 넘겼습니다');
          navigate('/');
        }}
      />
    </div>
  );
}

export default function ReagentPage() {
  return (
    <ToastProvider>
      <ReagentPageInner />
    </ToastProvider>
  );
}
