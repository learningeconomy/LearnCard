package com.learncard.cdn.measure;

import android.app.Instrumentation;
import android.app.UiAutomation;
import android.os.Bundle;
import android.os.ParcelFileDescriptor;
import android.os.SystemClock;
import android.view.accessibility.AccessibilityNodeInfo;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.FileInputStream;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.assertTrue;

/** Reads public text only in a fresh owned emulator; never signs in or reads account data. */
@RunWith(AndroidJUnit4.class)
public class StartupTest {
    private static final String APP = "com.learncard.app.dctest";
    private static String shell(UiAutomation ui, String command) throws Exception {
        try (ParcelFileDescriptor fd = ui.executeShellCommand(command);
             FileInputStream input = new FileInputStream(fd.getFileDescriptor())) {
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
    private static boolean ready(AccessibilityNodeInfo node, String expected) {
        if (node == null) return false;
        CharSequence text = node.getText();
        if (node.isVisibleToUser() && APP.contentEquals(node.getPackageName() == null ? "" : node.getPackageName())
            && text != null && text.toString().contains(expected)) return true;
        for (int i = 0; i < node.getChildCount(); i++) if (ready(node.getChild(i), expected)) return true;
        return false;
    }
    @Test public void visibleStartup() throws Exception {
        Instrumentation instrumentation = InstrumentationRegistry.getInstrumentation();
        UiAutomation ui = instrumentation.getUiAutomation();
        boolean online = "online".equals(InstrumentationRegistry.getArguments().getString("expected"));
        String expected = online ? "Sign in or create your account" : "You're offline";
        shell(ui, "input keyevent 3");
        long epoch = System.currentTimeMillis(), start = SystemClock.elapsedRealtime();
        String launch = shell(ui, "am start -W -n " + APP + "/com.learncard.app.MainActivity");
        boolean found = false;
        while (SystemClock.elapsedRealtime() - start < 60000) {
            if (ready(ui.getRootInActiveWindow(), expected)) { found = true; break; }
            SystemClock.sleep(50);
        }
        JSONObject result = new JSONObject();
        result.put("launchEpoch", epoch);
        result.put("visualReadyMs", SystemClock.elapsedRealtime() - start);
        result.put("found", found);
        result.put("screen", online ? "sign-in" : "offline");
        Matcher matcher = Pattern.compile("TotalTime:\\s*(\\d+)").matcher(launch);
        if (matcher.find()) result.put("nativeTotalMs", Integer.parseInt(matcher.group(1)));
        Bundle status = new Bundle(); status.putString("visualMetrics", result.toString());
        instrumentation.sendStatus(0, status);
        assertTrue("Expected public app screen did not become visible", found);
    }
}
