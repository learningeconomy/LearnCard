import SwiftUI
import LearnCardNativeSDK

/// Experiment-only staging reset. The shared Firebase identity remains signed in.
struct StagingResetView: View {
    @Bindable var account: AccountController
    @State private var confirmation = ""
    private var matches: Bool { FirebaseSession.normalizedEmail(confirmation) == FirebaseSession.normalizedEmail(account.user?.email ?? "") && !confirmation.isEmpty }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                PageHeading(title: NativeText.text("reset.title"), identifier: "staging-reset")
                Image("AccessRecoveryIllustration").resizable().scaledToFit().frame(height: 120).frame(maxWidth: .infinity).accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 12) {
                    Text(NativeText.text("reset.scope")).font(.headline)
                    Text(NativeText.text("reset.kept")).font(.body)
                    Text(NativeText.text("reset.copies")).font(.subheadline).foregroundStyle(Palette.secondary)
                }.padding(20).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
                VStack(alignment: .leading, spacing: 12) {
                    Text(NativeText.text("reset.confirm")).font(.headline)
                    Text(account.user?.email ?? "").font(.body).textSelection(.enabled).environment(\.layoutDirection, .leftToRight)
                    TextField(NativeText.text("reset.email"), text: $confirmation)
                        .keyboardType(.emailAddress).textInputAutocapitalization(.never).autocorrectionDisabled()
                        .padding(16).background(Palette.surface, in: RoundedRectangle(cornerRadius: 16))
                        .environment(\.layoutDirection, .leftToRight).accessibilityIdentifier("reset-email")
                }
                if let error = account.error { AccountAccessNotice(text: error, error: true) }
                Button { Task { await account.resetStagingAccount(confirmation: confirmation) } } label: {
                    Text(NativeText.text("reset.action")).font(.headline).frame(maxWidth: .infinity).padding(18)
                        .foregroundStyle(.white).background(Color.red, in: RoundedRectangle(cornerRadius: 20))
                }.disabled(!matches || account.busy).opacity(matches ? 1 : 0.4).accessibilityIdentifier("reset-confirm")
            }.padding(20).frame(maxWidth: 620).frame(maxWidth: .infinity)
        }.background(Palette.paper).foregroundStyle(Palette.ink).navigationTitle("").navigationBarTitleDisplayMode(.inline)
    }
}

struct StagingResetProgressView: View {
    @Bindable var account: AccountController
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                LearnCardBrand()
                Image("AccessRecoveryIllustration").resizable().scaledToFit().frame(height: 180).frame(maxWidth: .infinity).accessibilityHidden(true)
                Text(NativeText.text(account.busy ? "reset.working" : "reset.pending")).font(.largeTitle.bold())
                Text(NativeText.text("reset.kept")).font(.body)
                if let stage = account.state?.reset?.stage { Text(NativeText.text("reset.stage.\(stage)")).font(.headline).accessibilityIdentifier("reset-stage") }
                if account.busy { ProgressView().frame(maxWidth: .infinity).accessibilityIdentifier("reset-progress") }
                if let error = account.error { AccountAccessNotice(text: error, error: true).accessibilityIdentifier("reset-error") }
                if !account.busy {
                    Button(NativeText.text("reset.resume")) { Task { await account.resumeStagingReset() } }
                        .buttonStyle(.borderedProminent).tint(Palette.ink).accessibilityIdentifier("reset-resume")
                    if account.state?.methods.isEmpty == false {
                        Button(NativeText.text("reset.restore")) { account.openResetRecovery() }.accessibilityIdentifier("reset-restore")
                    }
                    Button(NativeText.text("access.signOut")) { Task { await account.signOut(forget: false) } }.accessibilityIdentifier("account-sign-out")
                }
            }.padding(24).frame(maxWidth: 620).frame(maxWidth: .infinity)
        }.background(Palette.paper).foregroundStyle(Palette.ink).accessibilityIdentifier("staging-reset-progress")
    }
}
