import { useEffect, useRef } from 'react';
import SmilesDrawer from 'smiles-drawer';

interface StructureBoxProps {
  smiles?: string;
  width?: number | string;
  height?: number | string;
  /** 'card' | 'table' | 'modal' | 'basket' */
  variant?: 'card' | 'table' | 'modal' | 'basket';
}

const HEIGHTS: Record<NonNullable<StructureBoxProps['variant']>, string> = {
  card:   '120px',
  table:  '38px',
  modal:  '160px',
  basket: '58px',
};

const WIDTHS: Record<NonNullable<StructureBoxProps['variant']>, string> = {
  card:   '110px',
  table:  '56px',
  modal:  '100%',
  basket: '100%',
};

const DRAW_SIZES: Record<NonNullable<StructureBoxProps['variant']>, { w: number; h: number }> = {
  card:   { w: 110, h: 120 },
  table:  { w: 56,  h: 38  },
  modal:  { w: 280, h: 160 },
  basket: { w: 180, h: 58  },
};

export default function StructureBox({
  smiles,
  width,
  height,
  variant = 'card',
}: StructureBoxProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const w = width  ?? WIDTHS[variant];
  const h = height ?? HEIGHTS[variant];
  const drawSize = DRAW_SIZES[variant];

  useEffect(() => {
    if (!smiles || !canvasRef.current) return;

    const drawer = new SmilesDrawer.Drawer({
      width: drawSize.w,
      height: drawSize.h,
      bondThickness: variant === 'table' ? 0.6 : 0.8,
      shortBondWidth: variant === 'table' ? 0.5 : 0.8,
      bondSpacing: variant === 'table' ? 4 : 5,
      atomVisualization: 'default',
      isomeric: true,
      fontSizeLarge: variant === 'table' ? 4 : 6,
      fontSizeSmall: variant === 'table' ? 3 : 4,
    });

    SmilesDrawer.parse(
      smiles,
      (tree: unknown) => {
        if (canvasRef.current) {
          drawer.draw(tree, canvasRef.current, 'light', false);
        }
      },
      () => {
        // 파싱 오류 시 폴백 텍스트 유지
      },
    );
  }, [smiles, variant, drawSize.w, drawSize.h]);

  const containerStyle: React.CSSProperties = {
    width: w,
    height: h,
    background: smiles ? '#fff' : 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: variant === 'table' ? '4px' : undefined,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    flexDirection: 'column',
    gap: '4px',
    overflow: 'hidden',
  };

  if (smiles) {
    return (
      <div style={containerStyle} title={smiles}>
        <canvas
          ref={canvasRef}
          width={drawSize.w}
          height={drawSize.h}
          style={{ maxWidth: '100%', maxHeight: '100%' }}
        />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <span style={{ fontSize: variant === 'table' ? '9px' : '10px', color: 'var(--hint)' }}>
        구조식
      </span>
    </div>
  );
}
