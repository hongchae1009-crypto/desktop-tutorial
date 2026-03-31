import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

interface ScannedReagent {
  pinCode: string;
  name: string;
  cas: string;
  loc: string;
}

interface Props {
  onClose: () => void;
  onResult: (pinCode: string) => void;
}

export default function QrScanModal({ onClose, onResult }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const [error, setError] = useState('');
  const [found, setFound] = useState<ScannedReagent | null>(null);

  useEffect(() => {
    startCamera();
    return stopCamera;
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      video.play();
      video.onloadedmetadata = () => scan();
    } catch {
      setError('카메라에 접근할 수 없습니다.\n권한을 허용하거나 다른 브라우저를 사용해 주세요.');
    }
  }

  function stopCamera() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function scan() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scan);
      return;
    }
    const { videoWidth: w, videoHeight: h } = video;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });
    if (code) {
      try {
        const data = JSON.parse(code.data) as Record<string, string>;
        if (data.app === 'jinunote' && data.type === 'reagent' && data.pinCode) {
          stopCamera();
          setFound({ pinCode: data.pinCode, name: data.name ?? '', cas: data.cas ?? '', loc: data.loc ?? '' });
          return;
        }
      } catch {
        // not a jinunote QR, keep scanning
      }
    }
    rafRef.current = requestAnimationFrame(scan);
  }

  function handleConfirm() {
    if (found) {
      onResult(found.pinCode);
      onClose();
    }
  }

  function handleRetry() {
    setFound(null);
    setError('');
    startCamera();
  }

  return (
    <div
      className="confirm-toast"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="confirm-box" style={{ width: 340, padding: 0, overflow: 'hidden' }}>
        {/* 헤더 */}
        <div style={{
          padding: '14px 16px 12px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>📷 QR 코드 스캔</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--hint)', lineHeight: 1 }}
          >×</button>
        </div>

        {/* 카메라 영역 */}
        {!found && !error && (
          <>
            <div style={{ position: 'relative', background: '#000', lineHeight: 0 }}>
              <video
                ref={videoRef}
                style={{ width: '100%', display: 'block', maxHeight: 260, objectFit: 'cover' }}
                playsInline
                muted
              />
              {/* 스캔 가이드 */}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <div style={{
                  width: 160, height: 160,
                  border: '2px solid rgba(255,255,255,0.85)',
                  borderRadius: 10,
                  boxShadow: '0 0 0 2000px rgba(0,0,0,0.45)',
                }}>
                  {/* 모서리 강조 */}
                  {[
                    { top: -2, left: -2, borderTop: '3px solid #60a5fa', borderLeft: '3px solid #60a5fa', borderRadius: '8px 0 0 0' },
                    { top: -2, right: -2, borderTop: '3px solid #60a5fa', borderRight: '3px solid #60a5fa', borderRadius: '0 8px 0 0' },
                    { bottom: -2, left: -2, borderBottom: '3px solid #60a5fa', borderLeft: '3px solid #60a5fa', borderRadius: '0 0 0 8px' },
                    { bottom: -2, right: -2, borderBottom: '3px solid #60a5fa', borderRight: '3px solid #60a5fa', borderRadius: '0 0 8px 0' },
                  ].map((s, i) => (
                    <div key={i} style={{ position: 'absolute', width: 20, height: 20, ...s }} />
                  ))}
                </div>
              </div>
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            <div style={{ padding: '10px 16px', fontSize: 11, color: 'var(--hint)', textAlign: 'center' }}>
              QR 코드를 사각형 안에 맞춰주세요
            </div>
          </>
        )}

        {/* 에러 */}
        {error && (
          <div style={{ padding: '24px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📵</div>
            <div style={{ fontSize: 12, color: '#dc2626', lineHeight: 1.6, whiteSpace: 'pre-line', marginBottom: 16 }}>
              {error}
            </div>
            <button className="btn" onClick={onClose}>닫기</button>
          </div>
        )}

        {/* 스캔 성공 */}
        {found && (
          <div style={{ padding: '24px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{found.name}</div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--hint)', marginBottom: 4 }}>{found.pinCode}</div>
            {found.cas && (
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>CAS {found.cas}</div>
            )}
            {found.loc && (
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 20 }}>📍 {found.loc}</div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={handleConfirm}>시약 조회하기</button>
              <button className="btn" onClick={handleRetry}>다시 스캔</button>
            </div>
          </div>
        )}

        {/* 하단 버튼 (스캔 중) */}
        {!found && !error && (
          <div style={{ padding: '0 16px 14px', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn" onClick={onClose}>취소</button>
          </div>
        )}
      </div>
    </div>
  );
}
