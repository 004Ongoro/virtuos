import { useState, useEffect } from 'preact/hooks';
import { useOS } from '../../kernel/useOS';
import * as Icons from 'lucide-preact';

export default function Photos(props: { filePath?: string }) {
  const { fs } = useOS();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    let url: string | null = null;

    async function loadImage() {
      if (!props.filePath) {
        setLoading(false);
        return;
      }

      const node = await fs.readFile(props.filePath);
      if (node && node.content) {
        // If content is already a URL or base64 string
        if (typeof node.content === 'string') {
          setImageUrl(node.content);
        } else if (node.content instanceof Blob) {
          url = URL.createObjectURL(node.content);
          setImageUrl(url);
        }
      }
      setLoading(false);
    }

    loadImage();

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [props.filePath]);

  if (loading) return <div style={{ padding: '20px', color: '#64748b' }}>Loading image...</div>;
  if (!imageUrl) return <div style={{ padding: '20px', color: '#64748b', textAlign: 'center' }}>No image selected.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000', overflow: 'hidden' }}>
      <div style={{ 
        padding: '8px 12px', 
        background: 'rgba(255,255,255,0.1)', 
        backdropFilter: 'blur(10px)',
        display: 'flex', 
        gap: '15px', 
        alignItems: 'center',
        zIndex: 10
      }}>
        <button onClick={() => setZoom(z => Math.max(10, z - 10))} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><Icons.ZoomOut size={18} /></button>
        <span style={{ color: 'white', fontSize: '12px', minWidth: '40px', textAlign: 'center' }}>{zoom}%</span>
        <button onClick={() => setZoom(z => Math.min(500, z + 10))} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><Icons.ZoomIn size={18} /></button>
        <button onClick={() => setZoom(100)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '11px' }}>Reset</button>
        <div style={{ flex: 1 }} />
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>{props.filePath?.split('/').pop()}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: '20px' }}>
        <img 
          src={imageUrl} 
          style={{ 
            maxWidth: zoom === 100 ? '100%' : 'none',
            maxHeight: zoom === 100 ? '100%' : 'none',
            width: zoom !== 100 ? `${zoom}%` : 'auto',
            height: 'auto',
            objectFit: 'contain',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            transition: 'transform 0.2s'
          }} 
          alt="Preview"
        />
      </div>
    </div>
  );
}
