// src/lib/uploadService.js — upload fișiere la Firebase Storage
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase.js'

export async function uploadFile(file, uid, projectId, context = 'general') {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `users/${uid}/projects/${projectId}/${context}/${Date.now()}_${safeName}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  const url = await getDownloadURL(storageRef)
  return { url, name: file.name, size: file.size }
}
