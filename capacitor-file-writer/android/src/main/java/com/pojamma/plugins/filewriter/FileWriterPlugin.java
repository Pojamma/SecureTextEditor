package com.pojamma.plugins.filewriter;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "FileWriter")
public class FileWriterPlugin extends Plugin {
    private static final String TAG = "FileWriterPlugin";

    @PluginMethod
    public void writeToUri(PluginCall call) {
        android.util.Log.d(TAG, "writeToUri called");
        String uriString = call.getString("uri");
        String content = call.getString("content");
        Boolean isBinary = call.getBoolean("isBinary", false);
        android.util.Log.d(TAG, "URI: " + uriString);
        android.util.Log.d(TAG, "Binary mode: " + isBinary);

        if (uriString == null || uriString.isEmpty()) {
            call.reject("URI is required");
            return;
        }

        if (content == null) {
            call.reject("Content is required");
            return;
        }

        try {
            Uri uri = Uri.parse(uriString);
            ContentResolver resolver = getContext().getContentResolver();

            // Try to take persistable URI permission if not already held
            try {
                int flags = android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION |
                           android.content.Intent.FLAG_GRANT_WRITE_URI_PERMISSION;
                resolver.takePersistableUriPermission(uri, flags);
                android.util.Log.d(TAG, "Successfully took persistable URI permission");
            } catch (SecurityException e) {
                // Permission might already be held or not available
                android.util.Log.w(TAG, "Could not take persistable permission: " + e.getMessage());
                // Continue anyway as we might still be able to write
            }

            // Write content to URI - use "w" mode to truncate and overwrite
            try (OutputStream out = resolver.openOutputStream(uri, "w")) {
                if (out == null) {
                    call.reject("Failed to open output stream for URI");
                    return;
                }

                if (isBinary) {
                    // Decode base64 and write as binary
                    byte[] binaryData = android.util.Base64.decode(content, android.util.Base64.NO_WRAP);
                    out.write(binaryData);
                } else {
                    // Write as UTF-8 text
                    out.write(content.getBytes(StandardCharsets.UTF_8));
                }

                out.flush();
                android.util.Log.d(TAG, "Successfully wrote to URI");
            }

            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);

        } catch (SecurityException e) {
            android.util.Log.e(TAG, "SecurityException: " + e.getMessage(), e);
            call.reject("Permission denied: " + e.getMessage());
        } catch (Exception e) {
            android.util.Log.e(TAG, "Exception: " + e.getMessage(), e);
            call.reject("Failed to write to URI: " + e.getMessage());
        }
    }

    @PluginMethod
    public void takePersistablePermission(PluginCall call) {
        String uriString = call.getString("uri");

        if (uriString == null || uriString.isEmpty()) {
            call.reject("URI is required");
            return;
        }

        try {
            Uri uri = Uri.parse(uriString);
            ContentResolver resolver = getContext().getContentResolver();

            int flags = android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION |
                       android.content.Intent.FLAG_GRANT_WRITE_URI_PERMISSION;

            resolver.takePersistableUriPermission(uri, flags);
            android.util.Log.d(TAG, "Persistable permission taken for URI: " + uriString);

            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);

        } catch (SecurityException e) {
            android.util.Log.e(TAG, "Failed to take persistable permission: " + e.getMessage(), e);
            call.reject("Failed to take persistable permission: " + e.getMessage());
        } catch (Exception e) {
            call.reject("Error: " + e.getMessage());
        }
    }

    @PluginMethod
    public void pickDocument(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");

        // Request persistable read and write permissions
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION |
                       Intent.FLAG_GRANT_WRITE_URI_PERMISSION |
                       Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);

        startActivityForResult(call, intent, "pickDocumentResult");
    }

    @PluginMethod
    public void createDocument(PluginCall call) {
        String filename = call.getString("filename");
        String content = call.getString("content");
        Boolean isBinary = call.getBoolean("isBinary", false);
        String mimeType = call.getString("mimeType", "*/*");

        if (filename == null || filename.isEmpty()) {
            call.reject("Filename is required");
            return;
        }

        if (content == null) {
            call.reject("Content is required");
            return;
        }

        // Store content in call data for later use in callback
        call.getData().put("content", content);
        call.getData().put("isBinary", isBinary);

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(mimeType);
        intent.putExtra(Intent.EXTRA_TITLE, filename);

        // Request persistable write permissions
        intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION |
                       Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);

        startActivityForResult(call, intent, "createDocumentResult");
    }

    @ActivityCallback
    private void pickDocumentResult(PluginCall call, ActivityResult result) {
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            call.reject("File selection cancelled");
            return;
        }

        Intent data = result.getData();
        Uri uri = data.getData();

        if (uri == null) {
            call.reject("No file selected");
            return;
        }

        try {
            ContentResolver resolver = getContext().getContentResolver();

            // Take persistable permission
            int flags = Intent.FLAG_GRANT_READ_URI_PERMISSION |
                       Intent.FLAG_GRANT_WRITE_URI_PERMISSION;
            resolver.takePersistableUriPermission(uri, flags);
            android.util.Log.d(TAG, "Took persistable permissions for: " + uri.toString());

            // Get file name
            String fileName = uri.getLastPathSegment();
            if (fileName == null) {
                fileName = "Untitled.txt";
            }

            // Read file content as bytes first to detect if binary
            byte[] fileBytes;
            try (InputStream in = resolver.openInputStream(uri)) {
                if (in == null) {
                    call.reject("Failed to open input stream");
                    return;
                }

                // Read entire file into byte array
                java.io.ByteArrayOutputStream buffer = new java.io.ByteArrayOutputStream();
                byte[] readBuffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = in.read(readBuffer)) != -1) {
                    buffer.write(readBuffer, 0, bytesRead);
                }
                fileBytes = buffer.toByteArray();
            }

            // Detect if binary by checking first 1000 bytes for null bytes and control characters
            boolean isBinaryFile = false;
            int sampleSize = Math.min(1000, fileBytes.length);
            for (int i = 0; i < sampleSize; i++) {
                byte b = fileBytes[i];
                // Check for null bytes or control characters (except tab, newline, carriage return)
                if (b == 0 || (b > 0 && b < 32 && b != 9 && b != 10 && b != 13)) {
                    isBinaryFile = true;
                    android.util.Log.d(TAG, "File detected as binary");
                    break;
                }
            }

            // Convert to appropriate format
            String content;
            if (isBinaryFile) {
                // Encode to base64
                content = android.util.Base64.encodeToString(fileBytes, android.util.Base64.NO_WRAP);
                android.util.Log.d(TAG, "File encoded to base64");
            } else {
                // Convert to UTF-8 string
                content = new String(fileBytes, StandardCharsets.UTF_8);
                android.util.Log.d(TAG, "File read as UTF-8 text");
            }

            JSObject ret = new JSObject();
            ret.put("uri", uri.toString());
            ret.put("name", fileName);
            ret.put("content", content);
            ret.put("mimeType", resolver.getType(uri));
            ret.put("isBinary", isBinaryFile);

            call.resolve(ret);

        } catch (SecurityException e) {
            android.util.Log.e(TAG, "Permission error: " + e.getMessage(), e);
            call.reject("Permission denied: " + e.getMessage());
        } catch (Exception e) {
            android.util.Log.e(TAG, "Error reading file: " + e.getMessage(), e);
            call.reject("Failed to read file: " + e.getMessage());
        }
    }

    @ActivityCallback
    private void createDocumentResult(PluginCall call, ActivityResult result) {
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            call.reject("Document creation cancelled");
            return;
        }

        Intent data = result.getData();
        Uri uri = data.getData();

        if (uri == null) {
            call.reject("No file created");
            return;
        }

        try {
            ContentResolver resolver = getContext().getContentResolver();

            // Take persistable permission
            int flags = Intent.FLAG_GRANT_WRITE_URI_PERMISSION;
            resolver.takePersistableUriPermission(uri, flags);
            android.util.Log.d(TAG, "Took persistable write permission for: " + uri.toString());

            // Get content and binary flag from call data
            String content = call.getData().getString("content");
            boolean isBinary = call.getData().getBoolean("isBinary", false);

            // Write content to the newly created file
            try (OutputStream out = resolver.openOutputStream(uri, "w")) {
                if (out == null) {
                    call.reject("Failed to open output stream for created file");
                    return;
                }

                if (isBinary) {
                    // Decode base64 and write as binary
                    byte[] binaryData = android.util.Base64.decode(content, android.util.Base64.NO_WRAP);
                    out.write(binaryData);
                } else {
                    // Write as UTF-8 text
                    out.write(content.getBytes(StandardCharsets.UTF_8));
                }

                out.flush();
                android.util.Log.d(TAG, "Successfully wrote to created document");
            }

            // Get the filename
            String fileName = uri.getLastPathSegment();
            if (fileName == null) {
                fileName = "Untitled";
            }

            JSObject ret = new JSObject();
            ret.put("uri", uri.toString());
            ret.put("name", fileName);

            call.resolve(ret);

        } catch (SecurityException e) {
            android.util.Log.e(TAG, "Permission error: " + e.getMessage(), e);
            call.reject("Permission denied: " + e.getMessage());
        } catch (Exception e) {
            android.util.Log.e(TAG, "Error creating file: " + e.getMessage(), e);
            call.reject("Failed to create file: " + e.getMessage());
        }
    }
}
