import { useState, useEffect, useRef } from 'preact/hooks';
import { useKernel } from '../../kernel/useKernel';
import { vfs } from '../../vfs/vfs';
import { getCLIProgram, getAllCLIPrograms } from '../cli/registry';

interface LogEntry {
  type: 'input' | 'output' | 'error';
  content: string;
}

export default function Terminal() {
  const kernel = useKernel();
  const [cwd, setCwd] = useState('/home');
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<LogEntry[]>([
    { type: 'output', content: 'VirtuOS Terminal v1.2.0' },
    { type: 'output', content: 'Type "help" for a list of commands.' }
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const addLog = (content: string, type: LogEntry['type'] = 'output') => {
    setHistory(prev => [...prev, { type, content }]);
  };

  const handleCommand = async (cmdLine: string) => {
    const trimmed = cmdLine.trim();
    if (!trimmed) return;

    addLog(`${cwd} $ ${trimmed}`, 'input');
    
    const [command, ...args] = trimmed.split(' ');
    const progName = command.toLowerCase();

    if (progName === 'clear') {
      setHistory([]);
      return;
    }

    try {
      const program = getCLIProgram(progName);
      if (program) {
        await program.execute(args, {
          cwd,
          fs: vfs,
          kernel,
          print: (msg, type) => addLog(msg, type),
          setCwd: (newPath) => setCwd(newPath),
          programs: getAllCLIPrograms()
        });
        return;
      }

      // Try VFS /bin
      const binPath = `/bin/${progName}`;
      const file = await vfs.readFile(binPath);
      if (file && file.type === 'file') {
        const sandbox = {
          print: (msg: string, type: any) => addLog(msg, type),
          args,
          fs: vfs,
          kernel,
          cwd,
          setCwd: (p: string) => setCwd(p)
        };
        const fn = new Function('ctx', `
          const { print, args, fs, kernel, cwd, setCwd } = ctx;
          return (async () => {
            ${file.content}
          })();
        `);
        await fn(sandbox);
        return;
      }

      addLog(`Command not found: ${progName}`, 'error');
    } catch (err: any) {
      addLog(`Error: ${err.message || err}`, 'error');
    }
  };

  return (
    <div 
      className="terminal-app" 
      onClick={() => inputRef.current?.focus()}
      style={{ 
        height: '100%', 
        background: '#000', 
        color: '#00ff00', 
        fontFamily: 'monospace',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <div 
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto' }}
      >
        {history.map((entry, i) => (
          <div key={i} style={{ 
            color: entry.type === 'error' ? '#ff5555' : entry.type === 'input' ? '#ffffff' : '#00ff00',
            whiteSpace: 'pre-wrap',
            marginBottom: '4px'
          }}>
            {entry.content}
          </div>
        ))}
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <span style={{ color: '#00ff00' }}>{cwd} $</span>
        <input 
          ref={inputRef}
          type="text" 
          value={input}
          onInput={(e) => setInput((e.target as HTMLInputElement).value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCommand(input);
              setInput('');
            }
          }}
          style={{ 
            flex: 1, 
            background: 'transparent', 
            border: 'none', 
            outline: 'none', 
            color: '#fff',
            fontFamily: 'monospace'
          }}
        />
      </div>
    </div>
  );
}
