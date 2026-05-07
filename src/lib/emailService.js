// src/lib/emailService.js — notificări email via SendGrid (prin Firebase Functions)
import { getFunctions, httpsCallable } from 'firebase/functions'

const functions = getFunctions()

/**
 * Trimite email de notificare la @menționare.
 * Client → Firebase Cloud Function (functions/index.js) → SendGrid API
 *
 * @param {object} params
 * @param {string} params.toEmail      - emailul destinatarului
 * @param {string} params.toName       - numele destinatarului
 * @param {string} params.mentionedBy  - numele celui care a menționat
 * @param {string} params.projectName  - numele proiectului
 * @param {string} params.channel      - id-ul canalului (general/cu/avize/pt/ac)
 * @param {string} params.messageText  - textul mesajului
 * @param {string} params.projectId    - id-ul proiectului
 */
export async function sendMentionEmail(params) {
  try {
    const notify = httpsCallable(functions, 'notifyMention')
    await notify(params)
  } catch (err) {
    // Non-blocking — chat-ul funcționează și fără email
    console.warn('Email mention notification failed (non-critical):', err.message)
  }
}
