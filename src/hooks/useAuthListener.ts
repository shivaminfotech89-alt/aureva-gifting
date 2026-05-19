import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { useEffect, useRef } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';

export function useAuthListener() {
  const setUser = useAuthStore((state) => state.setUser);
  const setProfile = useAuthStore((state) => state.setProfile);
  const setLoading = useAuthStore((state) => state.setLoading);
  const adminUnsubRef = useRef<() => void>(null);

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
            
            let currentProfile: any;
            
            // Default logic
            if (userDoc.exists()) {
              currentProfile = userDoc.data();
            } else {
              currentProfile = {
                uid: user.uid,
                email: user.email,
                name: user.displayName || '',
                role: 'customer',
                createdAt: Date.now(),
                updatedAt: Date.now()
              };
            }
            
            // Base hardcoded admins
            const isHardcodedAdmin = ['shivaminfotech89@gmail.com', 'aurevagifts@gmail.com'].includes(user.email || '');

            const updateProfileWithAdminData = async (adminData: any) => {
               if (!isMounted) return;
               
               let isAdmin = isHardcodedAdmin;
               let adminRoleValue = isHardcodedAdmin ? 'Super Admin' : undefined;

               if (adminData && adminData.status === 'Active') {
                  isAdmin = true;
                  adminRoleValue = adminData.role || 'Super Admin';
               } else if (adminData && adminData.status !== 'Active') {
                  // Explicitly disabled
                  isAdmin = false;
               }

               if (isAdmin) {
                 currentProfile.role = 'admin';
                 currentProfile.adminRole = adminRoleValue;
               } else {
                 currentProfile.role = 'customer';
                 currentProfile.adminRole = null;
               }

               // Save and update state
               await setDoc(userDocRef, currentProfile, { merge: true });
               setProfile({...currentProfile});
            };

            // Setup real-time listener for admin_settings
            if (user.email) {
               if (adminUnsubRef.current) adminUnsubRef.current();
               
               const adminRef = doc(db, 'admin_settings', user.email);
               
               // First fetch to avoid UI flicker
               const adminDoc = await getDoc(adminRef);
               await updateProfileWithAdminData(adminDoc.exists() ? adminDoc.data() : null);

               adminUnsubRef.current = onSnapshot(adminRef, (docSnap) => {
                  updateProfileWithAdminData(docSnap.exists() ? docSnap.data() : null);
               });
            } else {
               await updateProfileWithAdminData(null);
            }
          };

          await Promise.race([
             fetchProfileTask(),
             new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
          ]);
        } catch (error) {
          console.error("Auth listener error:", error);
          // Set a fallback profile to prevent being entirely blocked
          const isHardcodedAdmin = ['shivaminfotech89@gmail.com', 'aurevagifts@gmail.com'].includes(user.email || '');
          setProfile({
            uid: user.uid,
            email: user.email || '',
            name: user.displayName || '',
            role: isHardcodedAdmin ? 'admin' : 'customer'
          });
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        if (adminUnsubRef.current) adminUnsubRef.current();
        setProfile(null);
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimeout);
      if (adminUnsubRef.current) adminUnsubRef.current();
      unsubscribe();
    };
  }, [setUser, setProfile, setLoading]);
}
