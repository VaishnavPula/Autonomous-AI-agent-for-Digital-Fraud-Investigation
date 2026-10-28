'use client';

import { createPortal } from 'react-dom';

export function Portal({ children }: { children: React.ReactNode }) {
  const container = document.getElementById('portal-root') || document.body;
  return createPortal(children, container);
}