/*
 * Acrylic - New Tab
 * Copyright (C) 2026 Shreyash Gupta
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3.
 */

/**
 * IndexedDB wrapper for storing user-uploaded video wallpapers.
 * Videos are stored as raw Blobs under a fixed key, persisting
 * across browser sessions and tab opens.
 */

const DB_NAME = 'acrylic-media';
const DB_VERSION = 1;
const STORE_NAME = 'videos';
const VIDEO_KEY = 'user-wallpaper';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Store a video Blob in IndexedDB.
 * @param {Blob} blob - The video file blob to store.
 * @throws {DOMException} QuotaExceededError if storage is full.
 */
export async function saveVideoBlob(blob) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(blob, VIDEO_KEY);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

/**
 * Retrieve the stored video Blob.
 * @returns {Promise<Blob|null>} The video blob, or null if none is stored.
 */
export async function getVideoBlob() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(VIDEO_KEY);
    req.onsuccess = () => { db.close(); resolve(req.result || null); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

/**
 * Delete the stored video Blob.
 */
export async function deleteVideoBlob() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(VIDEO_KEY);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

/**
 * Check if a video Blob exists in storage.
 * @returns {Promise<boolean>}
 */
export async function hasVideoBlob() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).count(VIDEO_KEY);
    req.onsuccess = () => { db.close(); resolve(req.result > 0); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}
