// src/lib/notifications.js
import { requestPushPermission, onPushMessage } from './firebase.js'
import { diffDays, today } from './utils.js'
import { REMINDER_THRESHOLDS } from './constants.js'

// ── Request browser push permission and get FCM token ─────────────────────────
export async function initPush(onSaveToken) {
  const token = await requestPushPermission()
  if (token && onSaveToken) onSaveToken(token)
  return token
}

// ── Listen for foreground push messages ───────────────────────────────────────
export function listenForegroundPush(callback) {
  return onPushMessage((payload) => {
    // Show browser notification manually if app is in foreground
    if (Notification.permission === 'granted') {
      new Notification(payload.notification?.title || 'ArchPlan', {
        body: payload.notification?.body,
        icon: '/logo192.png',
      })
    }
    callback && callback(payload)
  })
}

// ── Check deadlines and show local notifications ───────────────────────────────
// Called on app load — scans all phases/avize and fires browser notifications
export function checkLocalDeadlines(projects, reminders) {
  if (Notification.permission !== 'granted') return

  const todayStr = today()

  // Phases
  for (const project of projects) {
    for (const phase of (project.phases || [])) {
      if (phase.status === 'approved' || phase.status === 'rejected') continue
      const dLeft = diffDays(todayStr, phase.endDate)
      if (REMINDER_THRESHOLDS.includes(dLeft)) {
        new Notification(`⏰ Termen apropriat — ${project.name}`, {
          body: `Faza "${phase.name}" expiră în ${dLeft} zi${dLeft !== 1 ? 'le' : ''}`,
          icon: '/logo192.png',
          tag:  `phase-${phase.phaseId}`,
        })
      }
    }
    // Avize steps
    for (const av of (project.avize || [])) {
      for (const step of (av.steps || [])) {
        if (step.status === 'approved') continue
        const dLeft = diffDays(todayStr, step.date)
        if (REMINDER_THRESHOLDS.includes(dLeft)) {
          new Notification(`📋 Termen aviz — ${project.name}`, {
            body: `"${step.name}" expiră în ${dLeft} zi${dLeft !== 1 ? 'le' : ''}`,
            icon: '/logo192.png',
            tag:  `step-${step.stepId}`,
          })
        }
      }
    }
  }

  // Manual reminders
  for (const rem of (reminders || [])) {
    if (rem.done) continue
    const dLeft = diffDays(todayStr, rem.date)
    if (REMINDER_THRESHOLDS.includes(dLeft)) {
      new Notification(`🔔 Reminder ArchPlan`, {
        body: `${rem.text} — ${dLeft === 0 ? 'AZI' : `în ${dLeft} zi${dLeft !== 1 ? 'le' : ''}`}`,
        icon: '/logo192.png',
        tag:  `rem-${rem.id}`,
      })
    }
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'not-supported'
  if (Notification.permission === 'granted') return 'granted'
  const result = await Notification.requestPermission()
  return result
}
