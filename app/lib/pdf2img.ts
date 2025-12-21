import { ERROR_MESSAGES, PDF_CONVERSION } from './constants';

export interface PdfConversionResult {
  imageUrl: string;
  file: File | null;
  error?: string;
}

let pdfjsLib: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
  if (pdfjsLib) return pdfjsLib;
  if (loadPromise) return loadPromise;

  isLoading = true;
  // @ts-expect-error - pdfjs-dist/build/pdf.mjs is not a module
  loadPromise = import('pdfjs-dist/build/pdf.mjs')
    .then((lib) => {
      // Worker file is automatically copied from node_modules by vite-plugin-static-copy
      // This ensures version matching between library and worker
      lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

      pdfjsLib = lib;
      isLoading = false;
      return lib;
    })
    .catch((err) => {
      isLoading = false;
      loadPromise = null;
      console.error('Failed to load PDF.js:', err);
      throw new Error(
        `Failed to load PDF.js library: ${err instanceof Error ? err.message : String(err)}`,
      );
    });

  return loadPromise;
}

export async function convertPdfToImage(file: File): Promise<PdfConversionResult> {
  try {
    // Validate file
    if (!file || file.type !== 'application/pdf') {
      return {
        imageUrl: '',
        file: null,
        error: ERROR_MESSAGES.INVALID_FILE_TYPE,
      };
    }

    // Load PDF.js library
    const lib = await loadPdfJs();
    if (!lib) {
      return {
        imageUrl: '',
        file: null,
        error: ERROR_MESSAGES.FAILED_TO_LOAD_PDF,
      };
    }

    // Convert file to array buffer and load PDF
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;

    // Get first page
    const page = await pdf.getPage(1);

    // Create canvas and context
    const viewport = page.getViewport({ scale: PDF_CONVERSION.SCALE_FACTOR });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      return {
        imageUrl: '',
        file: null,
        error: ERROR_MESSAGES.CANVAS_NOT_SUPPORTED,
      };
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Configure context
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    // Render PDF page to canvas
    await page.render({ canvasContext: context, viewport }).promise;

    // Convert canvas to blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Create a File from the blob with the same name as the pdf
            const originalName = file.name.replace(/\.pdf$/i, '');
            const imageFile = new File([blob], `${originalName}.png`, {
              type: PDF_CONVERSION.IMAGE_FORMAT,
            });

            resolve({
              imageUrl: URL.createObjectURL(blob),
              file: imageFile,
            });
          } else {
            resolve({
              imageUrl: '',
              file: null,
              error: ERROR_MESSAGES.FAILED_TO_CREATE_BLOB,
            });
          }
        },
        PDF_CONVERSION.IMAGE_FORMAT,
        PDF_CONVERSION.IMAGE_QUALITY,
      );
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('PDF conversion error:', err);
    return {
      imageUrl: '',
      file: null,
      error: `Failed to convert PDF to image: ${errorMessage}`,
    };
  }
}
