
import React from 'react';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      <Header />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <Dashboard />
        </div>
      </main>
    </div>
  );
};

export default Index;
