import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * The shop's category names.
 *
 * The navbar used to link to eight hardcoded categories — Drinkware, Office
 * Essentials, Tech Gifts and so on — none of which exist in the catalog, so
 * every one of them opened an empty shop. They come from the categories
 * collection now, which the product import keeps up to date.
 *
 * Reading that collection costs a few dozen tiny documents, unlike deriving
 * the list from the products themselves.
 */
export function useCategories(): { categories: string[]; loading: boolean } {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getDocs(collection(db, 'categories'))
      .then(snap => {
        if (!alive) return;
        const names = snap.docs
          .map(d => String((d.data() as { name?: unknown }).name || '').trim())
          .filter(n => n !== '');
        setCategories([...new Set(names)].sort((a, b) => a.localeCompare(b)));
      })
      .catch(() => {
        // A menu without categories is a menu with fewer links, not a broken
        // page: the Shop link itself still works.
        if (alive) setCategories([]);
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return { categories, loading };
}
