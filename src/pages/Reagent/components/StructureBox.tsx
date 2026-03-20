/** 구조식 영역 — SMILES 미지원 시 회색 박스 폴백 (NFR-03) */
interface StructureBoxProps {
  smiles?: string;
  width?: number | string;
  height?: number | string;
  /** 'card' | 'table' | 'modal' | 'basket' */
  variant?: 'card' | 'table' | 'modal' | 'basket';
}

const HEIGHTS: Record<NonNullable<StructureBoxProps['variant']>, string> = {
  card:   '108px',
  table:  '38px',
  modal:  '160px',
  basket: '58px',
};

const WIDTHS: Record<NonNullable<StructureBoxProps['variant']>, string> = {
  card:   '88px',
  table:  '56px',
  modal:  '100%',
  basket: '100%',
};

export default function StructureBox({
  smiles,
  width,
  height,
  variant = 'card',
}: StructureBoxProps) {
  const w = width  ?? WIDTHS[variant];
  const h = height ?? HEIGHTS[variant];

  const style: React.CSSProperties = {
    width: w,
    height: h,
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: variant === 'table' ? '4px' : undefined,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    flexDirection: 'column',
    gap: '4px',
  };

  if (smiles) {
    // TODO: RDKit.js / Ketcher 렌더링 연동 (Open Issue #1)
    // 현재는 SMILES 텍스트 존재 시 폴백과 동일하게 표시
    return (
      <div style={style} title={smiles}>
        <span style={{ fontSize: variant === 'table' ? '9px' : '10px', color: 'var(--hint)' }}>
          구조식
        </span>
      </div>
    );
  }

  return (
    <div style={style}>
      <span style={{ fontSize: variant === 'table' ? '9px' : '10px', color: 'var(--hint)' }}>
        구조식
      </span>
    </div>
  );
}
