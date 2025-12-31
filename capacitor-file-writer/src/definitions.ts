export interface FileWriterPlugin {
  /**
   * Write content to a file URI (Android content:// URIs)
   * For binary files, content should be base64-encoded
   */
  writeToUri(options: { uri: string; content: string; isBinary?: boolean }): Promise<{ success: boolean }>;

  /**
   * Take persistable URI permission for a file
   * This ensures we can access the file even after app restart
   */
  takePersistablePermission(options: { uri: string }): Promise<{ success: boolean }>;

  /**
   * Pick a document with write permissions (Android only)
   * Returns the file URI, name, and content
   * For .enc files, content is base64-encoded binary data
   */
  pickDocument(): Promise<{
    uri: string;
    name: string;
    content: string;
    mimeType: string;
    isBinary: boolean;
  }>;

  /**
   * Create a new document and write content to it (Android only)
   * Prompts user to choose location and filename
   * For binary files, content should be base64-encoded
   */
  createDocument(options: {
    filename: string;
    content: string;
    isBinary?: boolean;
    mimeType?: string;
  }): Promise<{
    uri: string;
    name: string;
  }>;
}
