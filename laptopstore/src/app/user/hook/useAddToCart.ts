import { useState } from 'react';
import { useNavigate } from 'react-router';
import { notifyCartUpdated } from '../context/AuthContext';

const API_URL =
  (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:9765/api';

export function useAddToCart() {
  const navigate = useNavigate();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const addToCart = async (productId: number, quantity = 1) => {
    const token =
      localStorage.getItem('authToken') ||
      sessionStorage.getItem('authToken');

    if (!token) {
      navigate('/login');
      return false;
    }

    setLoadingId(productId);
    try {
      const res = await fetch(`${API_URL}/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity }),
      });

      if (res.ok) {
        notifyCartUpdated();
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setLoadingId(null);
    }
  };

  return { addToCart, loadingId };
}