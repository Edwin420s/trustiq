import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Verification', href: '/verification' },
    { name: 'Profile', href: '/profile' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TQ</span>
              </div>
              <span className="text-white font-bold text-xl">TrustIQ</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive(item.href)
                      ? 'border-cyan-500 text-white'
                      : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="hidden sm:flex items-center space-x-3">
                  <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {user.walletAddress.slice(2, 4)}
                    </span>
                  </div>
                  <div className="text-sm">
                    <div className="text-white font-medium">
                      {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                    </div>
                    <div className="text-cyan-400 font-bold">
                      Score: {user.trustScore}
                    </div>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-md hover:border-slate-600 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/"
                className="px-4 py-2 text-sm text-white bg-cyan-600 hover:bg-cyan-700 rounded-md transition-colors"
              >
                Get Started
              </Link>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500"
              >
                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-slate-800">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive(item.href)
                      ? 'text-white bg-slate-800'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {user && (
                <div className="px-3 py-2 text-sm text-slate-400 border-t border-slate-800 mt-2 pt-2">
                  <div>Wallet: {user.walletAddress.slice(0, 8)}...</div>
                  <div>Trust Score: {user.trustScore}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}