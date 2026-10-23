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
        IntakePreviewCache.cleanStaleFiles()
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
        if args.contains("--demo"), args.contains("--credential-detail-fixtures") {
            _store = State(initialValue: AppStore(service: CredentialDetailFixture(), isLive: true, consumerService: DemoConsumerAppService()))
        }
        if args.contains("--demo"), args.contains("--empty-apps") {
            _store = State(initialValue: AppStore(consumerService: DemoConsumerAppService(emptyInstalled: true)))
        } else if args.contains("--demo"), args.contains("--unavailable-apps") {
            _store = State(initialValue: AppStore(consumerService: UnavailableConsumerAppService()))
        }
        if args.contains("--demo"), args.contains("--empty-collection") {
            _store = State(initialValue: AppStore(service: DemoCredentialService(emptyCollection: true)))
        } else if args.contains("--demo"), args.contains("--empty-page") {
            _store = State(initialValue: AppStore(service: DemoCredentialService(emptyFirstPage: true)))
        }
        if args.contains("--demo"), args.contains("--sample-sync-slow") || args.contains("--sample-sync-partial") {
            let credentials = DemoCredentialService(), consumer = DemoConsumerAppService()
            _store = State(initialValue: AppStore(service: credentials, consumerService: consumer,
                intakeService: DemoIntakeService(service: credentials, consumer: consumer, sampleDelay: args.contains("--sample-sync-slow") ? .seconds(1) : .milliseconds(100), failSampleOnce: args.contains("--sample-sync-partial"))))
        }
        if args.contains("--demo"), args.contains("--credential-refresh-slow") || args.contains("--credential-refresh-failure") {
            _store = State(initialValue: AppStore(service: CredentialActivityFixture(failOnce: args.contains("--credential-refresh-failure"),
                delay: args.contains("--refresh-motion-review") ? .seconds(10) : .seconds(6))))
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
                else if ProcessInfo.processInfo.arguments.contains("--demo"), ProcessInfo.processInfo.arguments.contains("--loading-gallery") { LoadingReviewView() }
                else if ProcessInfo.processInfo.arguments.contains("--demo"), ProcessInfo.processInfo.arguments.contains("--sky-gallery") { SkyRefreshReviewView() }
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
                .progressViewStyle(BrandProgressStyle())
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
