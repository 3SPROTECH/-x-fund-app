import { useRef, useState } from 'react';

export default function DropZone({ onFileSelect, fileName, placeholder = 'Glissez un fichier ici ou cliquez pour parcourir' }) {
  const inputRef = useRef(null);
  const [dragover, setDragover] = useState(false);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file.name, file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragover(true);
  };

  const handleDragLeave = () => {
    setDragover(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragover(false);
    const file = e.dataTransfer.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file.name, file);
    }
  };

  return (
    <div
      className={`pf-dropzone${dragover ? ' dragover' : ''}`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      <p>{placeholder}</p>
      {fileName && <div className="pf-dropzone-filename">{fileName}</div>}
    </div>
  );
}
