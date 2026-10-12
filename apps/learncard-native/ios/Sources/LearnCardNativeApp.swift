import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

@main
struct LearnCardNativeApp: App {
    @State private var store = AppStore()

    var body: some Scene {
        WindowGroup {
            Group {
                #if DEBUG
                if ProcessInfo.processInfo.arguments.contains("--keychain-probe") { KeychainProbeView() }
                else { client }
                #else
                client
                #endif
            }
                .tint(Palette.brandGreen)
                .preferredColorScheme(ProcessInfo.processInfo.arguments.contains("--preview-dark") ? .dark : nil)
        }
    }

    @ViewBuilder private var client: some View {
                #if DEBUG
                if let account = AccountFixture.controller(arguments: ProcessInfo.processInfo.arguments) {
                    AccountRootView(account: account)
                } else if ProcessInfo.processInfo.arguments.contains("--demo") { RootView(store: store) }
                else { AccountRootView() }
                #else
                if ProcessInfo.processInfo.arguments.contains("--demo") { RootView(store: store) }
                else { AccountRootView() }
                #endif
    }
}
