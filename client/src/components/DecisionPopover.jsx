import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

function DecisionPopover({ content, label = 'Ver leitura da decisao', title = 'Leitura da decisao' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isPositionReady, setIsPositionReady] = useState(false);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  const items = Array.isArray(content) ? content.filter(Boolean) : [content].filter(Boolean);
  const hasStructuredItems = items.every(isStructuredDecisionItem);
  const hasItems = items.length > 0;

  const updatePosition = () => {
    if (!buttonRef.current) {
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const panelWidth = panelRef.current?.offsetWidth || 320;
    const panelHeight = panelRef.current?.offsetHeight || 220;
    const viewportPadding = 12;

    const left = Math.min(
      Math.max(rect.left + rect.width / 2 - panelWidth / 2, viewportPadding),
      window.innerWidth - panelWidth - viewportPadding
    );

    const fitsBelow = rect.bottom + panelHeight + viewportPadding <= window.innerHeight;
    const top = fitsBelow
      ? rect.bottom + 10
      : Math.max(viewportPadding, rect.top - panelHeight - 10);

    setPosition({ top, left });
    setIsPositionReady(true);
  };

  useLayoutEffect(() => {
    if (!isOpen || !hasItems) {
      return undefined;
    }

    updatePosition();

    const handleViewportChange = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [hasItems, isOpen, items.length]);

  useEffect(() => {
    if (!isOpen || !hasItems) {
      setIsPositionReady(false);
      return undefined;
    }

    const handlePointerDown = (event) => {
      const target = event.target;

      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasItems, isOpen]);

  if (!hasItems) {
    return null;
  }

  return (
    <>
      <span className="decision-popover">
        <button
          type="button"
          ref={buttonRef}
          className="decision-popover-trigger"
          aria-label={label}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((value) => !value)}
        >
          &#128161;
        </button>
      </span>

      {isOpen &&
        createPortal(
          <div
            ref={panelRef}
            className="decision-popover-panel"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              visibility: isPositionReady ? 'visible' : 'hidden',
            }}
            role="dialog"
            aria-modal="false"
            aria-label={title}
          >
            <div className="decision-popover-title">{title}</div>
            {hasStructuredItems ? (
              <div className="decision-popover-sections">
                {items.map((item, index) => (
                  <section className="decision-popover-section" key={`${title}-${item.heading}-${index}`}>
                    <div className="decision-popover-section-title">{item.heading}</div>
                    <p className="decision-popover-section-text">{item.text}</p>
                  </section>
                ))}
              </div>
            ) : items.length === 1 ? (
              <p className="decision-popover-text">{items[0]}</p>
            ) : (
              <ul className="decision-popover-list">
                {items.map((item, index) => (
                  <li key={`${title}-${index}`}>{item}</li>
                ))}
              </ul>
            )}
          </div>,
          document.body
        )}
    </>
  );
}

function isStructuredDecisionItem(item) {
  return Boolean(
    item &&
      typeof item === 'object' &&
      typeof item.heading === 'string' &&
      item.heading &&
      typeof item.text === 'string' &&
      item.text
  );
}

export default DecisionPopover;
