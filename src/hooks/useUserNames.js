// hooks/useUserNames.js
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { USER_API_URL } from '../constants';

const useUserNames = (employeeIds = []) => {
  const [namesMap, setNamesMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchedRef = useRef(new Set());

  useEffect(() => {
    const uniqueIds = [...new Set(employeeIds.filter(Boolean))];
    const toFetch = uniqueIds.filter((id) => !fetchedRef.current.has(id));

    if (!toFetch.length) {
      // nothing to fetch → ensure loading is false
      setLoading(false);
      return;
    }

    toFetch.forEach((id) => fetchedRef.current.add(id));

    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);

      const results = await Promise.allSettled(
        toFetch.map(async (id) => {
          try {
            const res = await axios.get(`${USER_API_URL}/nocodb/user/${id}`);

            const user = Array.isArray(res.data?.data) ? res.data.data[0] : null;

            const rawName = user?.user_name;
            const name =
              typeof rawName === 'string' && rawName.trim()
                ? rawName.split(' / ')[0].trim()
                : 'unknown';

            return { id, name };
          } catch (err) {
            console.error(`Failed to fetch user ${id}:`, err.message);
            return { id, name: 'unknown' };
          }
        })
      );

      if (cancelled) return;

      // even if something weird happened, always resolve to a map
      const safe = results.map((r) =>
        r.status === 'fulfilled' ? r.value : { id: r.reason?.id ?? 'unknown', name: 'unknown' }
      );

      setNamesMap((prev) => {
        const next = { ...prev };
        safe.forEach(({ id, name }) => {
          next[id] = name;
        });
        return next;
      });

      setLoading(false);
    };

    fetchAll().catch((err) => {
      if (!cancelled) {
        console.error('useUserNames fatal:', err);
        setError(err.message);
        setLoading(false); // <-- guarantee reset
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeIds.join(',')]);

  return { namesMap, loading, error };
};

export default useUserNames;
