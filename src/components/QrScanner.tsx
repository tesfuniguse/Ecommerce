/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, CameraOff, Info, Sparkles } from 'lucide-react';
import jsQR from 'jsqr';

interface QrScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (code: string) => void;
  currentLang: 'en' | 'am';
}

export default function QrScanner({
  isOpen,
  onClose,
  onScanSuccess,
  currentLang,
}: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanFeedback, setScanFeedback] = useState<string>('');

  // Translations
  const t = {
    en: {
      title: 'Scan Promo QR Code',
      desc: 'Position a promotional QR code within the frame to scan and apply your discount.',
      scanning: 'Initializing camera...',
      noCamera: 'No camera found or access denied.',
      cameraBlocked: 'Camera access is blocked or not allowed. Please grant camera permissions to scan, or use a demo promo code below.',
      close: 'Close Scanner',
      demoTitle: 'Sandbox Testing & Demo Codes',
      demoDesc: 'Inside the preview environment or sandbox, camera access might be restricted. Click any promo code below to simulate a successful scan!',
      simulateBtn: 'Simulate scan of',
      copied: 'Applied!',
      activeCamera: 'Live Camera Active',
    },
    am: {
      title: 'የቅናሽ QR ኮድ ይቃኙ',
      desc: 'ቅናሽዎን ለመጠቀም የQR ኮዱን በሳጥኑ ውስጥ ያስገቡት።',
      scanning: 'ካሜራውን በማዘጋጀት ላይ...',
      noCamera: 'ካሜራ አልተገኘም ወይም አልተፈቀደም።',
      cameraBlocked: 'የካሜራ መዳረሻ ተከልክሏል። እባክዎ ካሜራውን ይፍቀዱ ወይም ከታች ያለውን የሙከራ አማራጭ ይጠቀሙ።',
      close: 'ዝጋ',
      demoTitle: 'የሙከራ እና ማሳያ ኮዶች',
      demoDesc: 'በሙከራ አካባቢ ውስጥ የካሜራ መዳረሻ ሊገደብ ስለሚችል፣ የQR ኮድ ስካነሩን ለመፈተሽ ከታች ያሉትን ኮዶች ይጫኑ!',
      simulateBtn: 'የሙከራ ስካን አድርግ',
      copied: 'ተፈጻሚ ሆኗል!',
      activeCamera: 'ካሜራው ገባሪ ነው',
    },
  }[currentLang];

  // Start/Stop Camera
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError('');
    setHasCamera(true);
    setIsScanning(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not supported on this browser/environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
        videoRef.current.play().catch(e => console.warn('Video play interrupted:', e));
      }

      // Start the decoding loop
      animationFrameRef.current = requestAnimationFrame(tick);
    } catch (err: any) {
      console.warn('Failed to open camera:', err);
      setHasCamera(false);
      setCameraError(err.message || 'PermissionDeniedError');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const tick = () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) {
      animationFrameRef.current = requestAnimationFrame(tick);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      // Scale canvas to match video source
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to hidden canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Extract image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Perform decoding using jsQR safely
      try {
        const qrDecoder = (jsQR as any).default || jsQR;
        const code = qrDecoder(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          // Success scan feedback!
          const scannedText = code.data.trim();
          handleScannedCode(scannedText);
          return; // Stop the loop immediately on success
        }
      } catch (decodeErr) {
        // Silent error
      }
    }

    // Keep loop going
    animationFrameRef.current = requestAnimationFrame(tick);
  };

  const handleScannedCode = (code: string) => {
    setScanFeedback(code);
    stopCamera();
    
    // Quick notification / visual flash
    setTimeout(() => {
      onScanSuccess(code);
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-md">
      {/* Outer Card */}
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-stone-800/80 flex items-center justify-between bg-stone-900/60 backdrop-blur">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <h3 className="font-sans font-bold text-sm text-stone-100 uppercase tracking-wider">{t.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 flex-grow overflow-y-auto space-y-6">
          <p className="text-xs text-stone-400 text-center leading-relaxed max-w-sm mx-auto">
            {t.desc}
          </p>

          {/* Camera Frame Viewport */}
          <div className="relative w-full aspect-video bg-stone-950 rounded-lg overflow-hidden border border-stone-850 flex items-center justify-center">
            
            {hasCamera && !cameraError ? (
              <>
                {/* Live video */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                
                {/* Hidden canvas for extraction */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Laser Overlay mask and HUD */}
                <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
                  {/* Camera Active Badge */}
                  <div className="self-start bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1">
                    <Camera className="w-3 h-3 animate-pulse" />
                    <span>{t.activeCamera}</span>
                  </div>

                  {/* Golden Scanning Reticle */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-44 h-44 border border-amber-500/30 rounded-lg flex items-center justify-center">
                      
                      {/* Target frame corners */}
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-500 rounded-tl"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-500 rounded-tr"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-500 rounded-bl"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-500 rounded-br"></div>

                      {/* Laser scanning line */}
                      <div className="absolute left-1 right-1 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_8px_#f59e0b] animate-[bounce_2s_infinite]"></div>
                    </div>
                  </div>

                  {/* Scan success flash screen */}
                  {scanFeedback && (
                    <div className="absolute inset-0 bg-amber-600/20 backdrop-blur-xs flex items-center justify-center transition-all">
                      <div className="bg-stone-900 border border-amber-500 px-4 py-2.5 rounded-lg text-center animate-bounce shadow-xl">
                        <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">QR Scanned</p>
                        <p className="text-sm font-bold text-amber-500 mt-0.5">{scanFeedback}</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* No Camera state / permission block */
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-red-950/40 border border-red-900/30 rounded-full flex items-center justify-center text-red-400 mx-auto">
                  <CameraOff className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-stone-200">{t.noCamera}</p>
                <p className="text-[11px] text-stone-400 max-w-xs mx-auto leading-relaxed">
                  {t.cameraBlocked}
                </p>
              </div>
            )}
          </div>

          {/* Sandbox Mock Options for testing */}
          <div className="bg-stone-950 border border-stone-850/60 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-sans font-bold text-stone-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.demoTitle}</span>
            </h4>
            <p className="text-[10px] text-stone-500 leading-relaxed">
              {t.demoDesc}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Mock Promo Code ADDISNEW */}
              <button
                onClick={() => handleScannedCode('ADDISNEW')}
                className="p-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/30 rounded-lg text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-200 group-hover:text-amber-400 font-mono">ADDISNEW</span>
                  <span className="bg-amber-600/10 text-amber-500 text-[9px] font-bold px-1 py-0.5 rounded">15% OFF</span>
                </div>
                <p className="text-[9px] text-stone-500 mt-1">
                  {currentLang === 'en' ? 'Click to simulate scan' : 'ለመፈተሽ ይህንን ይጫኑ'}
                </p>
              </button>

              {/* Mock Promo Code GENUINE10 */}
              <button
                onClick={() => handleScannedCode('GENUINE10')}
                className="p-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/30 rounded-lg text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-200 group-hover:text-amber-400 font-mono">GENUINE10</span>
                  <span className="bg-amber-600/10 text-amber-500 text-[9px] font-bold px-1 py-0.5 rounded">10% OFF</span>
                </div>
                <p className="text-[9px] text-stone-500 mt-1">
                  {currentLang === 'en' ? 'Click to simulate scan' : 'ለመፈተሽ ይህንን ይጫኑ'}
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold rounded transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
