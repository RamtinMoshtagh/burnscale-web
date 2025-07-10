'use client';

import React from 'react';
import Navbar from './Navbar';

const ClientLayoutShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </>
  );
};

export default ClientLayoutShell;
