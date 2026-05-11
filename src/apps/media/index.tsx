import { useState, useEffect, useRef } from 'preact/hooks';
import { useOS } from '../../kernel/useOS';
import * as Icons from 'lucide-preact';

export default function MediaPlayer(props: { filePath?: string }) {
  const { fs } = useOS();
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const isVideo = props.filePath?.match(/\.(mp4|webm|ogg)$/i);
  const isAudio = props.filePath?.match(/\.(mp3|wav|ogg)$/i);

  useEffect(() => {
    let url: string | null = null;

    async function loadMedia() {
      if (!props.filePath) {
        setLoading(false);
        return;
      }

      const node = await fs.readFile(props.filePath);
      if (node && node.content) {
        if (node.content instanceof Blob) {
          url = URL.createObjectURL(node.content);
          setMediaUrl(url);
        } else if (typeof node.content === 'string') {
          setMediaUrl(node.content);
        }
      }
      setLoading(false);
    }

    loadMedia();

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [props.filePath]);

  if (loading) return <div style={{ padding: '20px', color: '#64748b' }}>Loading media...</div>;
  if (!mediaUrl) return <div style={{ padding: '20px', color: '#64748b', textAlign: 'center' }}>No media file selected.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000', color: 'white' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#000' }}>
        {isVideo ? (
          <video 
            ref={videoRef}
            src={mediaUrl} 
            controls 
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />
        ) : isAudio ? (
          <div style={{ textAlign: 'center', width: '100%', padding: '40px' }}>
            <div style={{ width: '120px', height: '120px', background: '#1e293b', borderRadius: '50%', margin: '0 auto 30px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)' }}>
              <Icons.Music size={60} color="#3b82f6" />
            </div>
            <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>{props.filePath?.split('/').pop()}</h3>
            <audio 
              ref={audioRef}
              src={mediaUrl} 
              controls 
              style={{ width: '100%', maxWidth: '400px' }}
            />
          </div>
        ) : (
          <div style={{ color: '#ef4444' }}>Unsupported media format</div>
        )}
      </div>
    </div>
  );
}
