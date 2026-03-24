import { useRef, useEffect, useState, useCallback } from 'react';

type Tool = 'pen' | 'eraser';
type PenSize = 'thin' | 'medium' | 'thick';

const PEN_SIZES: Record<PenSize, number> = { thin: 1.5, medium: 3, thick: 7 };

const COLORS = [
  { value: '#1a1c21', label: '검정' },
  { value: '#185FA5', label: '파랑' },
  { value: '#C0392B', label: '빨강' },
  { value: '#0F6E56', label: '초록' },
  { value: '#7B4A00', label: '갈색' },
];

interface Props {
  value?: string;
  onChange: (dataUrl: string) => void;
}

export default function SchemeCanvas({ value, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const hasContent = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#1a1c21');
  const [penSize, setPenSize] = useState<PenSize>('thin');
  const [isEmpty, setIsEmpty] = useState(!value);

  // 캔버스 초기화: 흰 배경 + 도트 그리드
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    // 실제 픽셀 해상도 = 컨테이너 너비 × devicePixelRatio
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // 흰 배경
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);

    // 점선 그리드 (20px 간격)
    ctx.fillStyle = '#dde0e8';
    for (let x = 20; x < w; x += 20) {
      for (let y = 20; y < h; y += 20) {
        ctx.beginPath();
        ctx.arc(x, y, 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, []);

  // 저장된 이미지 복원
  const loadImage = useCallback((src: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.drawImage(img, 0, 0, w, h);
    };
    img.src = src;
  }, []);

  useEffect(() => {
    initCanvas();
    if (value) {
      loadImage(value);
      hasContent.current = true;
      setIsEmpty(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 디스플레이 좌표 → 캔버스 좌표 변환
  function getPos(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * (canvas.width / dpr / rect.width),
      y: (clientY - rect.top) * (canvas.height / dpr / rect.height),
    };
  }

  function startDraw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    isDrawing.current = true;
    lastPos.current = getPos(e);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    if (!isDrawing.current || !lastPos.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 24;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = PEN_SIZES[penSize];
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPos.current = pos;
    hasContent.current = true;
    setIsEmpty(false);
  }

  function endDraw() {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    lastPos.current = null;
    // 저장
    const canvas = canvasRef.current!;
    onChange(canvas.toDataURL('image/png'));
  }

  function handleClear() {
    initCanvas();
    hasContent.current = false;
    setIsEmpty(true);
    onChange('');
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      initCanvas(); // 배경 리셋 후 이미지 그리기
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      img.onload = () => {
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        // 비율 유지하며 캔버스에 맞게
        const scale = Math.min(w / img.width, h / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const ox = (w - drawW) / 2;
        const oy = (h - drawH) / 2;
        ctx.drawImage(img, ox, oy, drawW, drawH);
        hasContent.current = true;
        setIsEmpty(false);
        onChange(canvas.toDataURL('image/png'));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* 툴바 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
        padding: '6px 10px', background: 'var(--bg2)',
        borderRadius: '8px', border: '1px solid var(--bd)',
      }}>
        {/* 펜 / 지우개 */}
        <div style={{ display: 'flex', gap: 3 }}>
          {([
            { id: 'pen' as Tool, icon: '✏️', label: '펜' },
            { id: 'eraser' as Tool, icon: '⬜', label: '지우개' },
          ]).map(({ id, icon, label }) => (
            <button
              key={id}
              onClick={() => setTool(id)}
              title={label}
              style={{
                padding: '4px 9px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                border: `1px solid ${tool === id ? 'var(--blue)' : 'var(--bd)'}`,
                background: tool === id ? 'var(--blue-bg)' : 'transparent',
                color: tool === id ? 'var(--blue)' : 'var(--tx3)',
                fontWeight: tool === id ? 600 : 400,
                display: 'flex', alignItems: 'center', gap: 3,
              }}
            >
              <span style={{ fontSize: 12 }}>{icon}</span> {label}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 18, background: 'var(--bd)', flexShrink: 0 }} />

        {/* 색상 */}
        {tool === 'pen' && (
          <>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  title={c.label}
                  style={{
                    width: 18, height: 18, borderRadius: '50%', cursor: 'pointer',
                    background: c.value, border: `2px solid ${color === c.value ? '#fff' : c.value}`,
                    outline: color === c.value ? `2px solid ${c.value}` : 'none',
                    padding: 0, flexShrink: 0,
                  }}
                />
              ))}
            </div>

            <div style={{ width: 1, height: 18, background: 'var(--bd)', flexShrink: 0 }} />

            {/* 굵기 */}
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'var(--tx3)', marginRight: 2 }}>굵기</span>
              {(['thin', 'medium', 'thick'] as PenSize[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setPenSize(s)}
                  title={s}
                  style={{
                    width: 28, height: 22, borderRadius: 5, cursor: 'pointer',
                    border: `1px solid ${penSize === s ? 'var(--blue)' : 'var(--bd)'}`,
                    background: penSize === s ? 'var(--blue-bg)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  <div style={{
                    width: 14, height: PEN_SIZES[s], borderRadius: 9,
                    background: penSize === s ? 'var(--blue)' : 'var(--tx3)',
                  }} />
                </button>
              ))}
            </div>

            <div style={{ width: 1, height: 18, background: 'var(--bd)', flexShrink: 0 }} />
          </>
        )}

        {/* 이미지 업로드 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
            border: '1px solid var(--bd)', background: 'transparent', color: 'var(--tx3)',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <span>🖼</span> 이미지 업로드
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />

        {/* 전체 지우기 */}
        <button
          onClick={handleClear}
          style={{
            marginLeft: 'auto', padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
            border: '1px solid var(--bd)', background: 'transparent', color: '#C0392B',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          🗑 전체 지우기
        </button>
      </div>

      {/* 캔버스 */}
      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--bd)' }}>
        <canvas
          ref={canvasRef}
          style={{
            display: 'block', width: '100%', height: 300,
            cursor: tool === 'eraser' ? 'cell' : 'crosshair',
            touchAction: 'none',
          }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {/* 빈 상태 힌트 */}
        {isEmpty && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{ textAlign: 'center', color: 'var(--tx3)', opacity: 0.5 }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>⚗️</div>
              <div style={{ fontSize: 12 }}>반응 스킴을 그리거나 이미지를 업로드하세요</div>
              <div style={{ fontSize: 10, marginTop: 4 }}>ChemDraw, MarvinSketch 등에서 내보낸 이미지도 지원됩니다</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
