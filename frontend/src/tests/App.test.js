import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App'; // Assuming App.js is in src/
import { ThemeProvider } from '../contexts/ThemeContext'; // Assuming a ThemeContext

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock any components that are heavy or not relevant to App.test.js itself
jest.mock('../components/ProductivityTracker', () => () => <div data-testid="productivity-tracker">ProductivityTracker Mock</div>);

// Mock matchMedia for theme preference testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false, // Default to light mode preference
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});


describe('App Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    // Reset mocks if needed, e.g., theme preference
    window.matchMedia.mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)', // Simulate dark mode if query matches
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  test('renders basic App structure and ProductivityTracker', () => {
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>
    );

    // Check for a main container or element in App
    expect(screen.getByTestId('app-container')).toBeInTheDocument(); // Assuming App.js has data-testid="app-container"

    // Check that ProductivityTracker mock is rendered
    expect(screen.getByTestId('productivity-tracker')).toBeInTheDocument();
    expect(screen.getByText('ProductivityTracker Mock')).toBeInTheDocument();
  });

  test('theme switching functionality (light/dark/Tron)', async () => {
    const user = userEvent.setup();
    render(
      // ThemeProvider is crucial for theme switching
      // It might need to be imported from its actual location
      // For this test, we assume ThemeProvider wraps App and provides a way to switch themes
      // e.g., via a button or select dropdown exposed by a Header component within App.
      // Let's assume there's a component that App renders which has theme switching buttons.
      // We'll need to mock that component or ensure App itself renders these controls.
      // For simplicity, let's assume App renders some theme switch buttons directly or via a child.
      // (This part might need adjustment based on actual App.js structure)
      <App />
    );

    // Assuming App.js (or a child like Header) renders buttons with these specific texts or testids
    // And that the ThemeProvider context causes a change in a data-theme attribute on a main container
    const appContainer = screen.getByTestId('app-container');

    // Initial theme (default or from localStorage)
    // Let's assume default is 'light'. We can check this via an attribute.
    // The ThemeContext should apply a `data-theme` attribute to a top-level element (e.g., app-container)
    expect(appContainer).toHaveAttribute('data-theme', 'light'); // Default

    // Find theme switch buttons (these might be in a Header component)
    // If not directly in App, test will fail. Need to know App structure.
    // For this example, let's assume buttons exist.
    const lightThemeButton = screen.getByRole('button', { name: /light theme/i });
    const darkThemeButton = screen.getByRole('button', { name: /dark theme/i });
    const tronThemeButton = screen.getByRole('button', { name: /tron theme/i });

    await user.click(darkThemeButton);
    expect(appContainer).toHaveAttribute('data-theme', 'dark');
    expect(localStorageMock.getItem('theme')).toBe('dark');

    await user.click(tronThemeButton);
    expect(appContainer).toHaveAttribute('data-theme', 'tron');
    expect(localStorageMock.getItem('theme')).toBe('tron');

    await user.click(lightThemeButton);
    expect(appContainer).toHaveAttribute('data-theme', 'light');
    expect(localStorageMock.getItem('theme')).toBe('light');
  });

  test('initial theme is set from localStorage if available', () => {
    localStorageMock.setItem('theme', 'tron');
    render(<App />);
    const appContainer = screen.getByTestId('app-container');
    expect(appContainer).toHaveAttribute('data-theme', 'tron');
  });

  test('initial theme respects prefers-color-scheme: dark', () => {
    window.matchMedia.mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(<App />);
    const appContainer = screen.getByTestId('app-container');
    // Check if the theme is set to dark by default due to OS preference
    // This depends on ThemeContext logic to check matchMedia
    expect(appContainer).toHaveAttribute('data-theme', 'dark');
  });

   test('initial theme defaults to light if no preference and no localStorage', () => {
    window.matchMedia.mockImplementation(query => ({ // No preference
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    localStorageMock.clear();

    render(<App />);
    const appContainer = screen.getByTestId('app-container');
    expect(appContainer).toHaveAttribute('data-theme', 'light');
  });

});

// Helper component to simulate theme switch buttons if not directly in App
// You might need to adjust App.js to render such a component or mock its children.
// For now, this test assumes such buttons are discoverable.
// If App uses a Header component:
// jest.mock('../components/Header', () => ({ onThemeChange }) => (
//   <div>
//     <button onClick={() => onThemeChange('light')}>Light Theme</button>
//     <button onClick={() => onThemeChange('dark')}>Dark Theme</button>
//     <button onClick={() => onThemeChange('tron')}>Tron Theme</button>
//   </div>
// ));
// And App would need to pass down an onThemeChange prop from ThemeContext.
// Or ThemeContext itself provides a component with these buttons.

// The test for theme switching needs to align with how themes are actually changed:
// - Are there buttons with specific text?
// - Is there a select dropdown?
// - How does ThemeContext expose the theme changing function and current theme?
// - How is the current theme applied to the DOM (e.g., class name, data attribute)?
// The current test assumes buttons and a 'data-theme' attribute on 'app-container'.
// This file 'App.js' (the component) needs to have a data-testid='app-container'
// and the ThemeProvider must apply the data-theme attribute to it.
// For example, in App.js:
// import { useTheme } from './contexts/ThemeContext';
// function App() {
//   const { theme }_ = useTheme();
//   return <div data-testid="app-container" data-theme={theme}>...</div>
// }
// And ThemeContext.js:
// const [theme, setTheme] = useState(() => { /* logic for initial theme */ });
// useEffect(() => { localStorage.setItem('theme', theme); }, [theme]);
// return <ThemeContext.Provider value={{ theme, setTheme }}> {children} </ThemeContext.Provider>

// The actual theme switching mechanism (buttons, select) would call `setTheme` from the context.
// If these controls are in a sub-component like `Header`, that component would use `useTheme`
// to get `setTheme` and `theme`.
// The test needs to interact with these actual controls.
// The provided test above makes a best guess.
// If `App.js` itself doesn't contain the theme switch UI, but a child component does (e.g. `Header`),
// then we should not mock `Header` for the theme switching test, or ensure the mock provides the functionality.
// For the `renders basic App structure` test, mocking `ProductivityTracker` is fine.
// For the theme switching test, if `Header` contains the theme buttons, it should NOT be mocked,
// or its mock must replicate the theme switching buttons.
// The simplest setup is that `App.js` renders `Header` which has the buttons.
// The `ThemeProvider` would be at the root of `App.js` or even in `index.js` wrapping `<App />`.
// I've assumed `ThemeProvider` is used within the test render.
// It might be better to have a `renderWithTheme` helper:
/*
const renderWithTheme = (ui, options) => {
  return render(<ThemeProvider>{ui}</ThemeProvider>, options);
}
// Then use: renderWithTheme(<App />);
*/
// This is implicitly done by wrapping with ThemeProvider in the test.
// The key is that the `App` component, when rendered within `ThemeProvider`,
// will have its `data-testid="app-container"` element's `data-theme` attribute updated.
// The theme buttons are assumed to be part of what App renders.
// If theme buttons are in a `Header` component:
// Inside App.js:
// import Header from './components/Header';
// <div data-testid="app-container" data-theme={theme}>
//   <Header />
//   <ProductivityTracker />
// </div>
// Inside Header.js:
// import { useTheme } from '../contexts/ThemeContext';
// const { theme, setTheme } = useTheme();
// <button onClick={() => setTheme('light')}>Light Theme</button> ... etc.
// This setup would work with the current test.
