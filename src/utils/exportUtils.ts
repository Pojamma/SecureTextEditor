/**
 * Export utility functions for saving documents in various formats
 */

import { Share } from '@capacitor/share';

/**
 * Download a file to the user's device
 */
export function downloadFile(filename: string, content: string, mimeType: string = 'text/plain') {
  // Create a blob from the content
  const blob = new Blob([content], { type: mimeType });

  // Create a temporary download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export document as plain text file
 */
export function exportAsText(filename: string, content: string) {
  const txtFilename = filename.endsWith('.txt') ? filename : `${filename}.txt`;
  downloadFile(txtFilename, content, 'text/plain;charset=utf-8');
}

/**
 * Export document as HTML file
 */
export function exportAsHTML(filename: string, content: string) {
  const htmlFilename = filename.replace(/\.(txt|md)$/, '.html');

  // Convert line breaks to HTML
  const htmlContent = content
    .split('\n')
    .map(line => line ? `<p>${escapeHtml(line)}</p>` : '<br>')
    .join('\n');

  const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(filename)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    p {
      margin: 0.5em 0;
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;

  downloadFile(htmlFilename, htmlTemplate, 'text/html;charset=utf-8');
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Share document using Capacitor Share plugin (works on Android, iOS, and Web)
 */
export async function shareDocument(filename: string, content: string): Promise<boolean> {
  try {
    // Use Capacitor Share plugin - works on all platforms
    await Share.share({
      title: filename,
      text: content,
      dialogTitle: `Share ${filename}`
    });
    return true;
  } catch (error) {
    // User cancelled or sharing not available
    console.log('Share cancelled or not available:', error);
    return false;
  }
}

/**
 * Copy document content to clipboard
 * @param content - Content to copy
 * @param clearAfterTimeout - If true, clears clipboard after 30 seconds (for sensitive data)
 */
export async function copyToClipboard(content: string, clearAfterTimeout: boolean = false): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(content);
  } else {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = content;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  // If requested, clear clipboard after timeout for security
  if (clearAfterTimeout) {
    setTimeout(() => {
      clearClipboard();
    }, 30000); // 30 seconds
  }
}

/**
 * Clear clipboard contents (for security purposes)
 */
export async function clearClipboard(): Promise<void> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText('');
    }
  } catch (error) {
    // Silently fail if clipboard clearing fails
    console.warn('Failed to clear clipboard:', error);
  }
}
