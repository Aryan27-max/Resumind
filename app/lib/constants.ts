/**
 * Application Constants
 * Centralized configuration values for the application
 */

// PDF Conversion Settings
export const PDF_CONVERSION = {
  /** Scale factor for PDF to image conversion (higher = better quality but larger file) */
  SCALE_FACTOR: 4,
  /** Output image format */
  IMAGE_FORMAT: 'image/png' as const,
  /** Image quality (0-1 for JPEG, ignored for PNG) */
  IMAGE_QUALITY: 1.0,
} as const;

// UI Dimensions
export const UI_DIMENSIONS = {
  /** Resume card image height on desktop (px) */
  RESUME_CARD_HEIGHT_DESKTOP: 350,
  /** Resume card image height on mobile (px) */
  RESUME_CARD_HEIGHT_MOBILE: 200,
  /** Maximum file size for uploads (bytes) */
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

// KV Store Prefixes
export const KV_PREFIXES = {
  /** Prefix for resume data keys */
  RESUME: 'resume:',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  PUTER_NOT_AVAILABLE: 'Puter.js not available',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload a PDF file.',
  FAILED_TO_LOAD_PDF: 'Failed to load PDF.js library',
  CANVAS_NOT_SUPPORTED: 'Failed to get canvas context. Canvas 2D rendering is not supported.',
  FAILED_TO_CREATE_BLOB: 'Failed to create image blob from canvas',
  SIGN_IN_REQUIRED: 'Error: Please sign in to analyze resumes',
  UPLOAD_FAILED: 'Error: Failed to upload PDF',
  THUMBNAIL_FAILED: 'Error: Failed to create thumbnail',
  THUMBNAIL_UPLOAD_FAILED: 'Error: Failed to upload thumbnail',
  AI_UNAVAILABLE: 'Error: Failed to analyze resume. AI service unavailable.',
  FILE_SIZE_EXCEEDED: 'File size exceeds maximum limit',
} as const;

// Timeouts and Intervals
export const TIMEOUTS = {
  /** Timeout for Puter.js initialization (ms) */
  PUTER_INIT_TIMEOUT: 10000,
  /** Interval for checking Puter.js availability (ms) */
  PUTER_CHECK_INTERVAL: 100,
} as const;
