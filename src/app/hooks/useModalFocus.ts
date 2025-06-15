import { useEffect, useRef } from 'react';

export function useModalFocus(isOpen: boolean) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      
      // Focus the modal
      modalRef.current?.focus();
      
      // Lock body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      
      // Restore focus to previously focused element
      previouslyFocusedElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
      // Only restore focus if the modal was actually open and the element still exists
      if (!isOpen && previouslyFocusedElement.current && document.body.contains(previouslyFocusedElement.current)) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [isOpen]);
  
  return { modalRef };
}