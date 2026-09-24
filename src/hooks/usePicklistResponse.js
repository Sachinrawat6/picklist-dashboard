import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BASE_URL } from '../constants';

const usePicklistResponse = () => {
  const [picklistResponse, setPicklistResponse] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();

  const date = searchParams.get('date') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  const setDate = useCallback(
    (value) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set('date', value);
        else next.delete('date');
        next.delete('startDate');
        next.delete('endDate');
        return next;
      });
    },
    [setSearchParams]
  );

  const setStartDate = useCallback(
    (value) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set('startDate', value);
        else next.delete('startDate');
        next.delete('date');
        return next;
      });
    },
    [setSearchParams]
  );

  const setEndDate = useCallback(
    (value) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set('endDate', value);
        else next.delete('endDate');
        next.delete('date');
        return next;
      });
    },
    [setSearchParams]
  );

  const fetchPicklistResponse = async () => {
    if ((startDate && !endDate) || (!startDate && endDate)) return;

    try {
      setLoading(true);
      setError(null);

      const payload = startDate && endDate ? { startDate, endDate } : date ? { date } : {};

      const response = await axios.post(`${BASE_URL}/picklists/stats`, payload);
      const data = response.data?.data;

      setPicklistResponse(data);
      return data;
    } catch (err) {
      const message = `Failed to fetch picklist response: ${err.message}`;
      setError(message);
      console.error('Failed to fetch picklist response:', err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPicklistResponse();
  }, [date, startDate, endDate]);

  return {
    loading,
    error,
    picklistResponse,
    date,
    setDate,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
  };
};

export default usePicklistResponse;
