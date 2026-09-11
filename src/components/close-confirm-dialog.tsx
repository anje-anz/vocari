import { useEffect, useRef } from 'react';

type CloseConfirmDialogProps = {
  open: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function CloseConfirmDialog({
  open,
  busy,
  onCancel,
  onConfirm,
}: CloseConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open || busy) return;
    cancelRef.current?.focus();
  }, [open, busy]);

  useEffect(() => {
    if (!open || busy) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 backdrop-blur-sm"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vocari-close-title"
        aria-describedby="vocari-close-copy"
        className="mx-6 w-full max-w-md rounded-xl bg-black/45 p-6 ring-1 ring-cyan-50/25 backdrop-blur-lg"
      >
        <h2 id="vocari-close-title" className="text-xl font-display font-extralight">
          Chiudere Vocari?
        </h2>
        <p id="vocari-close-copy" className="mt-3 text-sm leading-relaxed text-white/75">
          Prima di uscire Vocari ferma la voce, chiude le chat e rilascia l&apos;uscita audio.
          Non staccare mixer, interfacce o cuffie USB mentre si chiude: un taglio a caldo può
          lasciare driver o hardware in uno stato strano. Se Twitch o il TTS non rispondono,
          l&apos;app esce comunque dopo pochi secondi.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-lg px-3 py-2 text-sm ring-1 ring-cyan-50/20 hover:bg-cyan-50/10 disabled:opacity-40"
          >
            Annulla
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="rounded-lg bg-cyan-50/15 px-3 py-2 text-sm ring-1 ring-cyan-50/40 hover:bg-red-400/20 disabled:opacity-40"
          >
            {busy ? 'Chiusura in corso…' : 'Chiudi in sicurezza'}
          </button>
        </div>
      </div>
    </div>
  );
}
