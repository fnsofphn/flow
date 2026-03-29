import React, { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { GripVertical, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { navigationItems } from '../app/routes';
import MusicPlayer from './MusicPlayer';
import ParticlesBackground from './ParticlesBackground';

const DESKTOP_BREAKPOINT = 768;
const MOBILE_SIDEBAR_WIDTH = 280;
const MOBILE_SIDEBAR_THRESHOLD = 120;
const MOBILE_SWIPE_VELOCITY = 500;
const SIDEBAR_DEFAULT_WIDTH = 256;
const SIDEBAR_MIN_WIDTH = 72;
const SIDEBAR_MAX_WIDTH = 320;
const SIDEBAR_COLLAPSE_THRESHOLD = 116;
const SIDEBAR_LABEL_THRESHOLD = 208;
const SIDEBAR_STORAGE_KEY = 'flow-layout-sidebar-width';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === 'undefined') {
      return SIDEBAR_DEFAULT_WIDTH;
    }

    const savedWidth = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    const parsedWidth = savedWidth ? Number(savedWidth) : NaN;

    if (!Number.isFinite(parsedWidth)) {
      return window.innerWidth >= DESKTOP_BREAKPOINT ? SIDEBAR_DEFAULT_WIDTH : 0;
    }

    return Math.min(SIDEBAR_MAX_WIDTH, Math.max(0, parsedWidth));
  });
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDraggingMobileSidebar, setIsDraggingMobileSidebar] = useState(false);
  const dragStateRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const isSidebarCollapsed = sidebarWidth === 0;
  const shouldShowLabels = sidebarWidth >= SIDEBAR_LABEL_THRESHOLD;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    if (!isDraggingSidebar) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current;

      if (!dragState) {
        return;
      }

      const nextWidth = Math.min(
        SIDEBAR_MAX_WIDTH,
        Math.max(0, dragState.startWidth + event.clientX - dragState.startX),
      );

      setSidebarWidth(nextWidth);
    };

    const handlePointerUp = () => {
      setIsDraggingSidebar(false);
      dragStateRef.current = null;

      setSidebarWidth((currentWidth) => {
        if (currentWidth < SIDEBAR_COLLAPSE_THRESHOLD) {
          return 0;
        }

        if (currentWidth < SIDEBAR_MIN_WIDTH) {
          return SIDEBAR_MIN_WIDTH;
        }

        return currentWidth;
      });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingSidebar]);

  const handleSidebarToggle = () => {
    setSidebarWidth((currentWidth) => (currentWidth === 0 ? SIDEBAR_DEFAULT_WIDTH : 0));
  };

  const handleMobileSidebarToggle = () => {
    setIsMobileSidebarOpen((current) => !current);
  };

  const handleSidebarDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (window.innerWidth < DESKTOP_BREAKPOINT) {
      return;
    }

    event.preventDefault();

    dragStateRef.current = {
      startX: event.clientX,
      startWidth: sidebarWidth,
    };

    setIsDraggingSidebar(true);
  };

  const handleMobileSidebarDragStart = () => {
    setIsDraggingMobileSidebar(true);
  };

  const handleMobileSidebarDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number }; velocity: { x: number } }) => {
    setIsDraggingMobileSidebar(false);

    if (info.offset.x > MOBILE_SIDEBAR_THRESHOLD || info.velocity.x > MOBILE_SWIPE_VELOCITY) {
      setIsMobileSidebarOpen(true);
      return;
    }

    if (info.offset.x < -MOBILE_SIDEBAR_THRESHOLD || info.velocity.x < -MOBILE_SWIPE_VELOCITY) {
      setIsMobileSidebarOpen(false);
      return;
    }

    setIsMobileSidebarOpen((current) => current);
  };

  return (
    <div className="relative min-h-screen bg-transparent md:flex md:h-screen md:overflow-hidden">
      <ParticlesBackground />

      <div className="sticky top-0 z-40 border-b border-white/10 bg-[rgba(10,25,47,0.72)] px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-pink-500 shadow-lg shadow-orange-500/30">
              <span className="text-xl font-bold">NC</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">NamCy</p>
              <p className="text-xs text-white/55">Dieu huong module tren mobile</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleMobileSidebarToggle}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 backdrop-blur-xl transition hover:border-orange-400/60 hover:text-white"
            aria-label={isMobileSidebarOpen ? 'An thanh dieu huong' : 'Mo thanh dieu huong'}
          >
            {isMobileSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-y-0 left-0 z-[90] flex items-center md:hidden">
        <button
          type="button"
          className={cn(
            'pointer-events-auto ml-1 flex h-24 w-5 cursor-ew-resize items-center justify-center rounded-full border border-white/10 bg-[rgba(10,25,47,0.82)] text-white/50 shadow-lg shadow-black/25 backdrop-blur-xl transition',
            isMobileSidebarOpen ? 'opacity-0' : 'opacity-100',
          )}
          onClick={() => setIsMobileSidebarOpen(true)}
          aria-hidden={isMobileSidebarOpen}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>

      {isMobileSidebarOpen || isDraggingMobileSidebar ? (
        <button
          type="button"
          aria-label="Dong thanh dieu huong"
          className="fixed inset-0 z-[91] bg-black/55 backdrop-blur-[2px] md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      ) : null}

      <motion.aside
        initial={false}
        animate={{ x: isMobileSidebarOpen ? 0 : -MOBILE_SIDEBAR_WIDTH }}
        transition={isDraggingMobileSidebar ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 34, mass: 0.8 }}
        drag="x"
        dragDirectionLock
        dragMomentum={false}
        dragElastic={0.03}
        dragConstraints={{ left: -MOBILE_SIDEBAR_WIDTH, right: 0 }}
        dragListener={isMobileSidebarOpen}
        onDragStart={handleMobileSidebarDragStart}
        onDragEnd={handleMobileSidebarDragEnd}
        className="fixed inset-y-0 left-0 z-[92] flex w-[280px] flex-col border-r border-white/10 bg-[rgba(10,25,47,0.92)] px-3 py-6 shadow-2xl shadow-black/35 backdrop-blur-xl [touch-action:pan-y] [will-change:transform] md:hidden"
      >
        <div className="mb-8 flex items-center gap-3 rounded-2xl px-3 py-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-pink-500 shadow-lg shadow-orange-500/30">
            <span className="text-xl font-bold">NC</span>
          </div>
          <div className="min-w-0">
            <p className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-xl font-bold tracking-tight text-transparent">
              NamCy
            </p>
            <p className="text-xs text-white/55">Keo ra de xem nav, keo vao de an</p>
          </div>
        </div>

        <nav className="no-scrollbar flex-1 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => (
            <NavLink
              key={`mobile-${item.path}`}
              to={item.path}
              onClick={() => setIsMobileSidebarOpen(false)}
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
                        'h-5 w-5 shrink-0 transition-transform duration-300',
                        isActive ? 'scale-110' : 'group-hover:scale-110',
                      )}
                    />
                  ) : null}
                  <span className="truncate font-medium">{item.label}</span>
                  {isActive ? (
                    <motion.div
                      layoutId="activeMobileNav"
                      className="absolute left-0 h-8 w-1 rounded-r-full bg-orange-500"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div
          className="absolute right-0 top-1/2 flex h-28 w-5 -translate-y-1/2 translate-x-1/2 cursor-ew-resize items-center justify-center rounded-full border border-white/10 bg-[rgba(10,25,47,0.88)] text-white/45 shadow-lg shadow-black/25"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize mobile navigation"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      </motion.aside>

      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1, width: sidebarWidth }}
        transition={{
          x: { duration: 0.35 },
          opacity: { duration: 0.35 },
          width: isDraggingSidebar ? { duration: 0 } : { type: 'spring', stiffness: 220, damping: 28 },
        }}
        className="relative z-40 hidden h-full shrink-0 overflow-hidden md:block"
      >
        {!isSidebarCollapsed ? (
          <div className="flex h-full flex-col border-r border-white/10 bg-[rgba(10,25,47,0.5)] px-3 py-6 backdrop-blur-xl">
            <div
              className={cn(
                'mb-8 flex items-center gap-3 rounded-2xl px-3 py-2',
                shouldShowLabels ? 'justify-start' : 'justify-center',
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-pink-500 shadow-lg shadow-orange-500/30">
                <span className="text-xl font-bold">NC</span>
              </div>
              {shouldShowLabels ? (
                <div className="min-w-0">
                  <p className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-xl font-bold tracking-tight text-transparent">
                    NamCy
                  </p>
                  <p className="text-xs text-white/55">Thanh dieu huong module</p>
                </div>
              ) : null}
            </div>

            <nav className="no-scrollbar flex-1 space-y-2 overflow-y-auto">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center rounded-xl py-3 transition-all duration-300',
                      shouldShowLabels ? 'gap-4 px-4' : 'justify-center px-2',
                      isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white',
                    )
                  }
                  title={item.label}
                >
                  {({ isActive }) => (
                    <>
                      {item.icon ? (
                        <item.icon
                          className={cn(
                            'h-5 w-5 shrink-0 transition-transform duration-300',
                            isActive ? 'scale-110' : 'group-hover:scale-110',
                          )}
                        />
                      ) : null}
                      {shouldShowLabels ? <span className="truncate font-medium">{item.label}</span> : null}
                      {isActive ? (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute left-0 h-8 w-1 rounded-r-full bg-orange-500"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      ) : null}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        ) : null}
      </motion.aside>

      <div
        className={cn(
          'group relative z-40 hidden h-full w-5 shrink-0 cursor-col-resize items-center justify-center md:flex',
          isDraggingSidebar ? 'select-none' : '',
        )}
        onPointerDown={handleSidebarDragStart}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize navigation"
      >
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/10 transition-colors group-hover:bg-orange-400/70" />
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleSidebarToggle();
          }}
          className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[rgba(10,25,47,0.78)] text-white/70 shadow-lg shadow-black/20 backdrop-blur-xl transition hover:border-orange-400/60 hover:text-white"
          aria-label={isSidebarCollapsed ? 'Mo thanh dieu huong' : 'An thanh dieu huong'}
          title={isSidebarCollapsed ? 'Mo thanh dieu huong' : 'An thanh dieu huong'}
        >
          {isSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
        <GripVertical className="pointer-events-none absolute bottom-6 h-4 w-4 text-white/30 transition group-hover:text-orange-200/80" />
      </div>

      <main className="relative z-10 min-w-0 flex-1 px-4 pb-40 pt-4 md:h-full md:overflow-y-auto md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="h-full max-w-7xl mx-auto"
        >
          {children}
        </motion.div>
      </main>

      <MusicPlayer />
    </div>
  );
}
