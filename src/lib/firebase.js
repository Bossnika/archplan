import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager, enableNetwork, disableNetwork } from 'firebase/firestore'
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

// persistentLocalCache: renders instantly from IndexedDB on every load, then syncs
// from server in the background. Cross-device sync is handled by the visibility-change
// reconnect in App.jsx (forceFirestoreSync), which forces a fresh server connection
// whenever the tab returns to foreground.
// persistentSingleTabManager: works on iOS (no SharedWorker/BroadcastChannel needed).
// experimentalForceLongPolling: HTTP long-polling avoids 20-30s WebSocket timeout on
// mobile networks.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager(),
  }),
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
