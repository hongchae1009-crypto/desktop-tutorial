import type { Cabinet, ReagentItem, RecentSearch, RecentUser } from '@/types/reagent';

// ── 시약장 목록 ───────────────────────────────────────────────
export const MOCK_CABINETS: Cabinet[] = [
  { id: 'cab_fav', name: '자주쓰는 시약장', color: '#EF9F27', isFavorite: true,  displayOrder: 0, count: 12 },
  { id: 'cab_001', name: 'KBS-LAB 메인',   color: '#185FA5', isFavorite: false, displayOrder: 1, count: 389 },
  { id: 'cab_002', name: '합성팀 공용',     color: '#1D9E75', isFavorite: false, displayOrder: 2, count: 127 },
  { id: 'cab_003', name: '냉장 보관함',     color: '#D85A30', isFavorite: false, displayOrder: 3, count: 44 },
  { id: 'cab_004', name: '위험물 캐비닛',   color: '#BA7517', isFavorite: false, displayOrder: 4, count: 18 },
];

// ── 시약 목록 ─────────────────────────────────────────────────
export const MOCK_REAGENTS: ReagentItem[] = [
  {
    id: 'rgn_001', pinCode: 'K01937',
    compoundName: 'Zinc(II) Trifluoromethanesulfonate',
    alias: 'for Electrolyte',
    smiles: 'C(F)(F)(F)S(=O)(=O)[O-].[Zn+2]',
    casNumber: '54010-75-2', mw: 363.5,
    location: '334', quantity: 5, unit: 'g',
    supplier: 'Sigma-Aldrich', productNumber: 'Z0057',
    qrUrl: 'https://app.jinuchem.com/inventory?d=24809',
    cabinetId: 'cab_001', registeredBy: 'user_001',
    isActive: true, createdAt: new Date('2026-01-15'), updatedAt: new Date('2026-02-20'),
  },
  {
    id: 'rgn_002', pinCode: 'K01936',
    compoundName: '7-(3-bromopropoxy)-3,4-dihydroquinolin-2(1H)-one',
    smiles: 'C1CC(=O)NC2=C1C=CC(=C2)OCCCBr',
    casNumber: '82657-32-7', mw: 284.15,
    location: '334', quantity: 0, unit: 'g',
    cabinetId: 'cab_001', registeredBy: 'user_001',
    isActive: true, createdAt: new Date('2026-01-10'), updatedAt: new Date('2026-03-16'),
  },
  {
    id: 'rgn_003', pinCode: 'K01935',
    compoundName: 'Potassium bis(trimethylsilyl)amide',
    alias: 'KHMDS',
    casNumber: '40949-94-8',
    location: '333-냉장-2', quantity: 100, unit: 'mL',
    supplier: 'Sigma-Aldrich',
    cabinetId: 'cab_001', registeredBy: 'user_001',
    isActive: true, createdAt: new Date('2025-12-01'), updatedAt: new Date('2026-01-20'),
  },
  {
    id: 'rgn_004', pinCode: 'K01934',
    compoundName: '7-(3-bromopropoxy)-3,4-dihydroquinolin-2(1H)-one',
    casNumber: '82657-32-7', mw: 284.15,
    location: '334', quantity: 0, unit: 'g',
    cabinetId: 'cab_001', registeredBy: 'user_002',
    isActive: true, createdAt: new Date('2025-11-20'), updatedAt: new Date('2026-02-10'),
  },
  {
    id: 'rgn_005', pinCode: 'K01933',
    compoundName: '7-((6-bromohexyl)oxy)-3,4-dihydroquinolin-2(1H)-one',
    location: '334', quantity: 0, unit: 'g',
    cabinetId: 'cab_001', registeredBy: 'user_001',
    isActive: true, createdAt: new Date('2025-10-15'), updatedAt: new Date('2025-12-05'),
  },
  {
    id: 'rgn_006', pinCode: 'K01932',
    compoundName: '4-Aminophenol',
    alias: 'para-Aminophenol',
    casNumber: '123-30-8', mw: 109.13,
    location: '201', quantity: 500, unit: 'g',
    supplier: 'Sigma-Aldrich', productNumber: 'A3861',
    cabinetId: 'cab_001', registeredBy: 'user_002',
    isActive: true, createdAt: new Date('2025-09-01'), updatedAt: new Date('2026-01-30'),
  },
  {
    id: 'rgn_007', pinCode: 'K01931',
    compoundName: '4-Chloronitrobenzene',
    alias: 'p-Nitrochlorobenzene',
    casNumber: '100-00-5',
    location: '위험물-3', quantity: 250, unit: 'g',
    supplier: 'TCI',
    cabinetId: 'cab_001', registeredBy: 'user_001',
    isActive: true, createdAt: new Date('2025-08-10'), updatedAt: new Date('2025-11-22'),
  },
  {
    id: 'rgn_008', pinCode: 'K01930',
    compoundName: 'Sodium Hydride',
    alias: '60% in mineral oil',
    casNumber: '7646-69-7',
    location: '냉장-1', quantity: 100, unit: 'g',
    supplier: 'Alfa Aesar',
    cabinetId: 'cab_001', registeredBy: 'user_002',
    isActive: true, createdAt: new Date('2025-07-20'), updatedAt: new Date('2026-02-01'),
  },
  {
    id: 'rgn_009', pinCode: 'K01929',
    compoundName: 'Triethylamine',
    alias: 'TEA',
    casNumber: '121-44-8',
    location: '102', quantity: 500, unit: 'mL',
    supplier: 'Sigma-Aldrich',
    cabinetId: 'cab_001', registeredBy: 'user_001',
    isActive: true, createdAt: new Date('2025-06-15'), updatedAt: new Date('2026-03-01'),
  },
];

// ── 최근 검색 ─────────────────────────────────────────────────
export const MOCK_RECENT_SEARCHES: RecentSearch[] = [
  { keyword: 'Potassium bis', searchedAt: new Date(Date.now() - 2 * 60_000) },
  { keyword: '82657-32-7',    searchedAt: new Date(Date.now() - 14 * 60_000) },
  { keyword: 'dihydroquinolin', searchedAt: new Date(Date.now() - 3_600_000) },
  { keyword: 'KHMDS',         searchedAt: new Date(Date.now() - 86_400_000) },
];

// ── 최근 사용자 (모달 미리보기용) ─────────────────────────────
export const MOCK_RECENT_USERS: RecentUser[] = [
  {
    userId: 'user_001', name: 'yujin Jo', initials: 'YJ',
    avatarColor: '#E6F1FB', textColor: '#185FA5',
    actionType: 'edit_quantity', actionLabel: '용량 수정 · 5g→0g',
    actionAt: new Date(Date.now() - 2 * 86_400_000),
  },
  {
    userId: 'user_002', name: 'sujin Lee', initials: 'SL',
    avatarColor: '#EAF3DE', textColor: '#3B6D11',
    actionType: 'view', actionLabel: '시약 조회',
    actionAt: new Date(Date.now() - 3 * 86_400_000),
  },
  {
    userId: 'user_003', name: 'kyung Park', initials: 'KP',
    avatarColor: '#FAEEDA', textColor: '#854F0B',
    actionType: 'send_to_note', actionLabel: '노트로 넘김',
    actionAt: new Date(Date.now() - 7 * 86_400_000),
  },
];
