import { useEffect, useRef } from 'react';
import i18n from '@/i18n/config';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useAccessibleDrawer(label: string, onClose: () => void) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) {
      return;
    }

    const previouslyFocused = document.activeElement;
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', label);

    const focusInitialControl = () => {
      if (drawer.contains(document.activeElement)) {
        return true;
      }
      const closeButton = drawer.querySelector<HTMLButtonElement>('button');
      closeButton?.setAttribute('aria-label', i18n.t('drawer.close'));
      const firstFocusable =
        drawer.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      if (firstFocusable) {
        firstFocusable.focus();
        return true;
      }
      return false;
    };

    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        if (!focusInitialControl()) {
          drawer.tabIndex = -1;
          drawer.focus();
        }
      });
    });
    const focusTimer = window.setTimeout(focusInitialControl, 120);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const openNestedMenu = drawer.querySelector(
          '[aria-haspopup="menu"][aria-expanded="true"]',
        );
        if (openNestedMenu) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown, true);
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [label, onClose]);

  return drawerRef;
}
