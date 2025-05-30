/**
 * Theme definitions for all four design variants with dark mode support
 */

// Design 1: Elegant (Modern, clean design with soft colors)
const elegantTheme = {
  name: 'elegant',
  fonts: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace"
  },
  colors: {
    primary: '#6366f1',
    primaryText: '#ffffff',
    secondary: '#f59e0b',
    background: '#fefefe',
    backgroundHover: '#f8fafc',
    surface: '#ffffff',
    surfaceHover: '#f1f5f9',
    border: '#e2e8f0',
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
      muted: '#94a3b8'
    },
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    },
    focus: {
      low: '#fef3c7',
      medium: '#fed7aa',
      high: '#fecaca'
    }
  },
  shadows: {
    small: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    large: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  },
  borderRadius: {
    small: '6px',
    medium: '8px',
    large: '12px',
    full: '9999px'
  }
};

// Dark mode variant of elegant theme
const elegantDarkTheme = {
  ...elegantTheme,
  name: 'elegant-dark',
  colors: {
    primary: '#818cf8',
    primaryText: '#ffffff',
    secondary: '#fbbf24',
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
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#60a5fa'
    },
    focus: {
      low: '#374151',
      medium: '#4b5563',
      high: '#6b7280'
    }
  },
  shadows: {
    small: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
    medium: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
    large: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
  }
};

// Design 2: Ready.net inspired (Professional, government/utility aesthetic)
const readyTheme = {
  name: 'ready',
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

// Dark mode variant of ready theme
const readyDarkTheme = {
  ...readyTheme,
  name: 'ready-dark',
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

// Design 3: Ready.net alternative (Professional with different accent)
const readyAltTheme = {
  name: 'readyAlt',
  fonts: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'JetBrains Mono', monospace"
  },
  colors: {
    primary: '#0ea5e9',
    primaryText: '#ffffff',
    secondary: '#7c3aed',
    background: '#f1f5f9',
    backgroundHover: '#e2e8f0',
    surface: '#ffffff',
    surfaceHover: '#f8fafc',
    border: '#cbd5e1',
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
      low: '#fef3c7',
      medium: '#fed7aa',
      high: '#fecaca'
    },
    accent: '#059669',
    chart: {
      primary: '#0ea5e9',
      secondary: '#7c3aed',
      tertiary: '#059669',
      quaternary: '#d97706'
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

// Dark mode variant of readyAlt theme
const readyAltDarkTheme = {
  ...readyAltTheme,
  name: 'readyAlt-dark',
  colors: {
    primary: '#38bdf8',
    primaryText: '#ffffff',
    secondary: '#a855f7',
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
      low: '#374151',
      medium: '#4b5563',
      high: '#6b7280'
    },
    accent: '#10b981',
    chart: {
      primary: '#38bdf8',
      secondary: '#a855f7',
      tertiary: '#10b981',
      quaternary: '#f59e0b'
    }
  },
  shadows: {
    small: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    medium: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
    large: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
  }
};

// Design 4: Tron Legacy inspired (Futuristic, high-tech aesthetic)
const tronTheme = {
  name: 'tron',
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

// Light mode variant of tron theme (inverted colors for contrast)
const tronLightTheme = {
  ...tronTheme,
  name: 'tron-light',
  colors: {
    primary: '#0066cc',
    primaryText: '#ffffff',
    secondary: '#cc4400',
    background: '#f0f8ff',
    backgroundHover: '#e6f2ff',
    surface: '#ffffff',
    surfaceHover: '#f0f8ff',
    border: '#0066cc',
    text: {
      primary: '#003366',
      secondary: '#0066cc',
      muted: '#336699'
    },
    status: {
      success: '#00aa00',
      warning: '#cc9900',
      error: '#cc0000',
      info: '#0066cc'
    },
    focus: {
      low: '#e6f2ff',
      medium: '#cce6ff',
      high: '#99ccff'
    },
    accent: '#cc4400',
    neon: {
      cyan: '#0066cc',
      orange: '#cc4400',
      blue: '#0099ff',
      green: '#00aa00',
      pink: '#cc0099'
    },
    chart: {
      primary: '#0066cc',
      secondary: '#cc4400',
      tertiary: '#00aa00',
      quaternary: '#cc0099'
    }
  },
  shadows: {
    small: '0 0 5px rgba(0, 102, 204, 0.3)',
    medium: '0 0 10px rgba(0, 102, 204, 0.4), 0 0 20px rgba(0, 102, 204, 0.2)',
    large: '0 0 20px rgba(0, 102, 204, 0.5), 0 0 40px rgba(0, 102, 204, 0.3)'
  },
  glow: {
    small: '0 0 5px rgba(0, 102, 204, 0.5)',
    medium: '0 0 10px rgba(0, 102, 204, 0.7), 0 0 20px rgba(0, 102, 204, 0.5)',
    large: '0 0 20px rgba(0, 102, 204, 0.8), 0 0 40px rgba(0, 102, 204, 0.6), 0 0 60px rgba(0, 102, 204, 0.4)'
  }
};

/**
 * Export all themes as a single object with dark mode support
 */
export const themes = {
  elegant: elegantTheme,
  'elegant-dark': elegantDarkTheme,
  ready: readyTheme,
  'ready-dark': readyDarkTheme,
  readyAlt: readyAltTheme,
  'readyAlt-dark': readyAltDarkTheme,
  tron: tronTheme,
  'tron-light': tronLightTheme
}; 