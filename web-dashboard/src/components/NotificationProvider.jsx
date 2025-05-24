import React, { useState, createContext, useContext } from 'react'
import { Snackbar, Alert, Slide } from '@mui/material'

const NotificationContext = createContext()

function SlideTransition(props) {
  return <Slide {...props} direction="up" />
}

export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  })
  
  const showNotification = (message, severity = 'info') => {
    console.log('🔔 알림 표시:', message, severity)
    setNotification({
      open: true,
      message,
      severity
    })
  }
  
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }
    setNotification({ ...notification, open: false })
  }
  
  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleClose}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleClose} 
          severity={notification.severity}
          variant="filled"
          sx={{ 
            width: '100%',
            fontWeight: 'bold',
            '& .MuiAlert-message': {
              fontSize: '14px'
            }
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

export default NotificationProvider 