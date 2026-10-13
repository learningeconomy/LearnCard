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
            if let store = account.store { RootView(store: store, account: account) }
            else { AccountSignInView(account: account) }
        }
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
    @Bindable var account: AccountController
    @State private var code = ""
    @State private var method = "email"
    @State private var phrase = ""
    @State private var emailShare = ""
    @State private var fileContents = ""
    @State private var fileName = ""
    @State private var password = ""
    @State private var importing = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    LearnCardBrand().padding(.vertical, 12)
                    Text(account.phase == "loading" || account.phase == "locked" ? "Your account, ready when you are." : account.phase == "signIn" || account.phase == "code" ? "Your credentials, with you." : "Restore access on this iPhone.")
                        .font(.title2.weight(.semibold))
                    Text("Staging test account").font(.caption).foregroundStyle(Palette.secondary)
                }.listRowBackground(Color.clear)
                if let error = account.error {
                    Section { Label(error, systemImage: "exclamationmark.circle").foregroundStyle(Palette.ink).accessibilityIdentifier("account-error") }
                }
                if account.busy {
                    Section { HStack { ProgressView(); Text("Connecting your account…") }.accessibilityIdentifier("account-loading") }
                }
                switch account.phase {
                case "loading", "locked":
                    if !account.busy {
                        Section {
                            PrimaryButton(title: "Continue", loading: account.busy) { Task { await account.resume() } }
                                .accessibilityIdentifier("resume-saved-account")
                        }
                    }
                case "signIn", "idle":
                    Section(NativeText.literal("Sign in")) {
                        Text(account.email)
                        PrimaryButton(title: "Send Sign-In Code", loading: account.busy, disabled: account.busy) {
                            Task { await account.sendCode() }
                        }.accessibilityIdentifier("send-sign-in-code")
                    }
                case "code":
                    Section("Check your email") {
                        Text("Enter the code sent to \(account.email).")
                        TextField(NativeText.literal("Six-digit code"), text: $code).keyboardType(.numberPad).textContentType(.oneTimeCode)
                            .accessibilityIdentifier("sign-in-code")
                        PrimaryButton(title: "Sign In", loading: account.busy, disabled: account.busy || code.count != 6) {
                            let value = code; code = ""
                            Task { await account.verify(value) }
                        }.accessibilityIdentifier("verify-sign-in-code")
                        Button(NativeText.literal("Send a New Code")) { Task { await account.sendCode() } }.disabled(account.busy)
                    }
                case "needs_recovery", "recovery":
                    Section(NativeText.literal("Choose how to restore access")) {
                        Text("After recovery, this iPhone can remember your account.")
                            .font(.subheadline).foregroundStyle(Palette.secondary)
                        Picker("Method", selection: $method) {
                            Text(NativeText.literal("Recovery email")).tag("email")
                            Text(NativeText.literal("Saved recovery words")).tag("phrase")
                            Text(NativeText.literal("Backup file")).tag("backup")
                        }
                        if method == "phrase" {
                            Text("Use the words you saved when setting up recovery.").font(.caption).foregroundStyle(Palette.secondary)
                            SecureField(NativeText.literal("Saved recovery words"), text: $phrase).textInputAutocapitalization(.never).autocorrectionDisabled()
                                .accessibilityIdentifier("recovery-phrase")
                        } else if method == "backup" {
                            Button(fileName.isEmpty ? "Choose Backup File" : fileName) { importing = true }
                            SecureField("Backup password", text: $password).accessibilityIdentifier("backup-password")
                        } else {
                            Text("Use the recovery key from a LearnCard recovery email.").font(.caption).foregroundStyle(Palette.secondary)
                            SecureField("Recovery key from your email", text: $emailShare).textInputAutocapitalization(.never).autocorrectionDisabled()
                                .accessibilityIdentifier("email-recovery-key")
                        }
                        PrimaryButton(title: "Recover Account", loading: account.busy,
                            disabled: account.busy || (method == "phrase" ? phrase.isEmpty : method == "backup" ? fileContents.isEmpty || password.isEmpty : emailShare.isEmpty)) {
                            let savedPhrase = phrase, savedFile = fileContents, savedPassword = password, savedEmail = emailShare
                            phrase = ""; password = ""; emailShare = ""; fileContents = ""; fileName = ""
                            Task { await account.recover(method: method, phrase: savedPhrase, fileContents: savedFile, password: savedPassword, emailShare: savedEmail) }
                        }.accessibilityIdentifier("recover-account")
                    }
                default:
                    Section {
                        Text(account.phase == "missing_profile" ? "Your account is restored, but its staging profile hasn't been set up yet." : "Complete account setup or upgrade in staging LearnCard, then try again here.")
                        Link("Open Staging LearnCard", destination: URL(string: "https://staging.learncard.ai")!)
                        Button(NativeText.literal("Try Again")) { Task { await account.resume() } }.disabled(account.busy)
                    }
                }
                if account.user != nil {
                    Section { Button("Sign Out") { Task { await account.signOut(forget: false) } }.accessibilityIdentifier("account-sign-out") }
                }
            }
            .foregroundStyle(Palette.ink)
            .navigationTitle("LearnCard")
            .navigationBarTitleDisplayMode(.inline)
            .scrollDismissesKeyboard(.interactively)
        }
        .onChange(of: account.phase) { _, phase in
            if ["locked", "signIn", "ready"].contains(phase) {
                code = ""; phrase = ""; emailShare = ""; password = ""; fileContents = ""; fileName = ""
            }
        }
        .fileImporter(isPresented: $importing, allowedContentTypes: [.json, .plainText]) { result in
            do {
                let url = try result.get()
                guard url.startAccessingSecurityScopedResource() else { throw AccountError.recovery }
                defer { url.stopAccessingSecurityScopedResource() }
                let data = try Data(contentsOf: url)
                guard data.count <= 256 * 1024, let contents = String(data: data, encoding: .utf8) else { throw AccountError.recovery }
                fileContents = contents; fileName = url.lastPathComponent
            } catch { account.error = "Couldn't open that backup file. Please try again." }
        }
    }
}
