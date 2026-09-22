import axios from 'axios';
import { useEffect, useState } from 'react';
import { BASE_URL } from '../constants';

const usePicklistResponse = () => {
  const [picklistResponse, setPicklistResponse] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [date, setDate] = useState('');

  const fetchPicklistResponse = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${BASE_URL}/picklists/stats`, { date });

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
  }, [date]);

  return { loading, error, picklistResponse, setDate, date };
};

export default usePicklistResponse;
