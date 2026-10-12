import SwiftUI
import UniformTypeIdentifiers
import LearnCardNativeSDK

struct AccountRootView: View {
    @Environment(\.scenePhase) private var scenePhase
    @State private var account = AccountController()
    var body: some View {
        Group {
            if let store = account.store { RootView(store: store, account: account) }
            else { AccountSignInView(account: account) }
        }
        .task {
            await account.resume()
            if ProcessInfo.processInfo.arguments.contains("--request-test-code"), account.phase == "signIn" { await account.sendCode() }
        }
        .onChange(of: scenePhase) { old, new in
            if new == .background { account.lock() }
            else if new == .active, old == .background { Task { await account.resume() } }
        }
    }
}

struct AccountSignInView: View {
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
                    Text(account.phase == "signIn" || account.phase == "code" ? "Your credentials, with you." : "Restore access on this iPhone.")
                        .font(.title2.weight(.semibold))
                    Text("Staging test account").font(.caption).foregroundStyle(Palette.secondary)
                }.listRowBackground(Color.clear)
                if let error = account.error {
                    Section { Label(error, systemImage: "exclamationmark.circle").foregroundStyle(Palette.ink) }
                }
                if account.busy {
                    Section { HStack { ProgressView(); Text("Connecting your account…") }.accessibilityIdentifier("account-loading") }
                }
                switch account.phase {
                case "loading", "locked":
                    EmptyView()
                case "signIn", "idle":
                    Section("Sign in") {
                        Text(account.email)
                        PrimaryButton(title: "Send Sign-In Code", loading: account.busy, disabled: account.busy) {
                            Task { await account.sendCode() }
                        }.accessibilityIdentifier("send-sign-in-code")
                    }
                case "code":
                    Section("Check your email") {
                        Text("Enter the code sent to \(account.email).")
                        TextField("Six-digit code", text: $code).keyboardType(.numberPad).textContentType(.oneTimeCode)
                            .accessibilityIdentifier("sign-in-code")
                        PrimaryButton(title: "Sign In", loading: account.busy, disabled: account.busy || code.count != 6) {
                            let value = code; code = ""
                            Task { await account.verify(value) }
                        }.accessibilityIdentifier("verify-sign-in-code")
                        Button("Send a New Code") { Task { await account.sendCode() } }.disabled(account.busy)
                    }
                case "needs_recovery", "recovery":
                    Section("Choose how to restore access") {
                        Text("After recovery, this iPhone can remember your account.")
                            .font(.subheadline).foregroundStyle(Palette.secondary)
                        Picker("Method", selection: $method) {
                            Text("Recovery email").tag("email")
                            Text("Saved recovery words").tag("phrase")
                            Text("Backup file").tag("backup")
                        }
                        if method == "phrase" {
                            Text("Use the words you saved when setting up recovery.").font(.caption).foregroundStyle(Palette.secondary)
                            SecureField("Saved recovery words", text: $phrase).textInputAutocapitalization(.never).autocorrectionDisabled()
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
                        Button("Try Again") { Task { await account.resume() } }.disabled(account.busy)
                    }
                }
                if account.user != nil {
                    Section { Button("Sign Out") { Task { await account.signOut(forget: false) } }.disabled(account.busy) }
                }
            }
            .foregroundStyle(Palette.ink)
            .navigationTitle("LearnCard")
            .navigationBarTitleDisplayMode(.inline)
            .scrollDismissesKeyboard(.interactively)
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
