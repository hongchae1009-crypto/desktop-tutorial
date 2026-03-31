import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import type { ReagentItem } from '@/types/reagent';

interface Props {
  reagent: ReagentItem;
  onClose: () => void;
}

export default function QrModal({ reagent, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const qrData = JSON.stringify({
    app: 'jinunote',
    type: 'reagent',
    pinCode: reagent.pinCode,
    name: reagent.compoundName,
    cas: reagent.casNumber ?? '',
    loc: reagent.location,
  });

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, qrData, {
      width: 200,
      margin: 2,
      color: { dark: '#111827', light: '#ffffff' },
    });
  }, [qrData]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `QR_${reagent.pinCode}_${reagent.compoundName.replace(/\s+/g, '_')}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handlePrint = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR - ${reagent.pinCode}</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: sans-serif; }
            .wrap { text-align: center; padding: 20px; }
            img { display: block; width: 160px; height: 160px; margin: 0 auto 8px; }
            .pin { font-family: monospace; font-size: 13px; color: #444; margin-bottom: 4px; }
            .name { font-size: 14px; font-weight: 600; color: #111; }
            .loc { font-size: 11px; color: #888; margin-top: 4px; }
          </style>
        </head>
        <body>
          <div class="wrap">
            <img src="${dataUrl}" />
            <div class="pin">${reagent.pinCode}</div>
            <div class="name">${reagent.compoundName}</div>
            ${reagent.location ? `<div class="loc">📍 ${reagent.location}</div>` : ''}
          </div>
          <script>window.onload = () => { window.print(); }<\/script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div
      className="confirm-toast"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="confirm-box" style={{ width: 280, textAlign: 'center' }}>
        {/* 헤더 */}
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
          {reagent.compoundName}
        </div>
        <div style={{ fontSize: 10, color: 'var(--hint)', fontFamily: 'monospace', marginBottom: 16 }}>
          {reagent.pinCode}
        </div>

        {/* QR Canvas */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <canvas
            ref={canvasRef}
            style={{ borderRadius: 8, border: '1px solid var(--border)' }}
          />
        </div>

        {/* 위치 */}
        {reagent.location && (
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>
            📍 {reagent.location}
          </div>
        )}

        {/* 안내 */}
        <div style={{
          fontSize: 10, color: 'var(--hint)', marginBottom: 16,
          padding: '6px 10px', background: 'var(--surface2)', borderRadius: 6,
          lineHeight: 1.6,
        }}>
          이 QR 코드를 시약병에 부착하면<br />
          모바일로 스캔하여 바로 조회할 수 있습니다
        </div>

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" style={{ flex: 1 }} onClick={handleDownload}>⬇ 다운로드</button>
          <button className="btn" style={{ flex: 1 }} onClick={handlePrint}>🖨 인쇄</button>
          <button className="btn" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}
