'use client';

import { StackProvider, StackTheme } from '@stackframe/stack';
import { ReactNode } from 'react';
import { stackServerApp } from '../../stack';

interface Props {
  children: ReactNode;
}

export default function StackClientProvider({ children }: Props) {
  return (
    <StackProvider app={stackServerApp}>
      <StackTheme>{children}</StackTheme>
    </StackProvider>
  );
} 