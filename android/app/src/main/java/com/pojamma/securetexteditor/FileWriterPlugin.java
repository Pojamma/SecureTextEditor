package com.pojamma.securetexteditor;

import android.content.ContentResolver;
import android.net.Uri;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "FileWriter")
public class FileWriterPlugin extends Plugin {

    @PluginMethod
    public void writeToUri(PluginCall call) {
        String uriString = call.getString("uri");
        String content = call.getString("content");

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
                resolver.takePersistableUriPermission(
                    uri,
                    android.content.Intent.FLAG_GRANT_WRITE_URI_PERMISSION
                );
            } catch (SecurityException e) {
                // Permission might already be held or not available
                // Continue anyway as we might still be able to write
            }

            // Write content to URI
            try (OutputStream out = resolver.openOutputStream(uri, "wt")) {
                if (out == null) {
                    call.reject("Failed to open output stream for URI");
                    return;
                }
                out.write(content.getBytes(StandardCharsets.UTF_8));
                out.flush();
            }

            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);

        } catch (SecurityException e) {
            call.reject("Permission denied: " + e.getMessage());
        } catch (Exception e) {
            call.reject("Failed to write to URI: " + e.getMessage());
        }
    }
}
