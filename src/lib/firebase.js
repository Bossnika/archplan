import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { initializeFirestore, memoryLocalCache, enableNetwork, disableNetwork } from 'firebase/firestore'
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

// memoryLocalCache: no IndexedDB — every read/write goes directly to Firestore server.
// Guarantees cross-device consistency: changes appear on all devices as soon as they
// reach the server, with no stale cache masking updates.
// experimentalForceLongPolling: HTTP long-polling instead of WebSocket, avoids the
// 20–30 second WebSocket timeout on mobile/restrictive networks.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: memoryLocalCache(),
})

export const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()
export const messaging = null
export async function requestPushPermission() { return null }
export function onPushMessage() { return () => {} }

// Forces Firestore to drop and immediately re-establish its server connection.
// Call this when the page returns to the foreground so all onSnapshot listeners
// catch up on changes made while the tab was backgrounded/suspended.
export async function forceFirestoreSync() {
  try {
    await disableNetwork(db)
    await enableNetwork(db)
  } catch (_) { /* non-critical */ }
}
