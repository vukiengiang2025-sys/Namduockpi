import { doc, setDoc, collection, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from './firebaseUtils';

export const syncMonthToFirestore = async (uid: string, index: number, data: any) => {
  const path = `users/${uid}/months/${index}`;
  try {
    await setDoc(doc(db, path), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const syncNoteToFirestore = async (uid: string, noteId: string, data: any) => {
  const path = `users/${uid}/notes/${noteId}`;
  try {
    await setDoc(doc(db, path), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteNoteFromFirestore = async (uid: string, noteId: string) => {
  const path = `users/${uid}/notes/${noteId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const syncDailyTaskToFirestore = async (uid: string, taskId: string, data: any) => {
  const path = `users/${uid}/dailyTasks/${taskId}`;
  try {
    await setDoc(doc(db, path), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const syncProfileToFirestore = async (uid: string, data: any) => {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, path), { profile: data });
  } catch (error) {
    // If doc doesn't exist, use setDoc
    try {
      await setDoc(doc(db, path), { profile: data }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }
};

export const syncSettingsToFirestore = async (uid: string, data: any) => {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, path), { settings: data });
  } catch (error) {
    try {
      await setDoc(doc(db, path), { settings: data }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }
};

export const syncMemoryToFirestore = async (uid: string, memoryId: string, data: any) => {
  const path = `users/${uid}/memories/${memoryId}`;
  try {
    await setDoc(doc(db, path), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteMemoryFromFirestore = async (uid: string, memoryId: string) => {
  const path = `users/${uid}/memories/${memoryId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};
