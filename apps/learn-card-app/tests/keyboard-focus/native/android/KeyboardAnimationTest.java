package com.learncard.app;

import android.os.SystemClock;
import android.view.MotionEvent;
import android.view.KeyEvent;
import android.webkit.WebView;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class KeyboardAnimationTest {
    private WebView web;
    private JSONObject geometry() throws Exception {
        AtomicReference<String> result = new AtomicReference<>();
        CountDownLatch done = new CountDownLatch(1);
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> web.evaluateJavascript(
            "JSON.stringify({ready:!!document.querySelector('input[aria-label=Search]'),mode:new URLSearchParams(location.search).get('focusManager'),active:document.activeElement?.getAttribute('aria-label'),fieldBottom:document.activeElement?.getBoundingClientRect().bottom,h:innerHeight,b:document.querySelector('ion-app')?.getBoundingClientRect().bottom})",
            value -> { result.set(value); done.countDown(); }));
        assertTrue("WebView JS reply", done.await(5, TimeUnit.SECONDS));
        return new JSONObject(new JSONArray("[" + result.get() + "]").getString(0));
    }
    private void tap(String selector) throws Exception {
        AtomicReference<String> result = new AtomicReference<>();
        CountDownLatch done = new CountDownLatch(1);
        int[] origin = new int[2];
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> {
            web.getLocationOnScreen(origin);
            web.evaluateJavascript("JSON.stringify((()=>{const r=document.querySelector('" + selector + "').getBoundingClientRect();return {x:(r.x+r.width/2)*devicePixelRatio,y:(r.y+r.height/2)*devicePixelRatio}})())",
                value -> { result.set(value); done.countDown(); });
        });
        assertTrue(done.await(5, TimeUnit.SECONDS));
        JSONObject point = new JSONObject(new JSONArray("[" + result.get() + "]").getString(0));
        float x = origin[0] + (float)point.getDouble("x");
        float y = origin[1] + (float)point.getDouble("y");
        long t = SystemClock.uptimeMillis();
        MotionEvent down = MotionEvent.obtain(t,t,MotionEvent.ACTION_DOWN,x,y,0);
        MotionEvent up = MotionEvent.obtain(t,t+60,MotionEvent.ACTION_UP,x,y,0);
        InstrumentationRegistry.getInstrumentation().getUiAutomation().injectInputEvent(down,true);
        InstrumentationRegistry.getInstrumentation().getUiAutomation().injectInputEvent(up,true);
        down.recycle();up.recycle();
    }
    @Test public void keyboardOpenDismiss() throws Exception {
        try(ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            String mode=InstrumentationRegistry.getArguments().getString("focusManager", "1");
            scenario.onActivity(activity -> {
                web = activity.getBridge().getWebView();
                if(mode.equals("0")) {
                    String url = activity.getBridge().getConfig().getServerUrl();
                    web.loadUrl(url + (url.contains("?") ? "&" : "?") + "focusManager=0");
                }
            });
            JSONObject initial = null;
            long deadline=SystemClock.uptimeMillis()+90000;
            while(SystemClock.uptimeMillis()<deadline) {
                try { initial=geometry(); if(initial.optBoolean("ready") && (!mode.equals("0") || initial.optString("mode").equals("0"))) break; } catch(Exception ignored) {}
                SystemClock.sleep(250);
            }
            assertNotNull(initial);assertTrue("Synthetic fixture loaded", initial.optBoolean("ready"));
            double expanded=initial.getDouble("h");
            boolean captureOnly = InstrumentationRegistry.getArguments().getString("captureOnly", "false").equals("true");
            for(int i=0;i<2;i++) {
                tap("input");SystemClock.sleep(1800);
                JSONObject open=geometry();
                assertTrue("Software keyboard resizes viewport: "+open,open.getDouble("h")<expanded-120);
                if (!captureOnly) assertEquals("No double host inset",open.getDouble("h"),open.getDouble("b"),2);
                System.out.println("KEYBOARD_OPEN "+open);
                tap("button");SystemClock.sleep(1800);
                JSONObject closed=geometry();
                assertEquals("Viewport restored",expanded,closed.getDouble("h"),2);
                if (!captureOnly) assertEquals("Host restored",expanded,closed.getDouble("b"),2);
                System.out.println("KEYBOARD_CLOSED "+closed);
            }
        }
    }
    @Test public void switchingFieldsAndAndroidBack() throws Exception {
        try(ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            scenario.onActivity(activity -> web = activity.getBridge().getWebView());
            awaitFixture();
            double expanded=geometry().getDouble("h");
            tap("input");SystemClock.sleep(800);
            scrollForm();
            tap("input[aria-label=\"Lower field\"]");SystemClock.sleep(800);
            JSONObject focused=geometry();
            assertEquals("Lower field",focused.getString("active"));
            assertTrue("Focused field remains visible: "+focused,focused.getDouble("fieldBottom") <= focused.getDouble("h")-8);
            InstrumentationRegistry.getInstrumentation().sendKeyDownUpSync(KeyEvent.KEYCODE_BACK);
            SystemClock.sleep(1000);
            assertEquals("Back restores viewport",expanded,geometry().getDouble("h"),2);
        }
    }
    @Test public void rapidDismissDoesNotRestoreAnOldHeight() throws Exception {
        try(ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            scenario.onActivity(activity -> web = activity.getBridge().getWebView());
            awaitFixture();
            double expanded=geometry().getDouble("h");
            for(int i=0;i<3;i++) {
                tap("input");SystemClock.sleep(75);
                tap("button");SystemClock.sleep(900);
                JSONObject restored=geometry();
                assertEquals("Rapid dismissal restores viewport",expanded,restored.getDouble("h"),2);
                assertEquals("Rapid dismissal restores host",expanded,restored.getDouble("b"),2);
            }
        }
    }
    private void scrollForm() {
        int[] origin = new int[2];
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> web.getLocationOnScreen(origin));
        float x = origin[0] + web.getWidth() * 0.5f;
        float startY = origin[1] + web.getHeight() * 0.85f;
        float endY = origin[1] + web.getHeight() * 0.3f;
        long t = SystemClock.uptimeMillis();
        for (int i=0;i<=16;i++) {
            int action = i==0 ? MotionEvent.ACTION_DOWN : i==16 ? MotionEvent.ACTION_UP : MotionEvent.ACTION_MOVE;
            MotionEvent event = MotionEvent.obtain(t,SystemClock.uptimeMillis(),action,x,startY+(endY-startY)*i/16f,0);
            InstrumentationRegistry.getInstrumentation().getUiAutomation().injectInputEvent(event,true);
            event.recycle();
            SystemClock.sleep(16);
        }
        SystemClock.sleep(200);
    }
    private void awaitFixture() throws Exception {
        long deadline=SystemClock.uptimeMillis()+90000;
        while(SystemClock.uptimeMillis()<deadline) {
            try { if(geometry().optBoolean("ready")) return; } catch(Exception ignored) {}
            SystemClock.sleep(250);
        }
        fail("Synthetic fixture did not load");
    }

}
