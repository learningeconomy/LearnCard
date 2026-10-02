import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const readNativeFile = (path: string): string => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('ScoutPass iOS scene lifecycle contract', () => {
    const appDelegate = readNativeFile('ios/App/App/AppDelegate.swift');
    const sceneDelegate = readNativeFile('ios/App/App/SceneDelegate.swift');
    const infoPlist = readNativeFile('ios/App/App/Info.plist');
    const xcodeProject = readNativeFile('ios/App/App.xcodeproj/project.pbxproj');
    const podfile = readNativeFile('ios/App/Podfile');
    const barcodeSimulatorStub = readNativeFile(
        'ios/App/App/BarcodeScannerPluginSimulator.swift'
    );

    it('declares and registers the scene lifecycle', () => {
        expect(infoPlist).toContain('<key>UIApplicationSceneManifest</key>');
        expect(infoPlist).toContain('$(PRODUCT_MODULE_NAME).SceneDelegate');
        expect(appDelegate).toContain('configurationForConnecting connectingSceneSession');
        expect(appDelegate).toContain('config.delegateClass = SceneDelegate.self');
        expect(xcodeProject).toContain('SceneDelegate.swift in Sources');
        expect(xcodeProject).toContain('path = SceneDelegate.swift');
    });

    it('preserves the storyboard bridge and ScoutPass services', () => {
        expect(sceneDelegate).toContain('UIStoryboard(');
        expect(sceneDelegate).toContain('name: "Main"');
        expect(sceneDelegate).toContain('instantiateInitialViewController()');
        expect(appDelegate).toContain('FirebaseApp.configure()');
        expect(appDelegate).toContain('Messaging.messaging().apnsToken = deviceToken');
        expect(infoPlist).toContain('app-1-792471921493-ios-1496cc6a1b8741b4aec5dc');
    });

    it('forwards scene and legacy URL callbacks to Capacitor', () => {
        expect(sceneDelegate).toContain('SceneDelegateProxy.shared.scene');
        expect(sceneDelegate).toContain('openURLContexts URLContexts');
        expect(sceneDelegate).toContain('continue userActivity');
        expect(appDelegate).toContain('ApplicationDelegateProxy.shared.application(app, open: url');
        expect(appDelegate).toContain(
            'ApplicationDelegateProxy.shared.application(application, continue: userActivity'
        );
    });

    it('keeps ML Kit in Debug and Release device builds while stubbing simulators', () => {
        expect(podfile).toMatch(/pod 'CapacitorMlkitBarcodeScanning'.*barcode-scanning'$/m);
        expect(podfile).toContain('EXCLUDED_SOURCE_FILE_NAMES[sdk=iphonesimulator*]');
        expect(podfile).toContain('"#{key}[sdk=iphoneos*]');
        expect(podfile).toContain("['debug', 'release']");
        expect(barcodeSimulatorStub).toContain('#if targetEnvironment(simulator)');
        expect(barcodeSimulatorStub).toContain('Barcode scanning requires a physical iOS device.');
        expect(xcodeProject).toContain('BarcodeScannerPluginSimulator.swift in Sources');
    });
});
