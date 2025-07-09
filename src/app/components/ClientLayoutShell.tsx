'use client';

import React from 'react';

const ClientLayoutShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      {children}
    </main>
  );
};

export default ClientLayoutShell;
