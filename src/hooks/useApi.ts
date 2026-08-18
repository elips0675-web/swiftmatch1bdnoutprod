
import { useState, useEffect, useMemo } from 'react';
import { getToken } from '@/lib/token';

// Определяем общие типы для API-хука
interface UseApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown; // Тело запроса
  skip?: boolean; // Пропустить ли выполнение запроса
}

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void; // Функция для повторного выполнения запроса
}

/**
 * Кастомный хук для выполнения запросов к API.
 * @param path - Путь к эндпоинту API (например, '/api/profile/me').
 * @param options - Опции запроса (метод, тело).
 */
export function useApi<T>(path: string, options: UseApiOptions = {}): UseApiState<T> {
  const { method = 'GET', body, skip = false } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0); // Состояние для перезапуска эффекта

  const refetch = () => setTrigger(prev => prev + 1);

  const bodyKey = useMemo(() => JSON.stringify(body), [body]); // Стабильный ключ для зависимости

  useEffect(() => {
    if (skip) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setError('No authentication token found.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(path, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: bodyKey || null,
        });

        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          const errorResult = await response.json();
          setError(errorResult.message || 'API request failed');
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
        setError(errorMessage);
        if (import.meta.env.DEV) console.error(`API call to ${path} failed:`, e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [path, method, bodyKey, skip, trigger]);

  return { data, loading, error, refetch };
}

/**
 * Хук для выполнения мутаций (POST, PUT, DELETE).
 */
export function useApiMutation<T, TBody = unknown>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const mutate = async (path: string, method: 'POST' | 'PUT' | 'DELETE', body: TBody): Promise<T> => {
    setLoading(true);
    setError(null);
    setData(null);

    const token = getToken();
    if (!token) {
      setError('No authentication token found.');
      setLoading(false);
      throw new Error('No authentication token found.');
    }

    try {
      const response = await fetch(path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        setData(result);
        setLoading(false);
        return result;
      } else {
        throw new Error(result.message || `API ${method} request to ${path} failed`);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
      setError(errorMessage);
      setLoading(false);
      if (import.meta.env.DEV) console.error(`API mutation to ${path} failed:`, e);
      throw new Error(errorMessage);
    }
  };

  return { mutate, data, loading, error };
}
