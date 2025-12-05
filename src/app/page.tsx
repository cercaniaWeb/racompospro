'use client';

import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';

const HomePage = () => {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* User Menu - Top Right */}
      {user && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
          {/* User Info */}
          <div className="glass rounded-2xl px-4 py-2 border border-white/10 hidden sm:flex items-center gap-3">
            <User className="h-5 w-5 text-primary" />
            <div className="text-sm">
              <p className="font-semibold text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="glass rounded-2xl px-4 py-2 border border-white/10 hover:bg-white/10 hover:border-red-500/30 transition-all duration-300 group flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
            title="Cerrar sesión"
          >
            <LogOut className="h-5 w-5 text-muted-foreground group-hover:text-red-400 transition-colors" />
            <span className="hidden sm:block text-sm font-medium text-foreground group-hover:text-red-400 transition-colors">
              Cerrar sesión
            </span>
          </button>
        </div>
      )}

      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[100px] animate-float delay-1000" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight">
            <span className="text-gradient">Racom-POS</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Experience the future of retail management. Offline-first, lightning fast, and beautifully designed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-16 auto-rows-[minmax(180px,auto)]">
          {/* POS Terminal - Large Card */}
          <div className="glass rounded-3xl p-8 border border-white/10 col-span-1 md:col-span-2 row-span-2 flex flex-col justify-between group hover:border-primary/30 transition-all duration-500 hover:shadow-[0_0_50px_-10px_rgba(var(--primary),0.3)]">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-3xl mb-6 text-primary group-hover:scale-110 transition-transform duration-300">🛒</div>
              <h3 className="font-bold text-3xl mb-3 text-white">POS Terminal</h3>
              <p className="text-muted-foreground text-lg">The heart of your business. Process sales, manage carts, and handle payments with zero latency.</p>
            </div>
            <a
              href="/pos"
              className="mt-8 inline-flex items-center justify-center w-full py-4 rounded-xl bg-primary text-white font-bold text-lg shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:shadow-[0_0_30px_rgba(var(--primary),0.6)] hover:bg-primary/90 transition-all duration-300 group-hover:-translate-y-1"
            >
              Launch Terminal
            </a>
          </div>

          {/* Inventory Transfers */}
          <div className="glass rounded-3xl p-6 border border-white/10 col-span-1 md:col-span-1 row-span-1 hover:bg-white/5 transition-all duration-300 group">
            <div className="text-green-400 text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">📦</div>
            <h3 className="font-bold text-xl mb-2 text-white">Transfers</h3>
            <p className="text-muted-foreground text-sm mb-4">Sync inventory between stores seamlessly.</p>
            <a href="/inventory/transferencias" className="text-green-400 text-sm font-bold hover:text-green-300 flex items-center gap-1">
              Manage Transfers <span>→</span>
            </a>
          </div>

          {/* Employee Consumption */}
          <div className="glass rounded-3xl p-6 border border-white/10 col-span-1 md:col-span-1 row-span-1 hover:bg-white/5 transition-all duration-300 group">
            <div className="text-orange-400 text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">🍽️</div>
            <h3 className="font-bold text-xl mb-2 text-white">Consumption</h3>
            <p className="text-muted-foreground text-sm mb-4">Track staff meals and approvals.</p>
            <button
              onClick={() => router.push('/pos')}
              className="text-orange-400 text-sm font-bold hover:text-orange-300 flex items-center gap-1"
            >
              Open in POS <span>→</span>
            </button>
          </div>

          {/* Smart Reordering */}
          <div className="glass rounded-3xl p-6 border border-white/10 col-span-1 md:col-span-2 row-span-1 flex items-center justify-between hover:bg-white/5 transition-all duration-300 group">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="text-purple-400 text-2xl group-hover:rotate-12 transition-transform duration-300">📊</div>
                <h3 className="font-bold text-xl text-white">Smart Reordering</h3>
              </div>
              <p className="text-muted-foreground text-sm">AI-powered stock suggestions.</p>
            </div>
            <a href="/inventory/reorden" className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 font-bold text-sm hover:bg-purple-500/30 transition-colors">
              Check Insights
            </a>
          </div>

          {/* Offline First */}
          <div className="glass rounded-3xl p-6 border border-white/10 col-span-1 md:col-span-1 row-span-1 hover:bg-white/5 transition-all duration-300 group bg-gradient-to-br from-yellow-500/10 to-transparent">
            <div className="text-yellow-400 text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">⚡</div>
            <h3 className="font-bold text-xl mb-2 text-white">Offline Mode</h3>
            <p className="text-muted-foreground text-sm">Works without internet.</p>
          </div>

          {/* Add Sample Data */}
          <div className="glass rounded-3xl p-6 border border-white/10 col-span-1 md:col-span-1 row-span-1 hover:bg-white/5 transition-all duration-300 group flex flex-col justify-center items-center text-center">
            <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 text-2xl mb-3 group-hover:rotate-90 transition-transform duration-500">➕</div>
            <h3 className="font-bold text-lg mb-1 text-white">Seed Data</h3>
            <a href="/seeder" className="text-teal-400 text-sm font-bold hover:text-teal-300">
              Add Products
            </a>
          </div>
        </div>

        <div className="glass rounded-3xl p-8 border border-white/10 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
            <span className="w-2 h-8 bg-primary rounded-full"></span>
            Quick Start Guide
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-white shrink-0">1</div>
              <div>
                <h4 className="font-bold text-white mb-1">Seed Database</h4>
                <p className="text-muted-foreground text-sm">Populate your system with sample products to test functionality.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-white shrink-0">2</div>
              <div>
                <h4 className="font-bold text-white mb-1">Start Selling</h4>
                <p className="text-muted-foreground text-sm">Open the POS terminal and process your first transaction.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-white shrink-0">3</div>
              <div>
                <h4 className="font-bold text-white mb-1">Explore Features</h4>
                <p className="text-muted-foreground text-sm">Test transfers, consumption tracking, and reordering logic.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-white shrink-0">4</div>
              <div>
                <h4 className="font-bold text-white mb-1">Go Offline</h4>
                <p className="text-muted-foreground text-sm">Disconnect your internet to see the local-first architecture in action.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-white/30 text-sm font-medium">
          <p>Racom-POS System • Premium Edition</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;