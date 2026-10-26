package com.learncard.app;

import android.content.Context;
import android.net.Uri;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import io.sentry.Sentry;
import io.sentry.android.core.SentryAndroid;
import java.io.File;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.json.JSONObject;

@CapacitorPlugin(name = "NativeCrashReporting")
public class NativeCrashReportingPlugin extends Plugin {
    private static final String PREFERENCES = "learncard.nativeCrashReporting";
    private static volatile boolean privateSession = false;
    private static boolean started = false;
    private static final Map<String, String> runtimeTags = new HashMap<>();

    private static boolean enabled(Context context) {
        return !privateSession && context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
            .getBoolean("enabled", false);
    }

    public static synchronized void inspect(Context context, Uri uri) {
        if (uri == null || uri.getPath() == null) return;
        String path = uri.getPath();
        if (path.equals("/s") || path.startsWith("/s/")) {
            privateSession = true;
            stop(context);
        }
    }

    public static synchronized void start(Context context) {
        if (!enabled(context)) { stop(context); return; }
        if (started) return;
        try (var stream = context.getAssets().open("public/tenant-config.json")) {
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            byte[] buffer = new byte[4096];
            for (int count; (count = stream.read(buffer)) != -1;) bytes.write(buffer, 0, count);
            JSONObject config = new JSONObject(new String(bytes.toByteArray(), StandardCharsets.UTF_8));
            JSONObject observability = config.getJSONObject("observability");
            String dsn = observability.optString("sentryDsn");
            String environment = observability.optString("sentryEnv");
            if (dsn.isEmpty() || environment.isEmpty() || environment.equals("development")) return;
            Context appContext = context.getApplicationContext();
            SentryAndroid.init(appContext, options -> {
                options.setDsn(dsn);
                options.setEnvironment(environment);
                options.setCacheDirPath(cache(appContext).getAbsolutePath());
                options.setSendDefaultPii(false);
                options.setEnableAutoSessionTracking(false);
                options.setEnableActivityLifecycleBreadcrumbs(false);
                options.setEnableAppLifecycleBreadcrumbs(false);
                options.setEnableSystemEventBreadcrumbs(false);
                options.setEnableUserInteractionBreadcrumbs(false);
                options.setEnableNetworkEventBreadcrumbs(false);
                options.setAttachScreenshot(false);
                options.setAttachViewHierarchy(false);
                options.setShutdownTimeoutMillis(0);
                options.setBeforeBreadcrumb((breadcrumb, hint) -> null);
                options.setBeforeSend((event, hint) -> {
                    if (!enabled(appContext)) return null;
                    event.setUser(null);
                    event.setRequest(null);
                    event.setExtras(null);
                    event.setBreadcrumbs(null);
                    event.setMessage(null);
                    if (event.getExceptions() != null) event.getExceptions().forEach(exception ->
                        exception.setValue("Native exception; see stack trace"));
                    return event;
                });
                options.setTag("tenant_id", config.optString("tenantId", "unknown"));
                options.setTag("app_platform", "android");
                options.setTag("error_layer", "native");
            });
            started = true;
        } catch (Exception ignored) {
            // Missing/invalid tenant config disables reporting, never app startup.
        }
    }

    private static File cache(Context context) {
        String generation = context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
            .getString("cacheGeneration", "initial");
        return new File(new File(context.getCacheDir(), "learncard-native-crashes"), generation);
    }

    private static void delete(File file) {
        File[] children = file.listFiles();
        if (children != null) for (File child : children) delete(child);
        file.delete();
    }

    private static void stop(Context context) {
        // In-flight transports can finish writing after close. Never reopen that
        // cache generation, even if the user later opts back in.
        context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE).edit()
            .putString("cacheGeneration", UUID.randomUUID().toString()).commit();
        if (started) { Sentry.close(); started = false; }
        delete(new File(context.getCacheDir(), "learncard-native-crashes"));
    }

    @PluginMethod
    public void configure(PluginCall call) {
        synchronized (NativeCrashReportingPlugin.class) {
            Boolean requested = call.getBoolean("enabled");
            if (requested != null) {
                // Commit before resolving: a crash immediately after opt-out must not
                // restart reporting (or upload a cached report) at the next launch.
                if (!getContext().getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
                    .edit().putBoolean("enabled", requested).commit()) {
                    if (!requested) { privateSession = true; stop(getContext()); }
                    call.reject("Unable to persist crash reporting preference");
                    return;
                }
            }
            privateSession |= Boolean.TRUE.equals(call.getBoolean("privateSession", false));
            // Metadata is safe to retain locally while disabled, so a later
            // preference resolution starts the SDK with the right web identity.
            JSObject tags = call.getObject("tags", new JSObject());
            for (String key : new String[]{"web_version", "web_sha", "ota_bundle", "route_group"}) {
                String value = tags.optString(key, "");
                if (value.matches("[A-Za-z0-9._-]{1,100}")) runtimeTags.put(key, value);
            }
            if (!enabled(getContext())) stop(getContext());
            else {
                start(getContext());
                runtimeTags.forEach(Sentry::setTag);
            }
            JSObject result = new JSObject();
            result.put("enabled", enabled(getContext()));
            call.resolve(result);
        }
    }
}
