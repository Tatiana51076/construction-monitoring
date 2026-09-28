import { Sun, Moon } from 'lucide-react';

interface Props {
  theme: 'dark' | 'light';
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-border bg-surface-secondary text-content-secondary transition-all hover:bg-surface-tertiary hover:text-content-primary"
      title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
