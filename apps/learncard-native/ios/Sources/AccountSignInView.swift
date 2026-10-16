import SwiftUI
import UniformTypeIdentifiers
import LearnCardNativeSDK

struct AccountRootView: View {
    @Environment(\.locale) private var nativeLocale
    @Environment(\.scenePhase) private var scenePhase
    @State private var account: AccountController
    init(account: AccountController = AccountController()) { _account = State(initialValue: account) }
    var body: some View {
        Group {
            if ["resetting", "reset_pending"].contains(account.phase) { StagingResetProgressView(account: account) }
            else if let store = account.store, !account.busy || store.snapshot != nil || store.error != nil { RootView(store: store, account: account) }
            else { AccountSignInView(account: account) }
        }
        .modifier(ClaimPresentation(flow: account.claims, store: account.store, recipient: account.state?.profileId))
        .task {
            await account.resume()
            if ProcessInfo.processInfo.arguments.contains("--request-test-code"), account.phase == "signIn" { await account.sendCode() }
        }
        .onChange(of: scenePhase) { _, new in
            // Lock synchronously, before SwiftUI replaces private account content.
            if new == .background { account.lock() }
            else { Task { await account.activityChanged(new == .active ? .active : .inactive) } }
        }
    }
}

struct AccountSignInView: View {
    @Environment(\.locale) private var nativeLocale
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Bindable var account: AccountController
    @State private var signupForm = SignupFormModel()
    @State private var code = ""
    @State private var method = AccessRecoveryMethod.email
    @State private var phrase = ""
    @State private var emailShare = ""
    @State private var fileContents = ""
    @State private var fileName = ""
    @State private var password = ""
    @State private var importing = false
    @State private var importAllowed = false
    @State private var sendingCode = false
    @State private var choosingMethod = false
    @FocusState private var focused: Input?
    private enum Input: Hashable { case code, phrase, emailKey, password }
    private var signingIn: Bool { ["signIn", "idle"].contains(account.phase) }
    private var recovering: Bool { ["needs_recovery", "recovery"].contains(account.phase) }
    private var signupPhase: Bool { ["needs_setup", "missing_profile", "finish_setup", "pending_approval"].contains(account.phase) }
    private var supportedPhase: Bool { signingIn || account.phase == "code" || recovering }

    private var transitionMode: AccountMotionMode {
        if sendingCode { return .sending }
        return switch account.phase {
        case "signIn", "idle": .sending
        case "code": .verifying
        case "needs_recovery", "recovery": .recovering
        case "locked": account.busy ? .reconnect : .locked
        default: account.user == nil ? .launch : .reconnect
        }
    }

    var body: some View {
        NavigationStack {
            if (account.busy && !signupPhase) || account.phase == "loading" || account.phase == "locked" {
                AccountTransitionView(mode: transitionMode, busy: account.busy,
                                      error: account.error, canSignOut: account.user != nil,
                                      hasPendingClaim: account.claims.link != nil,
                                      retry: { Task { await account.resume() } },
                                      signOut: { Task { await account.signOut(forget: false) } },
                                      scan: { account.claims.open() })
            } else if signupPhase { NativeSignupView(account: account, model: signupForm).toolbar(.hidden, for: .navigationBar) }
            else { accessForm.toolbar(.hidden, for: .navigationBar) }
        }
        .onChange(of: code) { _, value in
            // Preserve one real field for autofill, paste and VoiceOver; normalize localized digits.
            let digits = String(value.compactMap { character -> Character? in
                guard let digit = character.wholeNumberValue, (0...9).contains(digit) else { return nil }
                return Character(String(digit))
            }.prefix(6))
            if code != digits { code = digits }
        }
        .onChange(of: account.phase) { _, phase in
            if ["locked", "signIn", "ready"].contains(phase) {
                clearInputs(); signupForm.clear(); focused = nil; choosingMethod = false; importing = false
            }
        }
        .onChange(of: method) { _, _ in clearRecoveryInputs(); focused = nil }
        .sheet(isPresented: $choosingMethod) { AccessRecoveryMethodSheet(method: $method) }
        .fileImporter(isPresented: $importing, allowedContentTypes: [.json, .plainText]) { result in
            // Ignore results after backgrounding or a method change invalidates private input.
            guard importAllowed, recovering, !account.busy else { return }
            importAllowed = false
            do {
                let url = try result.get()
                guard url.startAccessingSecurityScopedResource() else { throw AccountError.recovery }
                defer { url.stopAccessingSecurityScopedResource() }
                let data = try Data(contentsOf: url)
                guard data.count <= 256 * 1024, let contents = String(data: data, encoding: .utf8) else { throw AccountError.recovery }
                fileContents = contents; fileName = url.lastPathComponent
            } catch {
                if (error as? CocoaError)?.code != .userCancelled { account.error = NativeText.text("access.backupError") }
            }
        }
    }

    private var accessForm: some View {
        ScrollViewReader { proxy in
            VStack(spacing: 0) {
                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        LearnCardBrand().accessibilityLabel("LearnCard")
                        AccountAccessHero(phase: account.phase)
                        if let error = account.error { AccountAccessNotice(text: error, error: true).accessibilityIdentifier("account-error") }
                        if account.claims.link != nil { AccountAccessNotice(text: NativeText.text("claims.waitingSignIn")) }
                        if signingIn { emailPanel }
                        else if account.phase == "code" { codePanel }
                        else if recovering { recoveryPanel }
                        else { setupPanel }
                        Button { focused = nil; account.claims.open() } label: {
                            HStack(spacing: 14) {
                                Image(systemName: "qrcode.viewfinder").font(.title2).foregroundStyle(Palette.cardInk)
                                    .frame(width: 44, height: 44).background(Palette.blueCard, in: RoundedRectangle(cornerRadius: 13)).accessibilityHidden(true)
                                Text(NativeText.text("claims.title")).font(.headline).frame(maxWidth: .infinity, alignment: .leading)
                                Image(systemName: "chevron.forward").font(.subheadline).accessibilityHidden(true)
                            }.foregroundStyle(Palette.ink).padding(14).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
                        }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("signed-out-scan")
                        if account.user != nil {
                            Button(NativeText.text("access.signOut")) { clearInputs(); Task { await account.signOut(forget: false) } }
                                .font(.body.weight(.semibold)).foregroundStyle(Palette.secondary).frame(maxWidth: .infinity, minHeight: 44)
                                .accessibilityIdentifier("account-sign-out")
                        }
                    }.padding(20).frame(maxWidth: 620).frame(maxWidth: .infinity)
                }.scrollDismissesKeyboard(.interactively).clipped().accessibilityIdentifier("account-access-form")
                    .onChange(of: focused) { _, value in
                        if let value { withAnimation(reduceMotion ? nil : .easeOut(duration: 0.22)) { proxy.scrollTo(value, anchor: .top) } }
                    }
                if supportedPhase { actionTray }
            }.background(Palette.paper).foregroundStyle(Palette.ink)
        }
    }

    private var emailPanel: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(NativeText.text("access.email")).font(.subheadline.weight(.semibold))
            TextField(NativeText.text("signup.emailPlaceholder"), text: $account.email).font(.body.weight(.medium))
                .keyboardType(.emailAddress).textContentType(.emailAddress).textInputAutocapitalization(.never).autocorrectionDisabled().privacySensitive()
                .environment(\.layoutDirection, .leftToRight).accessibilityIdentifier("account-email")
        }.frame(maxWidth: .infinity, alignment: .leading).padding(20)
            .background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
    }

    private var codePanel: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(NativeText.format("access.codeSent", account.email)).font(.body).foregroundStyle(Palette.secondary)
            VStack(alignment: .leading, spacing: 12) {
                Text(NativeText.text("access.code")).font(.subheadline.weight(.semibold))
                TextField("000000", text: $code).font(.system(.title, design: .monospaced).weight(.semibold)).tracking(6)
                    .keyboardType(.numberPad).textContentType(.oneTimeCode).environment(\.layoutDirection, .leftToRight)
                    .focused($focused, equals: .code).privacySensitive().frame(minHeight: 48)
                    .accessibilityLabel(NativeText.text("access.code")).accessibilityIdentifier("sign-in-code")
            }.padding(20).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22)).id(Input.code)
            Button(NativeText.text("access.resend")) { sendCode() }
                .font(.body.weight(.semibold)).foregroundStyle(Palette.ink).frame(maxWidth: .infinity, minHeight: 44)
                .accessibilityIdentifier("resend-sign-in-code")
        }
    }

    private var recoveryPanel: some View {
        VStack(alignment: .leading, spacing: 16) {
            Button { focused = nil; choosingMethod = true } label: {
                HStack(spacing: 14) {
                    Image(method.image).resizable().scaledToFit().padding(8).frame(width: 44, height: 44)
                        .background(method.tint, in: RoundedRectangle(cornerRadius: 13)).accessibilityHidden(true)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(NativeText.text("access.methodLabel")).font(.caption).foregroundStyle(Palette.secondary)
                        Text(method.title).font(.headline)
                    }.frame(maxWidth: .infinity, alignment: .leading)
                    Image(systemName: "chevron.down").font(.subheadline).accessibilityHidden(true)
                }.foregroundStyle(Palette.ink).padding(16).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
            }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("choose-recovery-method")
            switch method {
            case .email:
                secretField("access.emailKey", value: $emailShare, input: .emailKey, identifier: "email-recovery-key")
                Text(NativeText.text("access.emailKey.detail")).font(.subheadline).foregroundStyle(Palette.secondary)
            case .phrase:
                secretField("access.savedWords", value: $phrase, input: .phrase, identifier: "recovery-phrase")
                Text(NativeText.text("access.savedWords.detail")).font(.subheadline).foregroundStyle(Palette.secondary)
            case .backup:
                Button { focused = nil; importAllowed = true; importing = true } label: {
                    Label(fileName.isEmpty ? NativeText.text("access.chooseBackup") : fileName, systemImage: "doc.badge.plus")
                        .font(.body.weight(.semibold)).frame(maxWidth: .infinity, minHeight: 48, alignment: .leading)
                        .padding(16).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
                }.buttonStyle(.plain).accessibilityIdentifier("choose-recovery-backup")
                secretField("access.backupPassword", value: $password, input: .password, identifier: "backup-password")
            }
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "iphone").font(.title3).foregroundStyle(Palette.ink).accessibilityHidden(true)
                Text(NativeText.text("access.remember")).font(.subheadline).foregroundStyle(Palette.secondary)
            }.padding(16).frame(maxWidth: .infinity, alignment: .leading)
                .background(Palette.surface, in: RoundedRectangle(cornerRadius: 20))
        }
    }

    private func secretField(_ key: String, value: Binding<String>, input: Input, identifier: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(NativeText.text(key)).font(.subheadline.weight(.semibold))
            SecureField(NativeText.text(key), text: value).font(.body).textInputAutocapitalization(.never).autocorrectionDisabled()
                .textContentType(nil).focused($focused, equals: input).privacySensitive().frame(minHeight: 48)
                .accessibilityIdentifier(identifier).submitLabel(.done).onSubmit { focused = nil }
        }.padding(20).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22)).id(input)
    }

    private var actionTray: some View {
        Group {
            if signingIn {
                PrimaryButton(title: NativeText.text("access.sendCode"), disabled: FirebaseSession.normalizedEmail(account.email) == nil, fill: Palette.selection) { sendCode() }
                    .accessibilityIdentifier("send-sign-in-code")
            } else if account.phase == "code" {
                PrimaryButton(title: NativeText.text("access.signIn"), disabled: code.count != 6, fill: Palette.selection) {
                    let value = code; code = ""; focused = nil; Task { await account.verify(value) }
                }.accessibilityIdentifier("verify-sign-in-code")
            } else {
                PrimaryButton(title: NativeText.text("access.recover"), disabled: recoveryEmpty, fill: Palette.selection) {
                    let selectedMethod = method.rawValue
                    let savedPhrase = phrase, savedFile = fileContents, savedPassword = password, savedEmail = emailShare
                    clearRecoveryInputs(); focused = nil
                    Task { await account.recover(method: selectedMethod, phrase: savedPhrase, fileContents: savedFile, password: savedPassword, emailShare: savedEmail) }
                }.accessibilityIdentifier("recover-account")
            }
        }.frame(maxWidth: 580).frame(maxWidth: .infinity).padding(20).background(Palette.surface)
    }
    private var recoveryEmpty: Bool {
        switch method {
        case .email: emailShare.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        case .phrase: phrase.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        case .backup: fileContents.isEmpty || password.isEmpty
        }
    }
    private var setupPanel: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(NativeText.text(account.phase == "missing_profile" ? "access.missingProfile" : "access.finishSetup")).font(.body)
            Link(NativeText.text("access.openWeb"), destination: URL(string: "https://staging.learncard.ai")!)
            Button(NativeText.literal("Try Again")) { Task { await account.resume() } }.accessibilityIdentifier("account-setup-retry")
        }.padding(20).frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
    }
    private func sendCode() {
        code = ""; focused = nil; sendingCode = true
        Task { await account.sendCode(); sendingCode = false }
    }
    private func clearRecoveryInputs() { importAllowed = false; phrase = ""; emailShare = ""; password = ""; fileContents = ""; fileName = "" }
    private func clearInputs() { code = ""; clearRecoveryInputs() }
}
