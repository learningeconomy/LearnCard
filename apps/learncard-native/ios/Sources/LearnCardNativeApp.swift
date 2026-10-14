import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

@main
struct LearnCardNativeApp: App {
    @State private var store = AppStore()
    @AppStorage(NativeLanguage.preferenceKey) private var language = "system"
    init() {
        #if DEBUG
        let args = ProcessInfo.processInfo.arguments
        if let index = args.firstIndex(of: "--locale"), args.indices.contains(index + 1), NativeLanguage(rawValue: args[index + 1]) != nil {
            UserDefaults.standard.set(args[index + 1], forKey: NativeLanguage.preferenceKey)
        }
        #endif
    }

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
                .tint(Palette.selection)
                .environment(\.locale, (NativeLanguage(rawValue: language) ?? .system).locale)
                .environment(\.layoutDirection, (NativeLanguage(rawValue: language) ?? .system).isRightToLeft ? .rightToLeft : .leftToRight)
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
