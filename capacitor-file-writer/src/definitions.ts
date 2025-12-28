export interface FileWriterPlugin {
  /**
   * Write content to a file URI (Android content:// URIs)
   */
  writeToUri(options: { uri: string; content: string }): Promise<{ success: boolean }>;

  /**
   * Take persistable URI permission for a file
   * This ensures we can access the file even after app restart
   */
  takePersistablePermission(options: { uri: string }): Promise<{ success: boolean }>;

  /**
   * Pick a document with write permissions (Android only)
   * Returns the file URI, name, and content
   */
  pickDocument(): Promise<{
    uri: string;
    name: string;
    content: string;
    mimeType: string;
  }>;
}
