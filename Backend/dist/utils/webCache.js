"use strict";
// No-op cache layer.
//
// Redis was removed from the project per product requirements. This module is
// intentionally kept (with its original signatures) so existing call sites in
// the website service compile without edits. Every "cache" call now just
// invokes the loader directly — the data is always live from Postgres.
Object.defineProperty(exports, "__esModule", { value: true });
exports.WEB_CACHE_TTL = void 0;
exports.getCache = getCache;
exports.setCache = setCache;
exports.withCache = withCache;
exports.invalidateCache = invalidateCache;
exports.invalidatePattern = invalidatePattern;
async function getCache(_key) {
    return null;
}
async function setCache(_key, _value, _ttlSeconds) {
    return;
}
async function withCache(_key, _ttlSeconds, loader) {
    return loader();
}
async function invalidateCache(_keys) {
    return;
}
async function invalidatePattern(_pattern) {
    return;
}
exports.WEB_CACHE_TTL = {
    HOME: 0,
    CATEGORIES_LIST: 0,
    CATEGORY_DETAIL: 0,
    PRODUCT_LIST: 0,
    PRODUCT_DETAIL: 0,
    SEARCH_SUGGEST: 0,
    PRODUCT_COUNT: 0,
};
//# sourceMappingURL=webCache.js.map