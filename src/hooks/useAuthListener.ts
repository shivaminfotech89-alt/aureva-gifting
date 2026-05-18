import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';

export function useAuthListener() {
  const setUser = useAuthStore((state) => state.setUser);
  const setProfile = useAuthStore((state) => state.setProfile);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    let isMounted = true;
    
    // Safety timeout: if auth takes longer than 8 seconds, fallback
    const fallbackTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn("Auth initialization timed out, proceeding safely");
        setLoading(false);
      }
    }, 8000);

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!isMounted) return;
      clearTimeout(fallbackTimeout);
      
      setUser(user);
      if (user) {
        try {
          // Wrap in a promise with timeout to prevent getDoc returning forever offline
          const fetchProfileTask = async () => {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
              const currentProfile = userDoc.data() as any;
              const isAdminEmail = ['shivaminfotech89@gmail.com', 'aurevagifts@gmail.com'].includes(user.email || '');
              if (isAdminEmail && currentProfile.role !== 'admin') {
                currentProfile.role = 'admin';
                await setDoc(userDocRef, currentProfile, { merge: true });
              }
              setProfile(currentProfile);
            } else {
              // New user, create a customer profile (or admin if specific email)
              const isNewAdminEmail = ['shivaminfotech89@gmail.com', 'aurevagifts@gmail.com'].includes(user.email || '');
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
          };

          await Promise.race([
             fetchProfileTask(),
             new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
          ]);
        } catch (error) {
          console.error("Auth listener error:", error);
          // Set a fallback profile to prevent being entirely blocked
          const isNewAdminEmail = ['shivaminfotech89@gmail.com', 'aurevagifts@gmail.com'].includes(user.email || '');
          setProfile({
            uid: user.uid,
            email: user.email || '',
            name: user.displayName || '',
            role: isNewAdminEmail ? 'admin' : 'customer'
          });
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        setProfile(null);
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimeout);
      unsubscribe();
    };
  }, [setUser, setProfile, setLoading]);
}
