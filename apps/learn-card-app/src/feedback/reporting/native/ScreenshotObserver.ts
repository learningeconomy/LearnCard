import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';

/**
 * Local iOS-only Capacitor plugin (LC-2086 Task 10).
 *
 * `ScreenshotObserverPlugin.swift` forwards the UIKit
 * `UIApplication.userDidTakeScreenshotNotification` notification to JS as a
 * `screenshotTaken` event. The native side is registered through the custom
 * `MyViewController` bridge view controller; `registerPlugin` here only
 * declares the JS-facing surface for typed access.
 */

export interface ScreenshotObserverPlugin {
    addListener(
        eventName: 'screenshotTaken',
        listener: (event: { capturedAt: string }) => void
    ): Promise<PluginListenerHandle>;
}

export const ScreenshotObserver = registerPlugin<ScreenshotObserverPlugin>('ScreenshotObserver');
