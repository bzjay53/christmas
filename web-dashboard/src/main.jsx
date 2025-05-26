import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import App from './App.jsx'
import useThemeStore from './store/themeStore.js'

// 다이나믹 테마 컴포넌트
function ThemedApp() {
  const { isDarkMode } = useThemeStore()

  // 다크모드와 라이트모드 테마 설정
  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: '#667eea',
        light: '#9fb3f3',
        dark: '#2d4aa7'
      },
      secondary: {
        main: '#764ba2',
        light: '#a478d1',
        dark: '#4a2073'
      },
      background: {
        default: isDarkMode 
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        paper: isDarkMode 
          ? 'rgba(255, 255, 255, 0.05)'
          : 'rgba(255, 255, 255, 0.9)'
      },
      text: {
        primary: isDarkMode ? '#ffffff' : '#000000',
        secondary: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'
      },
      success: {
        main: '#4caf50'
      },
      error: {
        main: '#f44336'
      },
      warning: {
        main: '#ff9800'
      }
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 600,
        color: isDarkMode ? '#ffffff' : '#000000'
      },
      h6: {
        fontWeight: 500,
        color: isDarkMode ? '#ffffff' : '#000000'
      },
      body1: {
        color: isDarkMode ? '#ffffff' : '#000000'
      },
      body2: {
        color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
      }
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode 
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: isDarkMode 
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.1)',
            color: isDarkMode ? '#ffffff' : '#000000'
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode 
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: isDarkMode 
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.1)',
            color: isDarkMode ? '#ffffff' : '#000000'
          }
        }
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            color: isDarkMode ? '#ffffff' : '#000000'
          }
        }
      },
      MuiListItemText: {
        styleOverrides: {
          primary: {
            color: isDarkMode ? '#ffffff' : '#000000'
          },
          secondary: {
            color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'
          }
        }
      }
    }
  })

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemedApp />
    </BrowserRouter>
  </React.StrictMode>,
) 