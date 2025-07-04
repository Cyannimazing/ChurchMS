// Utility functions for table search, filter, and pagination

/**
 * Filter data based on search query
 * @param {Array} data - Array of data objects
 * @param {string} searchQuery - Search query string
 * @param {Array} searchFields - Array of field names to search in
 * @returns {Array} Filtered data
 */
export const filterData = (data, searchQuery, searchFields) => {
  if (!searchQuery || !searchQuery.trim()) {
    return data;
  }

  const query = searchQuery.toLowerCase().trim();
  
  return data.filter(item => {
    return searchFields.some(field => {
      const value = getNestedValue(item, field);
      return value && value.toString().toLowerCase().includes(query);
    });
  });
};

/**
 * Get nested object value using dot notation
 * @param {Object} obj - Object to search in
 * @param {string} path - Dot notation path (e.g., 'user.profile.name')
 * @returns {any} Value at the path
 */
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

/**
 * Paginate data
 * @param {Array} data - Array of data to paginate
 * @param {number} currentPage - Current page number (1-based)
 * @param {number} itemsPerPage - Number of items per page
 * @returns {Object} Paginated data and pagination info
 */
export const paginateData = (data, currentPage, itemsPerPage) => {
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    pagination: {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
    }
  };
};

/**
 * Filter and paginate data in one function
 * @param {Array} data - Array of data objects
 * @param {string} searchQuery - Search query string
 * @param {Array} searchFields - Array of field names to search in
 * @param {number} currentPage - Current page number (1-based)
 * @param {number} itemsPerPage - Number of items per page
 * @returns {Object} Filtered and paginated data with pagination info
 */
export const filterAndPaginateData = (data, searchQuery, searchFields, currentPage, itemsPerPage) => {
  const filteredData = filterData(data, searchQuery, searchFields);
  return paginateData(filteredData, currentPage, itemsPerPage);
};
