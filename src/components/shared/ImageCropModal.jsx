import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Check, Maximize2, Minimize2, RotateCcw } from 'lucide-react';

const COVER_ASPECT_RATIO = 2.5; // Shared aspect ratio 5:2

export default function ImageCropModal({ 
  imageSrc, 
  aspectRatio = COVER_ASPECT_RATIO, 
  onConfirm, 
  onCancel,
  initialZoom = 1,
  initialCrop = { x: 0, y: 0 },
  initialMode = 'fill',
  initialCroppedAreaPixels = null
}) {
  const [crop, setCrop] = useState(initialCrop);
  const [zoom, setZoom] = useState(initialZoom);
  const [mode, setMode] = useState(initialMode); // 'fill' or 'fit'
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(initialCroppedAreaPixels);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onCropComplete = useCallback((croppedArea, croppedAreaPx) => {
    setCroppedAreaPixels(croppedAreaPx);
  }, []);

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setMode('fill');
    setCroppedAreaPixels(null);
  };

  const handleZoomChange = (value) => {
    setZoom(Math.max(1, Math.min(3, value)));
  };

  const handleSave = async () => {
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Falha ao carregar imagem no canvas para edição.'));
      });

      // Target resolution: 1920 width, keeping standard COVER_ASPECT_RATIO
      const outW = 1920;
      const outH = Math.round(outW / aspectRatio);
      canvas.width = outW;
      canvas.height = outH;

      if (mode === 'fill' && croppedAreaPixels) {
        // Draw cropped area
        ctx.drawImage(
          img,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          outW,
          outH
        );
      } else {
        // MODO 2: Mostrar imagem inteira
        // 1. Draw blurred background
        const blurCanvas = document.createElement('canvas');
        const blurCtx = blurCanvas.getContext('2d');
        blurCanvas.width = 192; // Small size for faster blur rendering
        blurCanvas.height = Math.round(blurCanvas.width / aspectRatio);
        
        blurCtx.drawImage(img, 0, 0, blurCanvas.width, blurCanvas.height);
        
        // Draw the small canvas stretched to output canvas
        ctx.save();
        ctx.filter = 'blur(20px) brightness(0.6)';
        ctx.drawImage(blurCanvas, 0, 0, outW, outH);
        ctx.restore();

        // 2. Draw semi-transparent dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, outW, outH);

        // 3. Center the original image without cropping (contain mode)
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const canvasAspect = outW / outH;

        let drawW, drawH;
        if (imgAspect > canvasAspect) {
          drawW = outW;
          drawH = outW / imgAspect;
        } else {
          drawH = outH;
          drawW = outH * imgAspect;
        }

        const drawX = (outW - drawW) / 2;
        const drawY = (outH - drawH) / 2;

        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, drawX, drawY, drawW, drawH);
      }

      // Convert to blob (WebP with high quality)
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            setError('Falha ao gerar o arquivo de imagem.');
            setLoading(false);
            return;
          }
          
          try {
            await onConfirm(blob, {
              zoom,
              crop,
              mode,
              croppedAreaPixels
            });
          } catch (err) {
            setError(err.message || 'Erro ao fazer o upload da imagem.');
            setLoading(false);
          }
        },
        'image/webp',
        0.90
      );

    } catch (err) {
      console.error(err);
      setError(err.message || 'Ocorreu um erro ao processar a imagem.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0f0a26] border border-white/10 rounded-3xl w-full max-w-[700px] overflow-hidden shadow-2xl flex flex-col max-h-[95vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-white font-black text-sm">Editor de Capa</h3>
            <p className="text-[10px] text-gray-500">Ajuste o posicionamento e o enquadramento do seu banner.</p>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/15 border-b border-red-500/30 text-red-300 px-4 py-2.5 text-center text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Crop Container */}
        <div className="relative flex-1 bg-black/40 min-h-[280px] sm:min-h-[360px] flex items-center justify-center overflow-hidden">
          {mode === 'fill' ? (
            <div className="absolute inset-0">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                showGrid={true}
                objectFit="cover"
                classes={{
                  containerClassName: 'bg-black/20',
                  cropAreaClassName: 'border-2 border-white/40 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] rounded-xl'
                }}
              />
            </div>
          ) : (
            // MODO 2: Mostrar imagem inteira preview
            <div className="relative w-full overflow-hidden" style={{ aspectRatio }}>
              {/* Blurred background copy */}
              <div 
                className="absolute inset-0 bg-cover bg-center blur-xl scale-110 brightness-[0.5]"
                style={{ backgroundImage: `url(${imageSrc})` }}
              />
              <div className="absolute inset-0 bg-black/40" />
              {/* Original image centered */}
              <img 
                src={imageSrc} 
                alt="Preview" 
                className="absolute inset-0 w-full h-full object-contain z-10"
              />
            </div>
          )}
        </div>

        {/* Controls Panel */}
        <div className="p-5 border-t border-white/5 space-y-4 bg-[#140e32]">
          {/* Zoom Slider */}
          {mode === 'fill' && (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleZoomChange(zoom - 0.1)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={e => handleZoomChange(Number(e.target.value))}
                className="flex-1 h-1.5 appearance-none rounded-full bg-white/10 cursor-pointer"
                style={{ accentColor: '#7B2EFF' }}
              />
              <button 
                onClick={() => handleZoomChange(zoom + 0.1)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] text-gray-400 font-bold min-w-[32px] text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>
          )}

          {/* Mode switch & Reset */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2 bg-black/25 p-1 rounded-xl">
              <button
                onClick={() => setMode('fill')}
                className={`py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                  mode === 'fill' 
                    ? 'bg-neon-purple text-white shadow-[0_0_10px_rgba(123,46,255,0.3)]' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Maximize2 className="w-3 h-3" />
                Preencher Capa
              </button>
              <button
                onClick={() => setMode('fit')}
                className={`py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                  mode === 'fit' 
                    ? 'bg-neon-purple text-white shadow-[0_0_10px_rgba(123,46,255,0.3)]' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Minimize2 className="w-3 h-3" />
                Mostrar Imagem Inteira
              </button>
            </div>

            <button
              onClick={handleReset}
              className="py-1.5 px-3 rounded-lg border border-white/10 hover:bg-white/5 text-[10px] font-bold text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-white text-xs font-bold hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-neon-green text-black text-xs font-bold flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(57,255,106,0.3)] transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Salvar Capa
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
