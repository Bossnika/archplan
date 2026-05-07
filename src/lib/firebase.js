// src/lib/firebase.js
// ─────────────────────────────────────────────────────────────────────────────
// SETUP INSTRUCTIONS:
//   1. Mergi la https://console.firebase.google.com
//   2. Creează proiect nou "archplan-studio-kolectiv"
//   3. Activează: Authentication, Firestore Database, Storage
//   4. În Authentication → Sign-in method → activează Google + Email/Password
//   5. Copiază configurația din Project Settings → Your apps → Web app
//   6. Înlocuiește valorile de mai jos cu cele reale
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey:            "REPLACE_WITH_YOUR_API_KEY",
  authDomain:        "REPLACE_WITH_YOUR_AUTH_DOMAIN",
  projectId:         "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket:     "REPLACE_WITH_YOUR_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_WITH_YOUR_MESSAGING_SENDER_ID",
  appId:             "REPLACE_WITH_YOUR_APP_ID",
  measurementId:     "REPLACE_WITH_YOUR_MEASUREMENT_ID"
}

const app       = initializeApp(firebaseConfig)
export const auth      = getAuth(app)
export const db        = getFirestore(app)
export const storage   = getStorage(app)
export const googleProvider = new GoogleAuthProvider()

// ── Push Notifications (Firebase Cloud Messaging) ──────────────────────────
export let messaging = null
try {
  messaging = getMessaging(app)
} catch (e) {
  console.warn('FCM not supported in this browser')
}

// VAPID key din Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
const VAPID_KEY = "REPLACE_WITH_YOUR_VAPID_KEY"

export async function requestPushPermission() {
  if (!messaging) return null
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null
    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    return token
  } catch (err) {
    console.error('Push permission error:', err)
    return null
  }
}

export function onPushMessage(callback) {
  if (!messaging) return () => {}
  return onMessage(messaging, callback)
}
