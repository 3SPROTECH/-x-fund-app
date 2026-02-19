import { useRef } from 'react';
import { Paperclip } from 'lucide-react';

export default function FileUploadButton({ onFileSelect, label = 'Justificatif' }) {
  const inputRef = useRef(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
    // Reset so the same file can be selected again
    e.target.value = '';
  };

  return (
    <button type="button" className="pf-file-upload-btn" onClick={handleClick}>
      <Paperclip size={18} />
      {label}
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
      />
    </button>
  );
}
