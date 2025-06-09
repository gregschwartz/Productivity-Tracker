/**
 * API utility functions for the productivity tracker frontend
 */

/**
 * Get the API base URL from environment variables or use default
 * @returns {string} The API base URL
 */
export const getApiUrl = () => {
  return process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
};

/**
 * Make a fetch request with error handling
 * @param {string} endpoint - The API endpoint (relative to base URL)
 * @param {object} options - Fetch options
 * @returns {Promise<any>} The response data
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${getApiUrl()}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, mergedOptions);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request to ${url} failed:`, error);
    throw error;
  }
};

/**
 * GET request helper
 * @param {string} endpoint - The API endpoint
 * @returns {Promise<any>} The response data
 */
export const apiGet = (endpoint) => {
  return apiRequest(endpoint, { method: 'GET' });
};

/**
 * POST request helper
 * @param {string} endpoint - The API endpoint
 * @param {any} data - The data to send
 * @returns {Promise<any>} The response data
 */
export const apiPost = (endpoint, data) => {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * PUT request helper
 * @param {string} endpoint - The API endpoint
 * @param {any} data - The data to send
 * @returns {Promise<any>} The response data
 */
export const apiPut = (endpoint, data) => {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * DELETE request helper
 * @param {string} endpoint - The API endpoint
 * @returns {Promise<any>} The response data
 */
export const apiDelete = (endpoint) => {
  return apiRequest(endpoint, { method: 'DELETE' });
};
