import SwiftUI
import WebKit
import LearnCardNativeCore
import LearnCardNativeSDK

struct ConsumerBrowserView: View {
    @Environment(\.locale) private var nativeLocale
    let launch: ConsumerAppLaunch
    let consumer: ConsumerAppsStore
    let isSample: Bool
    let onCredential: () -> Void
    let openInbox: () -> Void
    @Environment(\.dismiss) private var dismiss
    @Environment(\.scenePhase) private var phase
    @State private var browser: ConsumerBrowserSession?
    var body: some View {
        NavigationStack {
            Group {
                if let browser {
                    ZStack {
                        PartnerWebView(browser: browser)
                        if browser.loading { ProgressView(NativeText.text("browser.loading")).padding(24).background(Palette.surface, in: RoundedRectangle(cornerRadius: 20)) }
                        if browser.failed {
                            VStack(spacing: 16) {
                                Text(NativeText.text("browser.failed")).font(.headline)
                                Text(NativeText.text("browser.failureBody")).font(.subheadline)
                                Button(NativeText.text("common.retry")) { browser.load() }
                                if launch.embedded { Button(NativeText.text("browser.page")) { openWebPage() }; Text(NativeText.text("browser.pageBody")).font(.caption) }
                            }.padding(24).frame(maxWidth: .infinity, maxHeight: .infinity).background(Palette.paper)
                        }
                    }
                    .alert(NativeText.format("consent.identityTitle", launch.title), isPresented: Binding(get: { browser.identity != nil }, set: { if !$0 && browser.identity != nil { browser.decline() } })) {
                        Button(NativeText.text("consent.identityAccept")) { browser.acceptIdentity() }.accessibilityIdentifier("browser-identity-accept")
                        Button(NativeText.text("common.cancel"), role: .cancel) { browser.decline() }
                    } message: { Text(NativeText.text("consent.identityBody")) }
                    .sheet(item: Binding(get: { browser.consent }, set: { browser.consent = $0 }), onDismiss: { if browser.consent == nil { browser.decline() } }) { review in
                        NativeConsentView(appTitle: launch.title, iconURL: nil, review: review, consumer: consumer) { browser.consentCompleted() }
                    }
                    .alert(NativeText.text("common.error"), isPresented: Binding(get: { browser.error != nil }, set: { if !$0 { browser.error = nil } })) {
                        Button(NativeText.text("common.done"), role: .cancel) { browser.error = nil }
                    } message: { Text(browser.error?.errorDescription ?? "") }
                    .safeAreaInset(edge: .bottom) {
                        if browser.offeredCredential { Button(NativeText.text("browser.inbox")) { browser.dispose(); dismiss(); openInbox() }.font(.body.weight(.semibold)).padding().frame(maxWidth: .infinity).background(Palette.surface) }
                    }
                } else { ProgressView(NativeText.text("browser.loading")) }
            }.background(Palette.paper).navigationTitle(launch.title).navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) { Button(NativeText.text("common.done")) { browser?.dispose(); dismiss() }.accessibilityIdentifier("browser-close") }
                    ToolbarItem(placement: .topBarTrailing) { Button { browser?.webView.goBack() } label: { Image(systemName: "chevron.backward") }.disabled(browser?.canGoBack != true).accessibilityLabel(NativeText.literal("Back")) }
                    if launch.embedded { ToolbarItem(placement: .topBarTrailing) { Menu { Button(NativeText.text("browser.page")) { openWebPage() }; Text(NativeText.text("browser.pageBody")) } label: { Image(systemName: "ellipsis") } } }
                    ToolbarItem(placement: .topBarTrailing) { Button { browser?.load() } label: { Image(systemName: "arrow.clockwise") }.accessibilityLabel(NativeText.text("common.retry")) }
                }
        }.onAppear { if browser == nil { browser = ConsumerBrowserSession(launch: launch, consumer: consumer, isSample: isSample, onCredential: onCredential) } }
            .onDisappear { browser?.dispose() }
            .onChange(of: phase) { _, next in if next == .background { browser?.dispose(); dismiss() } }
    }
    private func openWebPage() {
        browser?.dispose()
        let raw: [String: Any] = ["id": launch.id, "title": launch.title, "url": launch.url.absoluteString, "embedded": false]
        if let json = try? JSONSerialization.data(withJSONObject: raw), let next = try? JSONDecoder().decode(ConsumerAppLaunch.self, from: json) {
            browser = ConsumerBrowserSession(launch: next, consumer: consumer, isSample: false, onCredential: {})
        }
    }
}

private struct PartnerWebView: UIViewRepresentable {
    let browser: ConsumerBrowserSession
    func makeUIView(context: Context) -> WKWebView { browser.webView }
    func updateUIView(_ view: WKWebView, context: Context) {}
}

struct NativeShareSheet: UIViewControllerRepresentable {
    let url: URL
    func makeUIViewController(context: Context) -> UIActivityViewController { UIActivityViewController(activityItems: [url], applicationActivities: nil) }
    func updateUIViewController(_ controller: UIActivityViewController, context: Context) {}
}
