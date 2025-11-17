import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

let pdfjsLibPromise: Promise<typeof import('pdfjs-dist')> | null = null;

const loadPdfJs = async () => {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = (async () => {
      const pdfjsLib = await import('pdfjs-dist');

      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        try {
          const workerModule = await import('pdfjs-dist/build/pdf.worker.min.mjs');
          const workerSrc =
            typeof workerModule === 'string'
              ? workerModule
              : (workerModule as { default: unknown }).default;

          if (typeof workerSrc === 'string') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
          }
        } catch (error) {
          // Fallback: disable worker if module loading fails
          pdfjsLib.GlobalWorkerOptions.workerSrc = '';
        }
      }

      return pdfjsLib;
    })();
  }

  return pdfjsLibPromise;
};

export const getPdfPageCount = async (file: File): Promise<number> => {
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });

  let document: PDFDocumentProxy | undefined;

  try {
    document = await loadingTask.promise;
    return document.numPages;
  } finally {
    document?.destroy();
  }
};

