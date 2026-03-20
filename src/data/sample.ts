import type { MoaCard } from '../types/moa'

export const SAMPLE_FOLDERS = [
  { name: '전체' },
  { name: '2026 Piperazine' },
  { name: '2026 Amide' },
  { name: '2025 Scaffold' },
]

export const SAMPLE_CARDS: MoaCard[] = [
  {
    id: 'MB-PRI-HCE-2026-00001',
    title: 'HCE-260309',
    project: '2026 Piperazine',
    status: 'active',
    expCount: 3,
    bestYield: 72,
    yieldHistory: [
      { id: 'HCE-1', yield: 72 },
      { id: 'HCE-2', yield: 62 },
      { id: 'HCE-3', yield: null },
    ],
    author: '제은',
    createdAt: '2026-03-09',
  },
  {
    id: 'MB-PRI-HCE-2026-00002',
    title: 'HCE-260215 Reductive amination',
    project: '2026 Piperazine',
    status: 'active',
    expCount: 5,
    bestYield: null,
    yieldHistory: [
      { id: 'HCE-1', yield: null },
      { id: 'HCE-2', yield: null },
    ],
    author: '제은',
    createdAt: '2026-03-01',
  },
  {
    id: 'MB-PRI-HCE-2026-00003',
    title: 'HCE-260215 Amide coupling',
    project: '2026 Amide',
    status: 'done',
    expCount: 6,
    bestYield: 89,
    yieldHistory: [
      { id: 'HCE-1', yield: 89 },
      { id: 'HCE-2', yield: 75 },
      { id: 'HCE-3', yield: 68 },
    ],
    author: '제은',
    createdAt: '2026-02-15',
  },
  {
    id: 'MB-PRI-HCE-2025-00012',
    title: 'HCE-251120 Scaffold',
    project: '2025 Scaffold',
    status: 'done',
    expCount: 4,
    bestYield: 55,
    yieldHistory: [
      { id: 'HCE-1', yield: 55 },
      { id: 'HCE-2', yield: 48 },
    ],
    author: '제은',
    createdAt: '2025-11-20',
  },
]

export const SAMPLE_REAGENTS = [
  { name: '1-Bromo-2-fluorobenzene',                   pin: 'K01251', mw: 175    },
  { name: '1-Bromo-2,4-dimethoxybenzene',              pin: 'K01275', mw: 217.06 },
  { name: '1-Bromo-2-(trifluoromethoxy)benzene',       pin: 'K01230', mw: 241.01 },
  { name: 'Piperazine',                                pin: 'K00504', mw: 86.14  },
  { name: 'Ruphos',                                    pin: 'K00595', mw: 466.6  },
  { name: 'Sodium tert-butoxide',                      pin: 'K00622', mw: 96.1   },
  { name: 'Tris(dibenzylideneacetone)dipalladium(0)', pin: 'K01055', mw: 915.7  },
  { name: '2-Bromopyridine',                           pin: 'K02011', mw: 158    },
  { name: '4-Bromoanisole',                            pin: 'K02088', mw: 187.04 },
]
