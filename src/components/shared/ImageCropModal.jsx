import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Check } from 'lucide-react';

/**
 * ImageCropModal — recorte de imagem com drag + zoom real, sem deps externas.
 *
 * A imagem é renderizada com object-fit: cover dentro do container de crop.
 * O zoom aumenta o tamanho da imagem (escala real) e o drag reposiciona.
 *
 * Props:
 *   imageSrc     – URL/data-URI da imagem selecionada
 *   aspectRatio  – proporção do crop (ex: 1 para avatar, 16/9 para cover). null = livre
 *   onConfirm    – (croppedBlob: Blob) => void
 *   onCancel     – () => void
 */
export default function ImageCropModal({ imageSrc, aspectRatio = 1, onConfirm, onCancel }) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });

  // Container responsivo — usa 90vw com max de 400px
  const [containerW, setContainerW] = useState(320);
  const containerH = aspectRatio ? containerW / aspectRatio : containerW;

  useEffect(() => {
    const updateSize = () => {
      const w = Math.min(window.innerWidth - 48, 400);
      setContainerW(w);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Quando a imagem carrega, guarda dimensões naturais
  const handleImageLoad = useCallback((e) => {
    const { naturalWidth: nw, naturalHeight: nh } = e.target;
    setNaturalSize({ w: nw, h: nh });
    setOffset({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  // Calcula o tamanho da imagem para PREENCHER o container (estilo object-fit: cover)
  // A imagem é dimensionada para cobrir todo o container, depois o zoom escala isso
  const getBaseImageSize = useCallback(() => {
    if (!naturalSize.w || !naturalSize.h) return { w: containerW, h: containerH };
    const imgAspect = naturalSize.w / naturalSize.h;
    const containerAspect = containerW / containerH;

    let baseW, baseH;
    if (imgAspect > containerAspect) {
      // Imagem mais larga que o container → altura preenche
      baseH = containerH;
      baseW = baseH * imgAspect;
    } else {
      // Imagem mais alta que o container → largura preenche
      baseW = containerW;
      baseH = baseW / imgAspect;
    }
    return { w: baseW, h: baseH };
  }, [naturalSize, containerW, containerH]);

  const baseSize = getBaseImageSize();
  const scaledW = baseSize.w * zoom;
  const scaledH = baseSize.h * zoom;

  // Limites de arrasto — a imagem nunca pode ser menor que o container
  const clampOffset = useCallback((ox, oy) => {
    // Se a imagem escalada é menor que o container (não deveria acontecer com zoom >= 1),
    // centraliza. Caso contrário, limita para não mostrar além da borda.
    const minX = scaledW <= containerW ? (containerW - scaledW) / 2 : containerW - scaledW;
    const maxX = scaledW <= containerW ? (containerW - scaledW) / 2 : 0;
    const minY = scaledH <= containerH ? (containerH - scaledH) / 2 : containerH - scaledH;
    const maxY = scaledH <= containerH ? (containerH - scaledH) / 2 : 0;
    return {
      x: Math.max(minX, Math.min(maxX, ox)),
      y: Math.max(minY, Math.min(maxY, oy)),
    };
  }, [scaledW, scaledH, containerW, containerH]);

  // Drag handlers
  const handlePointerDown = (e) => {
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };

  const handlePointerMove = useCallback((e) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const newOx = dragStart.current.ox + dx;
    const newOy = dragStart.current.oy + dy;
    setOffset(clampOffset(newOx, newOy));
  }, [dragging, clampOffset]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const handleZoomChange = (newZoom) => {
    setZoom(newZoom);
    setOffset(prev => clampOffset(prev.x, prev.y));
  };

  // Gera o blob recortado usando canvas
  const handleConfirm = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Tamanho de saída: usa resolução boa para qualidade
    const outW = 1200;
    const outH = aspectRatio ? outW / aspectRatio : outW;
    canvas.width = outW;
    canvas.height = outH;

    const img = imgRef.current;
    if (!img) return;

    // Calcula a porção visível da imagem em coordenadas naturais
    // A imagem está posicionada com offset e escalada por zoom
    // A parte visível no container corresponde a:
    const sx = (-offset.x / scaledW) * naturalSize.w;
    const sy = (-offset.y / scaledH) * naturalSize.h;
    const sw = (containerW / scaledW) * naturalSize.w;
    const sh = (containerH / scaledH) * naturalSize.h;

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

    canvas.toBlob((blob) => {
      if (blob) onConfirm(blob);
    }, 'image/jpeg', 0.92);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="crop-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
      />
      <motion.div
        key="crop-modal"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-[210] flex items-center justify-center p-4"
      >
        <div className="bg-[#1a1030] rounded-2xl border border-white/10 p-5 w-full max-w-[440px] space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-sm">Recortar Imagem</h3>
            <button onClick={onCancel} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Crop area */}
          <div
            ref={containerRef}
            className="relative overflow-hidden rounded-xl mx-auto"
            style={{
              width: containerW,
              height: containerH,
              cursor: dragging ? 'grabbing' : 'grab',
              touchAction: 'none',
              backgroundColor: '#000',
            }}
            onPointerDown={handlePointerDown}
          >
            {/* Imagem — usa object-fit: cover para preencher, depois escala com zoom */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop"
              crossOrigin="anonymous"
              onLoad={handleImageLoad}
              draggable={false}
              className="absolute select-none pointer-events-none"
              style={{
                width: scaledW,
                height: scaledH,
                left: offset.x,
                top: offset.y,
                objectFit: 'cover',
              }}
            />
            {/* Overlay de crop */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 border-2 border-white/40 rounded-xl" />
              {/* Grid de regra dos terços */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="border border-white/15" />
                ))}
              </div>
            </div>
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-3 px-2">
            <ZoomOut className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="range"
              min="1"
              max="5"
              step="0.05"
              value={zoom}
              onChange={e => handleZoomChange(Number(e.target.value))}
              className="flex-1 h-1 appearance-none rounded-full bg-white/20 cursor-pointer"
              style={{ accentColor: '#7B2EFF' }}
            />
            <ZoomIn className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </div>

          {/* Dica */}
          <p className="text-center text-[10px] text-gray-500">Arraste para posicionar · Use o slider para dar zoom</p>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-white text-xs font-bold hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-2.5 rounded-xl bg-neon-purple text-white text-xs font-bold flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(123,46,255,0.3)] transition-all"
            >
              <Check className="w-4 h-4" />
              Confirmar
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
