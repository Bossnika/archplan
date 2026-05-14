// src/lib/uploadService.js — upload fișiere la Cloudflare R2 via Worker
import { auth } from './firebase.js'

const UPLOAD_URL = import.meta.env.VITE_UPLOAD_WORKER_URL

export async function uploadFile(file, uid, projectId, context = 'general') {
  if (!UPLOAD_URL) throw new Error('VITE_UPLOAD_WORKER_URL nedefinit')

  const token = await auth.currentUser.getIdToken()

  const form = new FormData()
  form.append('file', file)
  form.append('uid', uid)
  form.append('projectId', projectId)
  form.append('context', context)

  const res = await fetch(UPLOAD_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Upload eșuat')
  return data // { url, name, size, key }
}
