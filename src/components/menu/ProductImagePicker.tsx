import { useState, useEffect, useRef } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { validateImageFile } from '../../lib/storage';

interface ProductImagePickerProps {
  existingUrl: string | null;
  onChange: (result: { file: File | null; removed: boolean }) => void;
}

/**
 * Self-contained photo picker for the product form. Owns its own local
 * file/preview state and naturally resets whenever the form remounts it
 * (the form unmounts this on close, so no reset-on-prop-change needed).
 */
export function ProductImagePicker({ existingUrl, onChange }: ProductImagePickerProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  const handlePick = (file: File | undefined) => {
    if (!file) return;
    const invalidReason = validateImageFile(file);
    if (invalidReason) { setError(invalidReason); return; }
    setError(null);
    setRemoved(false);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    onChange({ file, removed: false });
  };

  const handleRemove = () => {
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onChange({ file: null, removed: true });
  };

  const displayedImage = preview ?? (!removed ? existingUrl : '');

  return (
    <div className="space-y-1.5">
      <label className="text-slate-600 text-xs font-medium">Foto Menu</label>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handlePick(e.target.files?.[0])}
      />
      {displayedImage ? (
        <div className="relative">
          <img
            src={displayedImage}
            alt="preview"
            className="h-36 w-full object-cover rounded-xl border border-slate-200"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <div className="absolute inset-0 flex items-end justify-end gap-2 p-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-medium hover:bg-black/70 transition-all active:scale-95"
            >
              Ganti Foto
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white hover:bg-red-500/80 transition-all active:scale-95"
              title="Hapus foto"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-28 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-500/5 transition-all"
        >
          <ImagePlus size={22} />
          <span className="text-xs font-medium">Pilih foto dari galeri / kamera</span>
        </button>
      )}
      <p className="text-slate-400 text-xs mt-1">JPG, PNG, WEBP, atau GIF — maksimal 2MB</p>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
