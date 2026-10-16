import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

@main
struct LearnCardNativeApp: App {
    @State private var store = AppStore()
    #if DEBUG
    @State private var fixtureAccount: AccountController?
    #endif
    @AppStorage(NativeLanguage.preferenceKey) private var language = "system"
    init() {
        #if DEBUG
        let args = ProcessInfo.processInfo.arguments
        _fixtureAccount = State(initialValue: AccountFixture.controller(arguments: args))
        if args.contains("--demo"), args.contains("--category-fixtures") {
            _store = State(initialValue: AppStore(service: DemoCredentialService(includeCategorySamples: true)))
        }
        if args.contains("--demo"), args.contains("--share-picker-fixtures") {
            _store = State(initialValue: AppStore(service: DemoCredentialService(includeSharingSamples: true)))
        }
        if args.contains("--demo"), args.contains("--stack-fixtures") {
            _store = State(initialValue: AppStore(service: DemoCredentialService(includeCategorySamples: true, includeStackSamples: true)))
        }
        if args.contains("--demo"), args.contains("--empty-collection") {
            _store = State(initialValue: AppStore(service: DemoCredentialService(emptyCollection: true)))
        } else if args.contains("--demo"), args.contains("--empty-page") {
            _store = State(initialValue: AppStore(service: DemoCredentialService(emptyFirstPage: true)))
        }
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
                else if let index = ProcessInfo.processInfo.arguments.firstIndex(of: "--motion-review"), ProcessInfo.processInfo.arguments.indices.contains(index + 1),
                        let mode = AccountMotionMode(rawValue: ProcessInfo.processInfo.arguments[index + 1]) { AccountMotionReviewView(mode: mode) }
                else { client }
                #else
                client
                #endif
            }
                #if DEBUG
                .modifier(NativeReviewPreferences())
                #endif
                .tint(Palette.selection)
                .environment(\.locale, (NativeLanguage(rawValue: language) ?? .system).locale)
                .environment(\.layoutDirection, (NativeLanguage(rawValue: language) ?? .system).isRightToLeft ? .rightToLeft : .leftToRight)
                .preferredColorScheme(ProcessInfo.processInfo.arguments.contains("--preview-dark") ? .dark : nil)
        }
    }

    @ViewBuilder private var client: some View {
                #if DEBUG
                if let account = fixtureAccount {
                    AccountRootView(account: account)
                } else if ProcessInfo.processInfo.arguments.contains("--demo") { RootView(store: store) }
                else { AccountRootView() }
                #else
                if ProcessInfo.processInfo.arguments.contains("--demo") { RootView(store: store) }
                else { AccountRootView() }
                #endif
    }
}

#if DEBUG
struct NativeReviewPreferences: ViewModifier {
    @Environment(\.dynamicTypeSize) private var systemTextSize
    func body(content: Content) -> some View {
        let arguments = ProcessInfo.processInfo.arguments
        content
            .environment(\.dynamicTypeSize, arguments.contains("--large-type") ? .accessibility3 : arguments.contains("--standard-type") ? .large : systemTextSize)
    }
}
#endif
