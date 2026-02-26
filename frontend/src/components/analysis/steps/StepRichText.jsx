import { useState, forwardRef, useImperativeHandle } from 'react';
import { RichTextEditor } from '../../ui';

function isContentEmpty(html) {
  if (!html) return true;
  return !html.replace(/<[^>]*>/g, '').trim();
}

const StepRichText = forwardRef(function StepRichText(
  { fieldLabel, placeholder, value = '', onChange },
  ref,
) {
  const [error, setError] = useState('');

  useImperativeHandle(ref, () => ({
    validate() {
      if (isContentEmpty(value)) {
        setError('Ce champ est requis');
        return false;
      }
      setError('');
      return true;
    },
  }));

  const handleChange = (val) => {
    onChange?.(val);
    if (error) setError('');
  };

  return (
    <div className="an-step-fullheight">
      <div className="an-step-field an-step-field-grow">
        <label className="an-step-field-label">
          {fieldLabel} <span className="required">*</span>
        </label>
        <RichTextEditor
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`rte-fullheight${error ? ' rte-error' : ''}`}
        />
        {error && <span className="an-step-field-error">{error}</span>}
      </div>
    </div>
  );
});

export default StepRichText;
