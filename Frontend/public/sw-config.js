/**
 * Custom Service Worker Configuration
 * Advanced caching strategies for offline-first functionality
 */

// Cache names
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// Cache strategies
const CACHE_STRATEGIES = {
  // Static assets - Cache first, fallback to network
  STATIC: 'cache-first',
  // API calls - Network first, fallback to cache
  API: 'network-first',
  // Images - Cache first
  IMAGES: 'cache-first',
  // HTML pages - Network first
  PAGES: 'network-first'
};

// URLs to cache immediately
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json'
];

// URLs that should never be cached
const NO_CACHE_URLS = [
  '/api/auth/login',
  '/api/auth/logout'
];

// Maximum cache sizes
const MAX_CACHE_SIZE = {
  STATIC: 50,
  DYNAMIC: 50,
  API: 100,
  IMAGES: 200
};

// Cache time-to-live (in seconds)
const CACHE_TTL = {
  STATIC: 60 * 60 * 24 * 7, // 7 days
  API: 60 * 5, // 5 minutes
  IMAGES: 60 * 60 * 24 * 30 // 30 days
};


