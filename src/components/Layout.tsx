import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { navigationItems } from '../app/routes';
import MusicPlayer from './MusicPlayer';
import ParticlesBackground from './ParticlesBackground';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-transparent md:flex md:h-screen md:overflow-hidden">
      <ParticlesBackground />

      <div className="sticky top-0 z-40 border-b border-white/10 bg-[rgba(10,25,47,0.72)] px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-pink-500 shadow-lg shadow-orange-500/30">
            <span className="text-xl font-bold">NC</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">NamCy</p>
            <p className="text-xs text-white/55">Điều hướng tối ưu cho điện thoại</p>
          </div>
        </div>
      </div>

      <motion.aside 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden h-full w-20 flex-col items-center border-r border-white/10 py-8 px-4 z-50 rounded-none glass-card md:flex md:w-64 md:items-start"
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
      </motion.aside>

      <main className="relative z-10 flex-1 px-4 pb-40 pt-4 md:h-full md:overflow-y-auto md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="h-full max-w-7xl mx-auto"
        >
          {children}
        </motion.div>
      </main>

      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="fixed inset-x-3 bottom-3 z-50 md:hidden"
      >
        <div className="glass-card no-scrollbar overflow-x-auto rounded-[28px] border border-white/15 px-2 py-2">
          <div className="flex min-w-max items-center gap-1">
            {navigationItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex min-w-[68px] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-medium transition-all',
                    isActive
                      ? 'bg-white/12 text-white'
                      : 'text-white/55 hover:bg-white/6 hover:text-white',
                  )
                }
              >
                {item.icon ? <item.icon className="h-4 w-4" /> : null}
                <span className="line-clamp-1 text-center">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </motion.nav>

      <MusicPlayer />
    </div>
  );
}
