import express from 'express';
import app from './backend/app.js';

if (typeof express !== 'function' || typeof app !== 'function' || typeof app.listen !== 'function') {
  throw new TypeError('The Vercel entry point must export an Express application.');
}

export default app;
