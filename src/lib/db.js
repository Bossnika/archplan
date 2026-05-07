// src/lib/db.js  — Firestore CRUD + real-time listeners
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, serverTimestamp, getDoc, setDoc
} from 'firebase/firestore'
import { db } from './firebase.js'

// ── PROJECTS ─────────────────────────────────────────────────────────────────
export const projectsCol = (uid) => collection(db, 'users', uid, 'projects')

export const listenProjects = (uid, cb) =>
  onSnapshot(query(projectsCol(uid), orderBy('createdAt', 'desc')), snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))))

export const createProject = (uid, data) =>
  addDoc(projectsCol(uid), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })

export const updateProject = (uid, projectId, data) =>
  updateDoc(doc(db, 'users', uid, 'projects', projectId), { ...data, updatedAt: serverTimestamp() })

export const deleteProject = (uid, projectId) =>
  deleteDoc(doc(db, 'users', uid, 'projects', projectId))

// ── REMINDERS ─────────────────────────────────────────────────────────────────
export const remindersCol = (uid) => collection(db, 'users', uid, 'reminders')

export const listenReminders = (uid, cb) =>
  onSnapshot(query(remindersCol(uid), orderBy('date', 'asc')), snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))))

export const createReminder = (uid, data) =>
  addDoc(remindersCol(uid), { ...data, createdAt: serverTimestamp() })

export const updateReminder = (uid, remId, data) =>
  updateDoc(doc(db, 'users', uid, 'reminders', remId), data)

export const deleteReminder = (uid, remId) =>
  deleteDoc(doc(db, 'users', uid, 'reminders', remId))

// ── USER PROFILE (push token, theme, Drive folder) ────────────────────────────
export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid, 'profile', 'main'))
  return snap.exists() ? snap.data() : {}
}

export const saveUserProfile = (uid, data) =>
  setDoc(doc(db, 'users', uid, 'profile', 'main'), data, { merge: true })

// ── CHAT MESSAGES ─────────────────────────────────────────────────────────────
export const messagesCol = (uid, projectId, channel='general') =>
  collection(db, 'users', uid, 'projects', projectId, 'channels', channel, 'messages')

export const listenMessages = (uid, projectId, channel='general', cb) =>
  onSnapshot(
    query(messagesCol(uid, projectId, channel), orderBy('createdAt', 'asc')),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )

export const sendMessage = (uid, projectId, channel='general', data) =>
  addDoc(messagesCol(uid, projectId, channel), { ...data, createdAt: serverTimestamp() })

export const deleteMessage = (uid, projectId, channel='general', msgId) =>
  deleteDoc(doc(db, 'users', uid, 'projects', projectId, 'channels', channel, 'messages', msgId))

// ── PROJECT MEMBERS ───────────────────────────────────────────────────────────
export const membersCol = (uid, projectId) =>
  collection(db, 'users', uid, 'projects', projectId, 'members')

export const listenMembers = (uid, projectId, cb) =>
  onSnapshot(membersCol(uid, projectId), snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))))

export const addMember = (uid, projectId, data) =>
  addDoc(membersCol(uid, projectId), { ...data, addedAt: serverTimestamp() })

export const removeMember = (uid, projectId, memberId) =>
  deleteDoc(doc(db, 'users', uid, 'projects', projectId, 'members', memberId))
