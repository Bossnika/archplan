import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyA7N1i5B_2P6_n1XrNjbTqVwHpJQQblSDY",
  authDomain: "archplan-kolectiv.firebaseapp.com",
  projectId: "archplan-kolectiv",
  storageBucket: "archplan-kolectiv.firebasestorage.app",
  messagingSenderId: "808417198301",
  appId: "1:808417198301:web:96d692121a9d460b761b34",
  measurementId: "G-KSRQ3K2TEF"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

// persistentSingleTabManager works on all platforms including iOS Safari.
// persistentMultipleTabManager requires BroadcastChannel/SharedWorker which
// fails on older iOS and causes the entire cache layer to break silently.
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() }),
})

export const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()
export const messaging = null
export async function requestPushPermission() { return null }
export function onPushMessage() { return () => {} }
