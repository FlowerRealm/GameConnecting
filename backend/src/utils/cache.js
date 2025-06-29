const cache = new Map();

/**
 * Sets a value in the cache with an optional TTL (Time To Live).
 * @param {string} key - The cache key.
 * @param {*} value - The value to store.
 * @param {number} [ttl=60000] - Time to live in milliseconds (default: 60 seconds).
 */
export function setCache(key, value, ttl = 60000) {
    const expiresAt = Date.now() + ttl;
    cache.set(key, { value, expiresAt });
    // console.log(`Cache set for key: ${key}, expires in ${ttl / 1000}s`);
}

/**
 * Gets a value from the cache. Returns undefined if not found or expired.
 * @param {string} key - The cache key.
 * @returns {*} The cached value or undefined.
 */
export function getCache(key) {
    const entry = cache.get(key);
    if (!entry) {
        return undefined;
    }
    if (Date.now() > entry.expiresAt) {
        cache.delete(key); // Expired, remove it
        // console.log(`Cache expired for key: ${key}`);
        return undefined;
    }
    // console.log(`Cache hit for key: ${key}`);
    return entry.value;
}

/**
 * Deletes a value from the cache.
 * @param {string} key - The cache key to delete.
 */
export function deleteCache(key) {
    // console.log(`Cache deleted for key: ${key}`);
    cache.delete(key);
}

/**
 * Clears all entries from the cache.
 */
export function clearCache() {
    // console.log('Cache cleared');
    cache.clear();
}
