import React, { useCallback, useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TitleBar } from './components/TitleBar';
import { Synth } from './components/Synth';
import { CloseConfirmDialog } from './components/close-confirm-dialog';
import { ThemeBackdrop } from './components/theme-backdrop';
import { NavToggle } from './components/nav-toggle';
import { LiveView } from './components/live/live-view';
import { LiveProvider, useLive } from './contexts/live-context';
import { ThemeProvider } from './contexts/theme-context';
import { NavProvider } from './contexts/nav-context';

function Shell() {
  const { view, beginShutdown } = useLive();
  const [closeOpen, setCloseOpen] = useState(false);
  const [closeBusy, setCloseBusy] = useState(false);

  useEffect(() => {
    const off = window.electronAPI?.onCloseRequested?.(() => {
      setCloseBusy(false);
      setCloseOpen(true);
    });
    return () => off?.();
  }, []);

  const cancelClose = useCallback(() => {
    if (closeBusy) return;
    setCloseOpen(false);
    window.electronAPI?.cancelClose?.();
  }, [closeBusy]);

  const confirmClose = useCallback(async () => {
    if (closeBusy) return;
    setCloseBusy(true);
    try {
      await beginShutdown();
      if (window.electronAPI?.confirmQuit) {
        await window.electronAPI.confirmQuit();
        return;
      }
      setCloseOpen(false);
      setCloseBusy(false);
    } catch (err) {
      console.error(err);
      setCloseBusy(false);
    }
  }, [beginShutdown, closeBusy]);

  return (
    <div className="h-screen w-screen overflow-hidden text-white font-display font-extralight subpixel-antialiased">
      <ThemeBackdrop />
      <div className="relative z-10 flex h-full flex-col">
        <TitleBar onRequestClose={() => setCloseOpen(true)} />
        <div className="relative flex min-h-0 flex-1">
          <Sidebar />
          <NavToggle />
          <main className="relative z-30 min-w-0 flex-1">
            {view === 'voce' ? <Synth /> : <LiveView />}
          </main>
        </div>
      </div>
      <CloseConfirmDialog
        open={closeOpen}
        busy={closeBusy}
        onCancel={cancelClose}
        onConfirm={() => void confirmClose()}
      />
    </div>
  );
}

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LiveProvider>
        <NavProvider>
          <Shell />
        </NavProvider>
      </LiveProvider>
    </ThemeProvider>
  );
};
