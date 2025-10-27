/**
 * Download a RAG source file from the public/rag-files/ directory
 * @param filename - The exact filename to download (case-sensitive)
 * @returns true if download initiated successfully, false otherwise
 */
export const downloadRagFile = (filename: string): boolean => {
  try {
    // Construct the file path
    const filePath = `/rag-files/${filename}`;
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = filePath;
    link.download = filename;
    link.style.display = 'none';
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('Failed to download file:', filename, error);
    return false;
  }
};

