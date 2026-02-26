import { useState, useEffect } from 'react';

const cache = new Map();

const BASE = 'https://api.iconify.design';

function fetchSvg(icon, size) {
  const key = `${icon}@${size}`;
  if (cache.has(key)) return Promise.resolve(cache.get(key));

  const [prefix, name] = icon.split(':');
  if (!prefix || !name) return Promise.resolve('');

  return fetch(`${BASE}/${prefix}/${name}.svg?height=${size}`)
    .then((r) => (r.ok ? r.text() : ''))
    .then((svg) => {
      if (svg) cache.set(key, svg);
      return svg;
    })
    .catch(() => '');
}

export default function IconifyIcon({ icon, size = 20, className }) {
  const [svg, setSvg] = useState(() => cache.get(`${icon}@${size}`) || '');

  useEffect(() => {
    if (!icon) return;
    let cancelled = false;
    fetchSvg(icon, size).then((s) => {
      if (!cancelled) setSvg(s);
    });
    return () => { cancelled = true; };
  }, [icon, size]);

  if (!svg) {
    return <span className={className} style={{ display: 'inline-block', width: size, height: size }} />;
  }

  return (
    <span
      className={className}
      style={{ display: 'inline-flex', width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
