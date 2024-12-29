import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create context
const AIContext = createContext();

export const useAI = () => {
  return useContext(AIContext);
};

export const AIProvider = ({ children }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cache responses to avoid redundant API calls
  const responseCache = new Map();

  const generateResponse = async (prompt) => {
    // Check if the response is already in cache
    if (responseCache.has(prompt)) {
      return responseCache.get(prompt);
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/generate-response', { prompt });
      const data = response.data;

      // Store the response in cache
      responseCache.set(prompt, data);

      return data;
    } catch (error) {
      setError('Failed to generate response. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch initial suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get('/api/suggestions');
        setSuggestions(response.data);
      } catch (error) {
        setError('Failed to fetch suggestions.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  return (
    <AIContext.Provider value={{ generateResponse, suggestions, isLoading, error }}>
      {children}
    </AIContext.Provider>
  );
};
