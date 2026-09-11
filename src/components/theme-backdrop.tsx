import { OglField } from './ogl-field';
import { useTheme } from '../contexts/theme-context';

export function ThemeBackdrop() {
  const { theme } = useTheme();
  const paused =
    theme.motion === 'static' ||
    (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  return (
    <div className="vocari-stage pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="vocari-fill" />
      {theme.pattern !== 'quiet' && <OglField theme={theme} paused={paused} />}
      <div className="vocari-blob vocari-blob-a" />
      <div className="vocari-blob vocari-blob-b" />
      <div className="vocari-blob vocari-blob-c" />
      {theme.pattern === 'quiet' && (
        <>
          <div className="vocari-blob vocari-blob-a vocari-blob-hot" />
          <div className="vocari-tide" />
        </>
      )}
    </div>
  );
}
