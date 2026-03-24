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
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-20 md:w-64 h-full glass-card border-r border-white/10 flex flex-col items-center md:items-start py-8 px-4 z-50 rounded-none"
      >
        <div className="flex items-center gap-3 mb-12 md:px-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <span className="font-bold text-xl">NC</span>
          </div>
          <span className="hidden md:block font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            NamCy
          </span>
        </div>

        <nav className="flex-1 w-full space-y-2 overflow-y-auto no-scrollbar">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group relative",
                isActive ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              {({ isActive }) => (
                <>
                  {item.icon ? (
                    <item.icon
                      className={cn("w-5 h-5 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")}
                    />
                  ) : null}
                  <span className="hidden md:block font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="activeNav"
                      className="absolute left-0 w-1 h-8 bg-orange-500 rounded-r-full"
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

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto relative z-10 p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="h-full max-w-7xl mx-auto"
        >
          {children}
        </motion.div>
      </main>

      {/* Floating Music Player */}
      <MusicPlayer />
    </div>
  );
}
