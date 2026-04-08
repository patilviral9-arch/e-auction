import { useState, useCallback } from "react";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "./auctionConstants";

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useImageUploader(initial = []) {
  const [images, setImages] = useState(initial);

  const uploadToCloudinary = useCallback(async (file, id) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setImages(prev => prev.map(img => img.id === id ? { ...img, progress: pct } : img));
        }
      };
      const result = await new Promise((resolve, reject) => {
        xhr.onload = () => xhr.status === 200
          ? resolve(JSON.parse(xhr.responseText))
          : reject(new Error("Upload failed"));
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(data);
      });
      setImages(prev => prev.map(img =>
        img.id === id
          ? { ...img, url: result.secure_url, public_id: result.public_id, uploading: false, progress: 100 }
          : img
      ));
    } catch (err) {
      setImages(prev => prev.map(img =>
        img.id === id ? { ...img, uploading: false, error: err.message } : img
      ));
    }
  }, []);

  const addFiles = useCallback((files) => {
    const newImgs = Array.from(files).map(file => {
      const id      = `${Date.now()}-${Math.random()}`;
      const preview = URL.createObjectURL(file);
      uploadToCloudinary(file, id);
      return { id, preview, url: null, uploading: true, error: null, progress: 0 };
    });
    setImages(prev => [...prev, ...newImgs]);
  }, [uploadToCloudinary]);

  const removeImage = useCallback((id) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img?.preview?.startsWith("blob:")) URL.revokeObjectURL(img.preview);
      return prev.filter(i => i.id !== id);
    });
  }, []);

  return { images, addFiles, removeImage };
}

// ── ImageGrid component ───────────────────────────────────────────────────────
export function ImageGrid({ images, onAdd, onRemove, fileInputRef }) {
  return (
    <div>
      <label style={{
        display:"block", fontSize:"11px", fontWeight:800, color:"#64748b",
        textTransform:"uppercase", marginBottom:"8px", letterSpacing:"1px",
      }}>
        Images
      </label>

      <div style={{ display:"flex", flexWrap:"wrap", gap:"10px", alignItems:"flex-start" }}>
        {images.map(img => (
          <div
            key={img.id}
            style={{
              position:"relative", width:"90px", height:"90px", flexShrink:0,
              borderRadius:"10px", overflow:"hidden", border:"2px solid #e2e8f0",
            }}
          >
            <img
              src={img.url || img.preview}
              alt=""
              style={{
                width:"100%", height:"100%", objectFit:"cover",
                opacity: img.uploading ? 0.5 : 1, transition:"opacity .2s",
              }}
            />

            {/* Progress bar */}
            {img.uploading && (
              <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"4px", background:"#e2e8f0" }}>
                <div style={{ height:"100%", width:`${img.progress}%`, background:"#4f46e5", transition:"width .2s" }} />
              </div>
            )}

            {/* Error overlay */}
            {img.error && (
              <div style={{
                position:"absolute", inset:0, background:"rgba(244,63,94,.75)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"10px", color:"white", fontWeight:700,
              }}>
                Failed
              </div>
            )}

            {/* Remove button */}
            {!img.uploading && (
              <button
                type="button"
                onClick={() => onRemove(img.id)}
                style={{
                  position:"absolute", top:"4px", right:"4px",
                  width:"20px", height:"20px", borderRadius:"50%",
                  background:"rgba(0,0,0,.6)", border:"none", color:"white",
                  fontSize:"14px", cursor:"pointer", display:"flex",
                  alignItems:"center", justifyContent:"center", lineHeight:1, padding:0,
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}

        {/* Add tile */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            width:"90px", height:"90px", borderRadius:"10px",
            border:"2px dashed #cbd5e1", background:"#f8fafc",
            cursor:"pointer", display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", gap:"4px",
            color:"#94a3b8", flexShrink:0, fontSize:"13px", fontWeight:600,
          }}
        >
          <span style={{ fontSize:"24px", lineHeight:1 }}>+</span>
          <span style={{ fontSize:"10px" }}>Add photo</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display:"none" }}
          onChange={e => { onAdd(e.target.files); e.target.value = ""; }}
        />
      </div>
    </div>
  );
}
