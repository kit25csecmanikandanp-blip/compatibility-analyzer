/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile } from '../types/api';
import { logout } from '../lib/auth/authStore';
import { 
  GitCompare, 
  Layers, 
  History, 
  Sparkles, 
  User, 
  LogOut, 
  ChevronDown, 
  Menu, 
  X,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'home' | 'dashboard' | 'analyzer' | 'results' | 'history' | 'diff';
  onNavigate: (tab: 'home' | 'dashboard' | 'analyzer' | 'history') => void;
  currentUser: UserProfile | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  currentUser,
  onOpenAuth,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    onNavigate('home');
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-purple-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <div 
            onClick={() => onNavigate('home')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6C4DFF] via-[#3685FF] to-[#26D9D0] flex items-center justify-center text-white shadow-md shadow-purple-200 group-hover:scale-105 transition-transform duration-200">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-[#0F172A] via-[#6C4DFF] to-[#3685FF] bg-clip-text text-transparent">
                  API Compatibility Analyzer
                </span>
                <span className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-semibold bg-purple-100 text-[#6C4DFF] rounded-md uppercase tracking-wider">
                  Intelligent
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Breaking Change Detector & Contract Audit
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'home'
                  ? 'text-[#6C4DFF] bg-purple-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => onNavigate('analyzer')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'analyzer' || currentTab === 'results' || currentTab === 'diff'
                  ? 'text-[#6C4DFF] bg-purple-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4" />
              Compare Specs
            </button>

            <button
              onClick={() => {
                if (currentUser) {
                  onNavigate('dashboard');
                } else {
                  onOpenAuth('login');
                }
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'dashboard'
                  ? 'text-[#6C4DFF] bg-purple-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Dashboard
            </button>

            <button
              onClick={() => {
                if (currentUser) {
                  onNavigate('history');
                } else {
                  onOpenAuth('login');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'history'
                  ? 'text-[#6C4DFF] bg-purple-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <History className="w-4 h-4" />
              History
            </button>
          </div>

          {/* Right Action: User Menu or Auth CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-purple-200 bg-purple-50/50 hover:bg-purple-100/50 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#6C4DFF] to-[#3685FF] flex items-center justify-center text-white text-xs font-bold shadow-xs">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-slate-800 max-w-[120px] truncate">
                    {currentUser.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {userDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-purple-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
                      <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('dashboard');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-purple-50 hover:text-[#6C4DFF] flex items-center gap-2"
                    >
                      <Layers className="w-4 h-4" />
                      Dashboard
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('history');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-purple-50 hover:text-[#6C4DFF] flex items-center gap-2"
                    >
                      <History className="w-4 h-4" />
                      Analysis History
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-[#6C4DFF] transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#6C4DFF] to-[#3685FF] hover:opacity-95 shadow-md shadow-purple-200 transition-all hover:scale-102 active:scale-98"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                  Get Started
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-slate-700" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-purple-100 bg-white px-4 pt-3 pb-6 space-y-2">
          <button
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-purple-50"
          >
            Home
          </button>
          <button
            onClick={() => {
              onNavigate('analyzer');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-purple-50"
          >
            Compare API Specs
          </button>
          <button
            onClick={() => {
              if (currentUser) {
                onNavigate('dashboard');
              } else {
                onOpenAuth('login');
              }
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-purple-50"
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              if (currentUser) {
                onNavigate('history');
              } else {
                onOpenAuth('login');
              }
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-purple-50"
          >
            History
          </button>

          <div className="pt-3 border-t border-slate-100">
            {currentUser ? (
              <div className="space-y-2">
                <div className="px-3 py-2 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-600 font-semibold">Signed in as</p>
                  <p className="font-bold text-slate-900">{currentUser.name}</p>
                  <p className="text-xs text-slate-500">{currentUser.email}</p>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center px-4 py-2 rounded-lg text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onOpenAuth('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl text-center text-sm font-semibold text-slate-700 bg-slate-100"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    onOpenAuth('register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl text-center text-sm font-semibold text-white bg-gradient-to-r from-[#6C4DFF] to-[#3685FF]"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
