import { useTheme } from '../contexts/theme-context';

export function ThemeBackdrop() {
  const { theme } = useTheme();
  const { backdrop } = theme;

  return (
    <div className="vocari-stage pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {backdrop === 'quiet' && <div className="vocari-fill" />}
      {backdrop === 'grain' && (
        <>
          <div className="vocari-fill" />
          <div className="vocari-grain" />
        </>
      )}
      {backdrop === 'mist' && (
        <>
          <div className="vocari-fill" />
          <div className="vocari-blob vocari-blob-a" />
          <div className="vocari-blob vocari-blob-b" />
          <div className="vocari-blob vocari-blob-c" />
        </>
      )}
      {backdrop === 'aurora' && (
        <>
          <div className="vocari-fill" />
          <div className="vocari-blob vocari-blob-a vocari-blob-hot" />
          <div className="vocari-blob vocari-blob-b vocari-blob-hot" />
          <div className="vocari-blob vocari-blob-c vocari-blob-hot" />
        </>
      )}
      {backdrop === 'tide' && (
        <>
          <div className="vocari-fill" />
          <div className="vocari-tide" />
        </>
      )}
      <div className="vocari-veil" />
    </div>
  );
}
