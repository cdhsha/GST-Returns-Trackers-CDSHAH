/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Index from './Index';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  return (
    <>
      <Index />
      <Toaster position="top-right" />
    </>
  );
}
