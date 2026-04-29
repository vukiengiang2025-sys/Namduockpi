import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, query, orderBy } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAppStore, DailyTask, Note, Memory } from '../store';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';

export function FirebaseSync() {
  const { setUser, setIsLoading, user } = useAppStore();

  // Listen to Auth State
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
    });

    return () => unsubscribeAuth();
  }, [setUser, setIsLoading]);

  // Sync Data on Login
  useEffect(() => {
    if (!user) {
      // Clear data on logout if needed
      // Actually Zustand persist might keep it, but for a "complete app" 
      // we might want to reset the store on logout.
      return;
    }

    // Listen to Months
    const monthsRef = collection(db, `users/${user.uid}/months`);
    const unsubscribeMonths = onSnapshot(monthsRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const data = change.doc.data();
          const index = parseInt(change.doc.id);
          if (!isNaN(index)) {
             const months = [...useAppStore.getState().months];
             months[index] = { ...months[index], ...data };
             useAppStore.setState({ months });
          }
        }
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/months`);
    });

    // Listen to Daily Tasks
    const tasksRef = collection(db, `users/${user.uid}/dailyTasks`);
    const unsubscribeTasks = onSnapshot(tasksRef, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyTask));
      // Standard sync: Replace local tasks with remote state
      useAppStore.setState({ dailyTasks: tasks });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/dailyTasks`);
    });

    // Listen to Notes
    const notesRef = collection(db, `users/${user.uid}/notes`);
    const unsubscribeNotes = onSnapshot(notesRef, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
      useAppStore.setState({ notes: notes.sort((a, b) => b.createdAt - a.createdAt) });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/notes`);
    });

    // Listen to Memories
    const memoriesRef = collection(db, `users/${user.uid}/memories`);
    const unsubscribeMemories = onSnapshot(memoriesRef, (snapshot) => {
      const memories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Memory));
      useAppStore.setState({ memories: memories.sort((a, b) => b.createdAt - a.createdAt) });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/memories`);
    });

    // Listen to User Root (Profile & Settings)
    const userRef = doc(db, `users/${user.uid}`);
    const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.profile) useAppStore.setState({ userProfile: data.profile });
        if (data.settings) useAppStore.setState({ settings: { ...useAppStore.getState().settings, ...data.settings } });
      } else {
        // Initialize user document if it doesn't exist
        setDoc(userRef, { 
          uid: user.uid, 
          email: user.email, 
          profile: useAppStore.getState().userProfile,
          settings: useAppStore.getState().settings 
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    return () => {
      unsubscribeUser();
      unsubscribeMonths();
      unsubscribeTasks();
      unsubscribeNotes();
      unsubscribeMemories();
    };
  }, [user]);

  return null;
}
