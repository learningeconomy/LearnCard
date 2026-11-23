package com.learncard.app;

import android.os.SystemClock;
import android.widget.EditText;
import android.webkit.WebView;

import androidx.test.espresso.web.sugar.Web;
import androidx.test.ext.junit.rules.ActivityScenarioRule;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.UiObject2;
import androidx.test.uiautomator.Until;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

import static androidx.test.espresso.Espresso.onView;
import static androidx.test.espresso.action.ViewActions.typeTextIntoFocusedView;
import static androidx.test.espresso.matcher.ViewMatchers.isAssignableFrom;
import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;
import static androidx.test.espresso.web.sugar.Web.onWebView;
import static androidx.test.espresso.web.webdriver.DriverAtoms.findElement;
import static androidx.test.espresso.web.webdriver.DriverAtoms.webClick;
import static androidx.test.espresso.web.webdriver.Locator.CSS_SELECTOR;
import static androidx.test.espresso.web.webdriver.Locator.ID;
import static org.hamcrest.Matchers.allOf;
import static org.junit.Assert.assertNotNull;

@RunWith(AndroidJUnit4.class)
public class SmokeSignInWalletTest {
    private interface WebStep {
        void run(Web.WebInteraction<Void> web);
    }

    @Rule
    public ActivityScenarioRule<MainActivity> activity = new ActivityScenarioRule<>(MainActivity.class);

    @Test
    public void signsInWithDemoEmailAndShowsACredentialCard() {
        UiDevice device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
        UiObject2 email = device.wait(
            Until.findObject(By.res(Pattern.compile("(?:.*:id/)?login-email")).clazz(EditText.class)),
            TimeUnit.SECONDS.toMillis(90)
        );
        assertNotNull("The email field was not exposed by the Android WebView", email);

        // A native tap starts the WebView's input connection before Espresso types.
        email.click();
        onView(allOf(isAssignableFrom(WebView.class), isDisplayed()))
            .perform(typeTextIntoFocusedView("demo@learningeconomy.io"));

        until(30, web ->
            web.withElement(findElement(CSS_SELECTOR, "#login-email-submit:enabled"))
                .perform(webClick())
        );
        until(120, web -> web.withElement(findElement(ID, "wallet-heading")));
        until(120, web ->
            web.withElement(findElement(CSS_SELECTOR, "[aria-label='Credential card']"))
        );
    }

    private static void until(long budgetSeconds, WebStep step) {
        long deadline = SystemClock.elapsedRealtime() + budgetSeconds * 1000L;
        RuntimeException last = null;
        while (SystemClock.elapsedRealtime() < deadline) {
            try {
                step.run(
                    onWebView(org.hamcrest.Matchers.instanceOf(WebView.class))
                        .forceJavascriptEnabled()
                        .withTimeout(5, TimeUnit.SECONDS)
                );
                return;
            } catch (RuntimeException error) {
                last = error;
                SystemClock.sleep(1000);
            }
        }
        if (last != null) {
            throw last;
        }
        throw new AssertionError("WebView step timed out after " + budgetSeconds + "s");
    }
}
