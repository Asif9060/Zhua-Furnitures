'use client';

import { useEffect } from 'react';

const ATTR_NAME = 'fdprocessedid';
const SELECTOR = `[${ATTR_NAME}]`;

function stripOnElement(element: Element): void {
  if (element.hasAttribute(ATTR_NAME)) {
    element.removeAttribute(ATTR_NAME);
  }

  element.querySelectorAll(SELECTOR).forEach((node) => {
    node.removeAttribute(ATTR_NAME);
  });
}

export default function FdProcessedIdSanitizer() {
  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    stripOnElement(document.documentElement);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        const target = mutation.target;
        if (target instanceof Element) {
          stripOnElement(target);
        }

        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            stripOnElement(node);
          }
        });
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [ATTR_NAME],
    });

    const stopObserver = () => observer.disconnect();
    const timeoutId = window.setTimeout(stopObserver, 10000);

    return () => {
      window.clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  return null;
}
