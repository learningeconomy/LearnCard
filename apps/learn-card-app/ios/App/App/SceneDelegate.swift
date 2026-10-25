import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        guard let windowScene = scene as? UIWindowScene else { return }

        connectionOptions.urlContexts.forEach { NativeCrashReporter.inspect(url: $0.url) }
        connectionOptions.userActivities.forEach { NativeCrashReporter.inspect(url: $0.webpageURL) }
        NativeCrashReporter.configure()

        window = UIWindow(windowScene: windowScene)
        // Keep LearnCard's custom bridge so its local native plugins remain registered.
        window?.rootViewController = MyViewController()
        window?.makeKeyAndVisible()
        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        URLContexts.forEach { NativeCrashReporter.inspect(url: $0.url) }
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        NativeCrashReporter.inspect(url: userActivity.webpageURL)
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
