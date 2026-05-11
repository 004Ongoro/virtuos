import { useState, useEffect, useRef } from 'preact/hooks';
import { useOS } from '../../kernel/useOS';
import { path } from '../../libs/path';

interface LogEntry {
  type: 'input' | 'output' | 'error';
  content: string;
}

export default function Terminal() {
  const { fs } = useOS();
  const [cwd, setCwd] = useState('/home');
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<LogEntry[]>([
    { type: 'output', content: 'VirtuOS Terminal v1.0.0' },
    { type: 'output', content: 'Type "help" for a list of commands.' }
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const addLog = (content: string, type: LogEntry['type'] = 'output') => {
    setHistory(prev => [...prev, { type, content }]);
  };

  const handleCommand = async (cmdLine: string) => {
    const trimmed = cmdLine.trim();
    if (!trimmed) return;

    addLog(`${cwd} $ ${trimmed}`, 'input');
    
    const [command, ...args] = trimmed.split(' ');

    switch (command.toLowerCase()) {
      case 'help':
        addLog('Available commands: help, clear, ls, cd, cat, mkdir, rm, echo, whoami, pwd');
        break;

      case 'clear':
        setHistory([]);
        break;

      case 'ls': {
        try {
          const items = await fs.listFiles(cwd);
          if (items.length === 0) {
            addLog('(directory empty)');
          } else {
            addLog(items.map(item => item.type === 'dir' ? `[DIR] ${item.name}` : item.name).join('  '));
          }
        } catch (err) {
          addLog('Error listing files', 'error');
        }
        break;
      }

      case 'cd': {
        const target = args[0] || '/home';
        const newPath = path.resolve(cwd, target);
        if (await fs.exists(newPath)) {
          const node = await fs.readFile(newPath);
          if (node?.type === 'dir') {
            setCwd(newPath);
          } else {
            addLog(`cd: ${target}: Not a directory`, 'error');
          }
        } else {
          addLog(`cd: ${target}: No such file or directory`, 'error');
        }
        break;
      }

      case 'cat': {
        const target = args[0];
        if (!target) {
          addLog('Usage: cat [filename]', 'error');
          break;
        }
        const filePath = path.resolve(cwd, target);
        const node = await fs.readFile(filePath);
        if (node && node.type === 'file') {
          addLog(node.content || '');
        } else {
          addLog(`cat: ${target}: No such file`, 'error');
        }
        break;
      }

      case 'mkdir': {
        const name = args[0];
        if (!name) {
          addLog('Usage: mkdir [directory_name]', 'error');
          break;
        }
        await fs.mkdir(cwd, name);
        addLog(`Directory "${name}" created.`);
        break;
      }

      case 'rm': {
        const name = args[0];
        if (!name) {
          addLog('Usage: rm [name]', 'error');
          break;
        }
        const targetPath = path.resolve(cwd, name);
        if (await fs.exists(targetPath)) {
          await fs.deleteFile(targetPath);
          addLog(`Removed "${name}".`);
        } else {
          addLog(`rm: ${name}: No such file or directory`, 'error');
        }
        break;
      }

      case 'echo': {
        const text = args.join(' ');
        if (text.includes('>')) {
          const [content, fileName] = text.split('>').map(s => s.trim());
          const filePath = path.resolve(cwd, fileName);
          await fs.writeFile(filePath, content);
          addLog(`Written to ${fileName}`);
        } else {
          addLog(text);
        }
        break;
      }

      case 'pwd':
        addLog(cwd);
        break;

      case 'whoami':
        addLog('virtuos-user');
        break;

      default:
        addLog(`Command not found: ${command}`, 'error');
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
        fontFamily: '"Cascadia Code", "Fira Code", monospace',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontSize: '14px'
      }}
    >
      <div 
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', marginBottom: '5px' }}
      >
        {history.map((entry, i) => (
          <div key={i} style={{ 
            marginBottom: '4px', 
            color: entry.type === 'error' ? '#ff5555' : entry.type === 'input' ? '#ffffff' : '#00ff00',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}>
            {entry.content}
          </div>
        ))}
      </div>
      
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{cwd} $</span>
        <input 
          ref={inputRef}
          type="text" 
          autoFocus
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
            fontFamily: 'inherit',
            fontSize: 'inherit'
          }}
        />
      </div>
    </div>
  );
}
