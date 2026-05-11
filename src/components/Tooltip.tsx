import { useState, useRef, useEffect } from 'preact/hooks';

interface TooltipProps {
  text: string;
  children: any;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function Tooltip({ text, children, position = 'top', delay = 500 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<number>();
  const targetRef = useRef<HTMLElement>(null);

  const showTooltip = () => {
    timeoutRef.current = window.setTimeout(() => {
      if (targetRef.current) {
        // Measure the first child element if the wrapper is display: contents
        const target = targetRef.current.firstElementChild || targetRef.current;
        const rect = target.getBoundingClientRect();
        let x = 0;
        let y = 0;

        switch (position) {
          case 'top':
            x = rect.left + rect.width / 2;
            y = rect.top - 8;
            break;
          case 'bottom':
            x = rect.left + rect.width / 2;
            y = rect.bottom + 8;
            break;
          case 'left':
            x = rect.left - 8;
            y = rect.top + rect.height / 2;
            break;
          case 'right':
            x = rect.right + 8;
            y = rect.top + rect.height / 2;
            break;
        }

        setCoords({ x, y });
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const getStyle = () => {
    const style: any = {
      left: `${coords.x}px`,
      top: `${coords.y}px`,
    };

    switch (position) {
      case 'top':
        style.transform = 'translate(-50%, -100%)';
        break;
      case 'bottom':
        style.transform = 'translate(-50%, 0)';
        break;
      case 'left':
        style.transform = 'translate(-100%, -50%)';
        break;
      case 'right':
        style.transform = 'translate(0, -50%)';
        break;
    }

    return style;
  };

  return (
    <div 
      ref={targetRef as any}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onClick={hideTooltip}
      style={{ display: 'contents' }}
    >
      {children}
      {isVisible && (
        <div className="tooltip" style={getStyle()}>
          {text}
        </div>
      )}
    </div>
  );
}
