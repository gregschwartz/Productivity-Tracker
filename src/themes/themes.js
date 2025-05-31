/**
 * Theme definitions with dark mode support
 * Now simplified to just Ready.net theme (light/dark) and Tron theme for special tasks
 */

// Ready theme (light mode based on Ready.net design)
const readyTheme = {
  name: 'Ready',
  fonts: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'JetBrains Mono', monospace"
  },
  colors: {
    primary: '#7c3aed',
    primaryText: '#ffffff',
    secondary: '#0ea5e9',
    background: '#f8fafc',
    backgroundHover: '#f1f5f9',
    surface: '#ffffff',
    surfaceHover: '#f8fafc',
    border: '#e2e8f0',
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      muted: '#64748b'
    },
    status: {
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0284c7'
    },
    focus: {
      low: '#e0e7ff',
      medium: '#c7d2fe',
      high: '#a5b4fc'
    },
    accent: '#ec4899',
    chart: {
      primary: '#7c3aed',
      secondary: '#0ea5e9',
      tertiary: '#ec4899',
      quaternary: '#059669'
    }
  },
  shadows: {
    small: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    large: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
    full: '9999px'
  }
};

// Ready-Dark theme (dark mode based on Ready.net design)
const readyDarkTheme = {
  ...readyTheme,
  name: 'Ready-Dark',
  colors: {
    primary: '#a855f7',
    primaryText: '#ffffff',
    secondary: '#38bdf8',
    background: '#0f172a',
    backgroundHover: '#1e293b',
    surface: '#1e293b',
    surfaceHover: '#334155',
    border: '#475569',
    text: {
      primary: '#f1f5f9',
      secondary: '#cbd5e1',
      muted: '#94a3b8'
    },
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    },
    focus: {
      low: '#312e81',
      medium: '#4338ca',
      high: '#6366f1'
    },
    accent: '#f472b6',
    chart: {
      primary: '#a855f7',
      secondary: '#38bdf8',
      tertiary: '#f472b6',
      quaternary: '#10b981'
    }
  },
  shadows: {
    small: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    medium: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
    large: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
  }
};

// Tron Legacy inspired theme (Futuristic, high-tech aesthetic) - Dark mode
const tronTheme = {
  name: 'Tron',
  fonts: {
    primary: "'Orbitron', 'JetBrains Mono', monospace",
    mono: "'JetBrains Mono', 'Fira Code', monospace"
  },
  colors: {
    primary: '#00ffff',
    primaryText: '#000000',
    secondary: '#ff6600',
    background: '#000011',
    backgroundHover: '#001122',
    surface: '#001122',
    surfaceHover: '#002233',
    border: '#00ffff',
    text: {
      primary: '#00ffff',
      secondary: '#66ccff',
      muted: '#4499cc'
    },
    status: {
      success: '#00ff00',
      warning: '#ffff00',
      error: '#ff0000',
      info: '#00ffff'
    },
    focus: {
      low: '#003333',
      medium: '#004444',
      high: '#006666'
    },
    accent: '#ff6600',
    neon: {
      cyan: '#00ffff',
      orange: '#ff6600',
      blue: '#0080ff',
      green: '#00ff00',
      pink: '#ff00ff'
    },
    chart: {
      primary: '#00ffff',
      secondary: '#ff6600',
      tertiary: '#00ff00',
      quaternary: '#ff00ff'
    }
  },
  shadows: {
    small: '0 0 5px rgba(0, 255, 255, 0.3)',
    medium: '0 0 10px rgba(0, 255, 255, 0.4), 0 0 20px rgba(0, 255, 255, 0.2)',
    large: '0 0 20px rgba(0, 255, 255, 0.5), 0 0 40px rgba(0, 255, 255, 0.3)'
  },
  borderRadius: {
    small: '2px',
    medium: '4px',
    large: '8px',
    full: '0px'
  },
  glow: {
    small: '0 0 5px currentColor',
    medium: '0 0 10px currentColor, 0 0 20px currentColor',
    large: '0 0 20px currentColor, 0 0 40px currentColor, 0 0 60px currentColor'
  }
};

/**
 * Export themes as a single object
 */
export const themes = {
  Ready: readyTheme,
  'Ready-Dark': readyDarkTheme,
  Tron: tronTheme
}; 