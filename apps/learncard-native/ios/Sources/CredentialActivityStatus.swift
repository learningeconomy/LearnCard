import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

/// Page-level feedback describes actual work. Pending offers still require review.
struct CredentialActivityStatus: View {
    let store: AppStore
    var inbox = false
    private var prefix: String { inbox ? "inbox" : "passport" }
    private var samples: Bool { store.sampleSyncBusy }
    private var checking: Bool { store.credentialActivity == .refreshing }
    private var receiving: Bool { store.credentialActivity == .receiving }
    private var notifications: Bool { inbox && store.inbox.loading }
    private var active: Bool { samples || checking || receiving || notifications }
    private var failure: String? { store.refreshError ?? (inbox ? store.inbox.loadError : nil) }
    private var title: String {
        if samples {
            if store.intake.samplePreparing { return NativeText.text("sync.preparing") }
            return NativeText.text(store.intake.sampleBusy ? "build.samplesSyncing" : "sync.refreshing")
        }
        if receiving { return NativeText.text("credentialActivity.receiving") }
        if checking { return NativeText.text("credentialActivity.checking") }
        if notifications { return NativeText.text("inbox.loading") }
        if failure != nil { return NativeText.text("credentialActivity.failed") }
        return inbox ? NativeText.text("inbox.subtitle") : NativeText.literal("My credentials")
    }
    private var detail: String? {
        if samples {
            if store.intake.sampleBusy, let progress = store.intake.sampleProgress, progress.total > 0 {
                return NativeText.format("sync.progress", "\(progress.processed)", "\(progress.total)")
            }
            return NativeText.text("sync.browse")
        }
        if receiving { return NativeText.text("credentialActivity.receivingBody") }
        if checking { return NativeText.text("credentialActivity.checkingBody") }
        if !active, let failure { return failure }
        return nil
    }
    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            if active {
                ProgressView().tint(Palette.selection).frame(width: 24).accessibilityHidden(true)
            } else if failure != nil {
                Image(systemName: "exclamationmark.circle").foregroundStyle(Palette.secondary).accessibilityHidden(true)
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(title).font(.subheadline.weight(active || failure != nil ? .semibold : .medium))
                    .foregroundStyle(active || failure != nil ? Palette.ink : Palette.secondary)
                    .accessibilityIdentifier("\(prefix)-activity-title")
                if let detail {
                    Text(detail).font(.caption).foregroundStyle(Palette.secondary)
                        .fixedSize(horizontal: false, vertical: true).accessibilityIdentifier("\(prefix)-activity-detail")
                }
            }.frame(maxWidth: .infinity, alignment: .leading)
            if !active {
                Button {
                    Task { if inbox { await store.refreshInbox() } else { await store.refresh() } }
                } label: {
                    Label(failure == nil ? NativeText.text("credentialActivity.refresh") : NativeText.literal("Try Again"), systemImage: "arrow.clockwise")
                        .font(.caption.weight(.semibold)).fixedSize(horizontal: false, vertical: true)
                        .padding(.horizontal, 12).frame(minHeight: 44)
                }.buttonStyle(.plain).foregroundStyle(Palette.selection)
                    .background(Palette.surface, in: Capsule())
                    .disabled(store.isBusy || (inbox && store.inbox.busyID != nil))
                    .accessibilityIdentifier("\(prefix)-refresh")
            }
        }.frame(minHeight: 44).accessibilityElement(children: .contain)
            .accessibilityIdentifier("\(prefix)-credential-activity")
    }
}
