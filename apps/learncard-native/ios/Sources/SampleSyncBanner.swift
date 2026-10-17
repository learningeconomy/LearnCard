import SwiftUI
import LearnCardNativeSDK
import LearnCardNativeCore

/// In-layout feedback stays visible across all four tabs without covering content.
struct SampleSyncBanner: View {
    let store: AppStore
    let viewPassport: () -> Void
    private var intake: IntakeStore { store.intake }
    private var partial: Bool { (intake.sampleResult?.failed ?? 0) > 0 || intake.sampleSyncError != nil }
    private var refreshing: Bool { store.sampleRefreshBusy && !intake.sampleBusy }
    private var title: String {
        if intake.samplePreparing { return NativeText.text("sync.preparing") }
        if store.sampleSyncBusy { return NativeText.text(refreshing ? "sync.refreshing" : "build.samplesSyncing") }
        return NativeText.text(partial ? "sync.incomplete" : "sync.complete")
    }
    private var detail: String {
        if store.sampleSyncBusy {
            if !refreshing, let progress = intake.sampleProgress, progress.total > 0 {
                return NativeText.format("sync.progress", "\(progress.processed)", "\(progress.total)")
            }
            return NativeText.text("sync.browse")
        }
        if let error = intake.sampleSyncError { return error.localizedDescription }
        if partial { return NativeText.text("build.samplesPartial") }
        return NativeText.format("build.samplesSaved", "\((intake.sampleResult?.added ?? 0) + (intake.sampleResult?.existing ?? 0))")
    }
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 12) {
                if store.sampleSyncBusy { ProgressView().frame(width: 24, height: 24).accessibilityHidden(true) }
                else { Image(systemName: partial ? "exclamationmark.circle" : "checkmark.circle.fill").font(.title3).foregroundStyle(partial ? Palette.secondary : Palette.green).accessibilityHidden(true) }
                VStack(alignment: .leading, spacing: 4) {
                    Text(title).font(.subheadline.weight(.semibold)).accessibilityIdentifier("sample-sync-title")
                    Text(detail).font(.caption).foregroundStyle(Palette.secondary).fixedSize(horizontal: false, vertical: true)
                        .accessibilityIdentifier("sample-sync-detail")
                }.frame(maxWidth: .infinity, alignment: .leading)
                if !store.sampleSyncBusy {
                    Button { intake.dismissSampleNotice() } label: {
                        Image(systemName: "xmark").frame(width: 44, height: 44)
                    }.accessibilityLabel(NativeText.text("common.done")).accessibilityIdentifier("sample-sync-dismiss")
                }
            }
            if store.sampleSyncBusy, !refreshing, let progress = intake.sampleProgress, progress.total > 0 {
                ProgressView(value: Double(progress.processed), total: Double(progress.total)).tint(Palette.selection)
                    .accessibilityLabel(NativeText.text("build.samplesSyncing"))
            }
            if !store.sampleSyncBusy {
                HStack(spacing: 12) {
                    if partial, let id = intake.syncingSampleID {
                        Button(NativeText.literal("Try Again")) { Task { await store.syncSample(id: id) } }
                            .frame(minHeight: 44).accessibilityIdentifier("sample-sync-retry")
                    }
                    Button(NativeText.text("sync.viewPassport"), action: viewPassport)
                        .frame(minHeight: 44).accessibilityIdentifier("sample-sync-passport")
                }.font(.subheadline.weight(.semibold))
            }
        }.foregroundStyle(Palette.ink).padding(.horizontal, 20).padding(.vertical, 12)
            .frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface)
            .overlay(alignment: .top) { Rectangle().fill(Palette.line).frame(height: 1) }
            .accessibilityElement(children: .contain).accessibilityIdentifier("sample-sync-banner")
    }
}
