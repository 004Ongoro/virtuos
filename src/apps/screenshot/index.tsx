import { useState, useRef } from 'preact/hooks';
import { useOS } from '../../kernel/useOS';
import * as Icons from 'lucide-preact';

export default function Screenshot() {
  const { fs, notify } = useOS();
  const [capturing, setCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const takeScreenshot = async () => {
    setCapturing(true);
    try {
      // 1. Get screen stream
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'never' } as any,
        audio: false
      });

      // 2. Play stream in hidden video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // 3. Draw frame to canvas
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(videoRef.current, 0, 0);

          // 4. Stop stream
          stream.getTracks().forEach(track => track.stop());

          // 5. Convert to Blob and Save to VFS
          canvas.toBlob(async (blob) => {
            if (blob) {
              const fileName = `screenshot_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
              await fs.writeFile(`/home/pictures/${fileName}`, blob);
              notify('Screenshot', `Saved as ${fileName} in Pictures`, 'success');
            }
          }, 'image/png');
        }
      }
    } catch (err) {
      console.error(err);
      notify('Screenshot', 'Failed to capture screen. Permission denied or not supported.', 'error');
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', color: '#1e293b', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <video ref={videoRef} style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div style={{ width: '120px', height: '120px', background: '#f1f5f9', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '30px' }}>
        <Icons.Camera size={60} color="#3b82f6" />
      </div>

      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>Screenshot Utility</h2>
      <p style={{ color: '#64748b', textAlign: 'center', marginBottom: '40px', maxWidth: '300px' }}>
        Capture your VirtuOS desktop and save it directly to your Pictures folder.
      </p>

      <button 
        onClick={takeScreenshot}
        disabled={capturing}
        style={{ 
          padding: '15px 40px', 
          background: capturing ? '#94a3b8' : '#3b82f6', 
          color: 'white', 
          border: 'none', 
          borderRadius: '30px', 
          fontSize: '16px', 
          fontWeight: 'bold', 
          cursor: capturing ? 'default' : 'pointer',
          boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)',
          transition: 'all 0.2s'
        }}
      >
        {capturing ? 'Capturing...' : 'Capture Desktop'}
      </button>
      
      <div style={{ marginTop: '40px', padding: '15px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fee2e2', color: '#991b1b', fontSize: '12px', textAlign: 'center', maxWidth: '350px' }}>
        <Icons.Info size={16} style={{ marginBottom: '5px' }} />
        <p>Note: Browser will ask for permission to share your screen. Choose your current browser tab for best results.</p>
      </div>
    </div>
  );
}
