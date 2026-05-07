// src/lib/storageService.js
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './firebase.js'
import { uid } from './utils.js'

/**
 * Upload a file to Firebase Storage
 * @param {string} userId
 * @param {string} projectId
 * @param {string} context  - e.g. 'avize/electrica', 'ac', 'beneficiar'
 * @param {File}   file
 * @param {function} onProgress - cb(0-100)
 * @returns {Promise<{id, name, url, path, uploadedAt}>}
 */
export async function uploadFile(userId, projectId, context, file, onProgress) {
  const fileId   = uid()
  const ext      = file.name.split('.').pop()
  const path     = `users/${userId}/projects/${projectId}/${context}/${fileId}.${ext}`
  const storageRef = ref(storage, path)

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file)
    task.on('state_changed',
      snap => onProgress && onProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        resolve({ id: fileId, name: file.name, url, path, uploadedAt: new Date().toISOString() })
      }
    )
  })
}

/**
 * Delete a file from Firebase Storage by its path
 */
export async function deleteFile(path) {
  try { await deleteObject(ref(storage, path)) }
  catch (e) { console.warn('Delete file error:', e) }
}

/**
 * Accept a Google Drive / Dropbox shared link (no upload needed)
 */
export function makeExternalLink(name, url) {
  return { id: uid(), name, url, path: null, external: true, uploadedAt: new Date().toISOString() }
}
