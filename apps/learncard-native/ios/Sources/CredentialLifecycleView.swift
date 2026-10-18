import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

/// A scoped lifecycle result; a valid signature does not imply a credential is still usable.
struct CredentialLifecycleView: View {
    @Environment(\.locale) private var locale
    let status: CredentialStatusStore
    private var state: CredentialStatusCheck.State {
        guard let result = status.result else { return .unavailable }
        if [.active, .revoked, .suspended].contains(result.state), !result.confirmed { return .unavailable }
        return result.state
    }
    private var caution: Bool { state == .revoked || state == .suspended }
    private var color: Color { caution ? Palette.errorInk : state == .active ? Palette.green : Palette.secondary }
    private var symbol: String {
        switch state {
        case .active: "checkmark.shield.fill"
        case .revoked: "xmark.seal.fill"
        case .suspended: "pause.circle.fill"
        case .unavailable, .notProvided: "questionmark.shield"
        }
    }
    private var titleKey: String {
        if status.loading && status.result == nil { return "checking" }
        if state == .active {
            let purposes = status.result?.purposes ?? []
            if !purposes.contains(.suspension) { return "notRevoked" }
            if !purposes.contains(.revocation) { return "notSuspended" }
        }
        return state.rawValue
    }
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                Group {
                    if status.loading && status.result == nil { ProgressView().tint(Palette.secondary) }
                    else { Image(systemName: symbol).font(.title2).foregroundStyle(color) }
                }.frame(width: 44, height: 44).background(color.opacity(0.08), in: Circle()).accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 5) {
                    Text(NativeText.text("credential.lifecycle.\(titleKey)"))
                        .font(.subheadline.weight(.semibold)).foregroundStyle(color)
                        .accessibilityIdentifier("credential-lifecycle-title")
                    Text(NativeText.text("credential.lifecycle.hint.\(status.loading && status.result == nil ? "checking" : state.rawValue)"))
                        .font(.footnote).foregroundStyle(Palette.secondary)
                }.fixedSize(horizontal: false, vertical: true)
            }
            if let result = status.result, result.confirmed, let date = result.checkedAt {
                Text(NativeText.text("credential.lifecycle.source.\(result.source!.rawValue)"))
                    .font(.caption).foregroundStyle(Palette.secondary)
                Text(NativeText.format("credential.lifecycle.checked", date.formatted(.dateTime.month(.abbreviated).day().hour().minute().locale(locale))))
                    .font(.caption).foregroundStyle(Palette.secondary).accessibilityIdentifier("credential-lifecycle-date")
            }
            if status.refreshFailed && status.result?.confirmed == true {
                Text(NativeText.text("credential.lifecycle.stale"))
                    .font(.footnote).foregroundStyle(Palette.secondary).accessibilityIdentifier("credential-lifecycle-stale")
            }
            Button { Task { await status.check() } } label: {
                HStack(spacing: 8) {
                    if status.loading { ProgressView().tint(Palette.green) }
                    else { Image(systemName: "arrow.clockwise") }
                    Text(NativeText.text(status.loading ? "credential.lifecycle.checking" : "credential.lifecycle.recheck"))
                }.font(.subheadline.weight(.semibold)).foregroundStyle(Palette.green)
                    .frame(minHeight: 44).contentShape(Rectangle())
            }.buttonStyle(CredentialPressStyle()).disabled(status.loading)
                .accessibilityIdentifier("credential-lifecycle-recheck")
        }.padding(16).frame(maxWidth: .infinity, alignment: .leading)
            .background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
            .accessibilityElement(children: .contain).accessibilityIdentifier("credential-lifecycle")
    }
}
