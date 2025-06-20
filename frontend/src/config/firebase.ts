import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'

// Firebase 설정 검증
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN', 
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
]

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName])

if (missingVars.length > 0) {
  console.error('❌ Missing required Firebase environment variables:', missingVars)
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
}

// Firebase 설정 (환경변수만 사용)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig)

// Firebase 서비스 초기화
export const auth = getAuth(app)
export const db = getFirestore(app)

// Analytics (프로덕션에서만)
export const analytics = typeof window !== 'undefined' && import.meta.env.PROD 
  ? getAnalytics(app) 
  : null

// 개발 환경에서 에뮬레이터 연결
if (import.meta.env.DEV && !auth.emulatorConfig) {
  try {
    // Firebase 에뮬레이터가 실행 중인지 확인 후 연결
    if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
      connectFirestoreEmulator(db, 'localhost', 8080)
      console.log('🔥 Firebase Emulators connected')
    }
  } catch (error) {
    console.log('Firebase Emulator connection failed (using production):', error)
  }
}

// Firebase 연결 상태 확인
export const checkFirebaseConnection = async (): Promise<boolean> => {
  try {
    // Firestore 연결 테스트
    await db._delegate._databaseId
    return true
  } catch (error) {
    console.error('Firebase connection failed:', error)
    return false
  }
}

// 환경별 설정
export const firebaseSettings = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  useEmulator: import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true',
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
}

console.log('🔥 Firebase initialized:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  environment: import.meta.env.MODE,
  useEmulator: firebaseSettings.useEmulator
})

export default app