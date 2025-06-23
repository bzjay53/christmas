const admin = require('firebase-admin');
const path = require('path');

let firebaseApp;

const initializeFirebase = () => {
    if (firebaseApp) {
        return firebaseApp;
    }

    try {
        // 서비스 계정 키 파일 경로
        const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');
        
        // 환경 변수 또는 서비스 계정 파일 사용
        let credential;
        
        if (process.env.FIREBASE_PRIVATE_KEY) {
            // 환경 변수를 통한 설정 (Docker 권장)
            const serviceAccount = {
                type: "service_account",
                project_id: process.env.FIREBASE_PROJECT_ID,
                private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                client_email: process.env.FIREBASE_CLIENT_EMAIL,
                client_id: process.env.FIREBASE_CLIENT_ID,
                auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
                token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token"
            };
            credential = admin.credential.cert(serviceAccount);
        } else {
            // 서비스 계정 파일 사용
            credential = admin.credential.cert(serviceAccountPath);
        }

        firebaseApp = admin.initializeApp({
            credential: credential,
            projectId: process.env.FIREBASE_PROJECT_ID
        });

        console.log('🔥 Firebase Admin initialized successfully');
        
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error.message);
        
        // 개발 환경에서는 에러를 던지지 않고 mock 모드로 진행
        if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️  Running in mock mode without Firebase');
            return null;
        }
        
        throw error;
    }

    return firebaseApp;
};

// Firebase 서비스 인스턴스
const getFirestore = () => {
    const app = initializeFirebase();
    return app ? admin.firestore() : null;
};

const getAuth = () => {
    const app = initializeFirebase();
    return app ? admin.auth() : null;
};

// 사용자 인증 검증
const verifyIdToken = async (idToken) => {
    try {
        const auth = getAuth();
        if (!auth) {
            throw new Error('Firebase Auth not initialized');
        }
        
        const decodedToken = await auth.verifyIdToken(idToken);
        return decodedToken;
    } catch (error) {
        console.error('Token verification failed:', error.message);
        throw new Error('Invalid authentication token');
    }
};

// Firestore 헬퍼 함수들
const createUser = async (userData) => {
    try {
        const db = getFirestore();
        if (!db) {
            throw new Error('Firestore not initialized');
        }

        const userRef = db.collection('users').doc(userData.uid);
        const userDoc = {
            email: userData.email,
            displayName: userData.displayName || 'Christmas Trader',
            portfolioBalance: 100000.00, // 초기 $100k
            availableCash: 100000.00,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastLogin: admin.firestore.FieldValue.serverTimestamp()
        };

        await userRef.set(userDoc, { merge: true });
        
        // 초기 포트폴리오 생성
        const portfolioRef = db.collection('portfolios').doc(userData.uid);
        await portfolioRef.set({
            holdings: {},
            totalValue: 100000.00,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return userDoc;
    } catch (error) {
        console.error('User creation failed:', error);
        throw error;
    }
};

const getUser = async (uid) => {
    try {
        const db = getFirestore();
        if (!db) {
            throw new Error('Firestore not initialized');
        }

        const userDoc = await db.collection('users').doc(uid).get();
        
        if (!userDoc.exists) {
            return null;
        }

        return userDoc.data();
    } catch (error) {
        console.error('Get user failed:', error);
        throw error;
    }
};

const updateUser = async (uid, updateData) => {
    try {
        const db = getFirestore();
        if (!db) {
            throw new Error('Firestore not initialized');
        }

        const userRef = db.collection('users').doc(uid);
        await userRef.update({
            ...updateData,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });

        return true;
    } catch (error) {
        console.error('User update failed:', error);
        throw error;
    }
};

module.exports = {
    initializeFirebase,
    getFirestore,
    getAuth,
    verifyIdToken,
    createUser,
    getUser,
    updateUser,
    admin
};