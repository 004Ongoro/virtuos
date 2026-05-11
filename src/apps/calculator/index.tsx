import { useState } from 'preact/hooks';

export default function Calculator() {
  const [display, setDisplay] = useState('0');
  const [equation, setHistory] = useState('');
  const [shouldReset, setShouldReset] = useState(false);

  const handleNumber = (num: string) => {
    if (display === '0' || shouldReset) {
      setDisplay(num);
      setShouldReset(false);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op: string) => {
    setHistory(display + ' ' + op + ' ');
    setShouldReset(true);
  };

  const calculate = () => {
    try {
      const fullEquation = equation + display;
      const result = new Function('return ' + fullEquation.replace(/×/g, '*').replace(/÷/g, '/'))();
      setDisplay(String(result));
      setHistory('');
      setShouldReset(true);
    } catch (e) {
      setDisplay('Error');
      setHistory('');
    }
  };

  const clear = () => {
    setDisplay('0');
    setHistory('');
  };

  const btnStyle: any = {
    padding: '15px',
    fontSize: '18px',
    border: '1px solid var(--window-border)',
    background: 'var(--surface-color)',
    color: 'var(--text-color)',
    cursor: 'pointer',
    borderRadius: '8px',
    fontWeight: '500',
    transition: 'background 0.2s'
  };

  const opStyle = { ...btnStyle, background: 'rgba(0,0,0,0.05)', color: 'var(--accent-color)', fontWeight: 'bold' };
  const equalStyle = { ...btnStyle, background: 'var(--accent-color)', color: '#fff', border: 'none' };

  return (
    <div style={{ height: '100%', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column', padding: '20px', gap: '15px' }}>
      <div style={{ 
        background: 'var(--surface-color)', 
        padding: '20px', 
        borderRadius: '12px', 
        border: '1px solid var(--window-border)',
        textAlign: 'right',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', height: '18px', marginBottom: '5px' }}>{equation}</div>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-color)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{display}</div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '10px',
        flex: 1
      }}>
        <button onClick={clear} style={{ ...opStyle, gridColumn: 'span 3', color: '#ef4444' }}>AC</button>
        <button onClick={() => handleOperator('/')} style={opStyle}>÷</button>
        
        <button onClick={() => handleNumber('7')} style={btnStyle}>7</button>
        <button onClick={() => handleNumber('8')} style={btnStyle}>8</button>
        <button onClick={() => handleNumber('9')} style={btnStyle}>9</button>
        <button onClick={() => handleOperator('*')} style={opStyle}>×</button>
        
        <button onClick={() => handleNumber('4')} style={btnStyle}>4</button>
        <button onClick={() => handleNumber('5')} style={btnStyle}>5</button>
        <button onClick={() => handleNumber('6')} style={btnStyle}>6</button>
        <button onClick={() => handleOperator('-')} style={opStyle}>-</button>
        
        <button onClick={() => handleNumber('1')} style={btnStyle}>1</button>
        <button onClick={() => handleNumber('2')} style={btnStyle}>2</button>
        <button onClick={() => handleNumber('3')} style={btnStyle}>3</button>
        <button onClick={() => handleOperator('+')} style={opStyle}>+</button>
        
        <button onClick={() => handleNumber('0')} style={{ ...btnStyle, gridColumn: 'span 2' }}>0</button>
        <button onClick={() => handleNumber('.')} style={btnStyle}>.</button>
        <button onClick={calculate} style={equalStyle}>=</button>
      </div>
    </div>
  );
}
