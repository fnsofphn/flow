import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { navigationItems } from '../app/routes';
import MusicPlayer from './MusicPlayer';
import ParticlesBackground from './ParticlesBackground';
import SupabaseStatus from './SupabaseStatus';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      <ParticlesBackground />
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="glass-card z-50 flex h-full w-20 flex-col items-center rounded-none border-r border-white/10 px-4 py-8 md:w-64 md:items-start"
      >
        <NavLink to="/" className="mb-12 flex items-center gap-3 md:px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-pink-500 shadow-lg shadow-orange-500/30">
            <span className="text-xl font-bold">NC</span>
          </div>
          <span className="hidden bg-gradient-to-r from-white to-white/60 bg-clip-text text-2xl font-bold tracking-tight text-transparent md:block">
            NamCy
          </span>
        </NavLink>

        <nav className="no-scrollbar flex-1 w-full space-y-2 overflow-y-auto">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-300',
                  isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.icon ? (
                    <item.icon
                      className={cn(
                        'h-5 w-5 transition-transform duration-300',
                        isActive ? 'scale-110' : 'group-hover:scale-110',
                      )}
                    />
                  ) : null}
                  <span className="hidden font-medium md:block">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 h-8 w-1 rounded-r-full bg-orange-500"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="w-full">
          <SupabaseStatus />
        </div>
      </motion.aside>

      <main className="relative z-10 h-full flex-1 overflow-y-auto p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-auto h-full max-w-7xl"
        >
          {children}
        </motion.div>
      </main>

      <MusicPlayer />
    </div>
  );
}
