import { v4 as uuidv4 } from "uuid";
import path from "path";

/**
 * Generates a unique filename with optional format conversion
 * @param originalName Original filename
 * @param targetFormat Optional target format (e.g., 'webp', 'jpg')
 * @returns Unique filename with proper extension
 */
export const generateUniqueFilename = (
    originalName: string,
    targetFormat?: string
): string => {
    if (!originalName || typeof originalName !== 'string') {
        throw new Error('Original name must be a non-empty string');
    }

    const allowedFormats = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);
    if (targetFormat && !allowedFormats.has(targetFormat.toLowerCase())) {
        throw new Error(`Unsupported target format: ${targetFormat}`);
    }

    // Remove any query strings or hashes from the filename
    const cleanName = originalName.split('?')[0].split('#')[0];

    // Get the original extension (without dot)
    const originalExt = path.extname(cleanName).slice(1).toLowerCase();

    // Determine the final extension
    const finalExt = targetFormat?.toLowerCase() || originalExt;

    // Generate the unique filename
    return `${uuidv4()}.${finalExt}`;
};