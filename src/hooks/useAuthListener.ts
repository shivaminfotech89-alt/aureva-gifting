import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';

export function useAuthListener() {
  const setUser = useAuthStore((state) => state.setUser);
  const setProfile = useAuthStore((state) => state.setProfile);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const currentProfile = userDoc.data() as any;
            const isAdminEmail = ['shivaminfotech89@gmail.com', 'aurevagiftingsolution@gmail.com'].includes(user.email || '');
            if (isAdminEmail && currentProfile.role !== 'admin') {
              currentProfile.role = 'admin';
              await setDoc(userDocRef, currentProfile, { merge: true });
            }
            setProfile(currentProfile);
          } else {
            // New user, create a customer profile (or admin if specific email)
            const isNewAdminEmail = ['shivaminfotech89@gmail.com', 'aurevagiftingsolution@gmail.com'].includes(user.email || '');
            const newProfile = {
              uid: user.uid,
              email: user.email,
              name: user.displayName || '',
              role: isNewAdminEmail ? 'admin' : 'customer',
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile as any);
          }
        } catch (error) {
           handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setProfile, setLoading]);
}
