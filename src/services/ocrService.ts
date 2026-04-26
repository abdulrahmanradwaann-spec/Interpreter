import { createWorker } from 'tesseract.js';

export const performOCR = async (imageFile: File | string): Promise<string> => {
  const worker = await createWorker('eng+ara'); // Default to English and Arabic support
  
  try {
    const { data: { text } } = await worker.recognize(imageFile);
    await worker.terminate();
    return text;
  } catch (error) {
    console.error("OCR Error:", error);
    await worker.terminate();
    throw error;
  }
};
