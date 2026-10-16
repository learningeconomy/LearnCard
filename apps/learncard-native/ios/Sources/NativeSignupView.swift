import SwiftUI
import PhotosUI
import UniformTypeIdentifiers
import LearnCardNativeSDK

@Observable final class SignupFormModel {
    var draft = SignupDraft()
    var step = 0
    var password = ""
    var confirmation = ""
    var photo: Data?
    var restored = false
    func clear() { draft = SignupDraft(); step = 0; password = ""; confirmation = ""; photo = nil; restored = false }
}
private func signupText(_ key: String) -> String { NativeText.text("signup.\(key)") }

struct NativeSignupView: View {
    @Environment(\.locale) private var locale
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var textSize
    @Bindable var account: AccountController
    @Bindable var model: SignupFormModel
    @State private var policy = try? SignupPolicy.load()
    @State private var birthSheet = false
    @State private var countrySheet = false
    @State private var photo: PhotosPickerItem?
    @State private var preparingPhoto = false
    @State private var availability: Bool?
    @State private var checking = false
    @State private var exporting = false
    @State private var exportID: String?
    @State private var localError: String?
    @FocusState private var focused: Field?
    private enum Field: Hashable { case name, handle, guardian, password, confirmation }
    private var eligibility: SignupEligibility? { try? policy?.eligibility(dob: model.draft.dob, country: model.draft.country) }
    private var birthLabel: String {
        let parts = model.draft.dob.split(separator: "-").compactMap { Int($0) }
        if parts.count == 3, let date = Calendar(identifier: .gregorian).date(from: DateComponents(year: parts[0], month: parts[1], day: parts[2])) {
            return date.formatted(.dateTime.year().month(.wide).day().locale(locale))
        }
        return signupText("birthDate.choose")
    }
    private var pending: Bool { account.phase == "pending_approval" }
    private var lockedDraft: Bool { account.signupBackup != nil }
    private var canContinueAge: Bool {
        guard let eligibility else { return false }
        return eligibility.underage || ((!eligibility.teenNotice || model.draft.teenAcknowledged) && (!eligibility.guardianRequired || FirebaseSession.normalizedEmail(model.draft.guardianEmail ?? "") != nil))
    }
    private var validDraft: Bool {
        guard let policy else { return false }
        do { try policy.validate(model.draft); return true } catch { return false }
    }
    private var canSave: Bool { validDraft && model.password.count >= 12 && model.password.count <= 256 && model.password == model.confirmation }
    private var title: String { signupText(pending ? "approval.title" : ["about.title", "profile.title", "choices.title"][model.step]) }
    private var art: String { pending ? "AccessEmailIllustration" : ["SignupCalendarIllustration", "AccessPassportIllustration", "SignupPrivacyIllustration"][model.step] }

    var body: some View {
        ScrollViewReader { proxy in
            VStack(spacing: 0) {
                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        LearnCardBrand()
                        if !pending { progress }
                        PageHeading(title: title, identifier: pending ? "signup-approval" : "signup-step-\(model.step)")
                        Image(art).resizable().scaledToFit().frame(maxWidth: .infinity).frame(height: textSize.isAccessibilitySize ? 86 : 136).accessibilityHidden(true)
                        if let error = localError ?? account.error { AccountAccessNotice(text: error, error: true).accessibilityIdentifier("signup-error") }
                        if account.claims.link != nil { AccountAccessNotice(text: NativeText.text("claims.waitingSignIn")) }
                        if pending { approval }
                        else if policy == nil { AccountAccessNotice(text: signupText("error.unavailable"), error: true) }
                        else if model.step == 0 { ageFields }
                        else if model.step == 1 { profileFields }
                        else { choices }
                        if !pending && model.step > 0 && !lockedDraft {
                            Button(signupText("back")) { focused = nil; model.step -= 1 }.font(.body.weight(.semibold)).frame(minHeight: 44).disabled(account.busy).accessibilityIdentifier("signup-back")
                        }
                        Button(NativeText.text("access.signOut")) { model.clear(); Task { await account.signOut(forget: false) } }
                            .font(.subheadline.weight(.semibold)).foregroundStyle(Palette.secondary).frame(maxWidth: .infinity, minHeight: 44).disabled(account.busy).accessibilityIdentifier("account-sign-out")
                    }.padding(20).frame(maxWidth: 620).frame(maxWidth: .infinity)
                }.scrollDismissesKeyboard(.interactively).clipped().accessibilityIdentifier("signup-form")
                    .onChange(of: focused) { _, field in if let field { withAnimation(reduceMotion ? nil : .easeOut(duration: 0.22)) { proxy.scrollTo(field, anchor: .top) } } }
                actionTray
            }.background(Palette.paper).foregroundStyle(Palette.ink)
        }
        // A fresh content identity prevents async setup from retaining the previous step's fields.
        .id("\(model.step)-\(account.phase)")
        .onAppear {
            if !model.restored {
                model.restored = true
                if let draft = account.state?.signup?.draft { model.draft = draft; model.step = 2 }
            }
        }
        .sheet(isPresented: $birthSheet) { SignupBirthDateSheet(value: $model.draft.dob) }
        .sheet(isPresented: $countrySheet) { SignupCountrySheet(value: $model.draft.country, countries: policy?.countries ?? [:]) }
        .task(id: model.draft.profileId + "|" + model.draft.name) {
            availability = nil; checking = false
            let value = model.draft.profileId
            guard model.draft.validProfile, !pending, !lockedDraft else { return }
            checking = true
            do {
                try await Task.sleep(for: .milliseconds(400)); try Task.checkCancellation()
                let result = try await account.signupAvailability(value)
                if !Task.isCancelled && model.draft.profileId == value { availability = result; checking = false }
            } catch { if !Task.isCancelled { checking = false; availability = nil } }
        }
        .task(id: photo) {
            guard let photo else { return }; preparingPhoto = true
            defer { if !Task.isCancelled { preparingPhoto = false } }
            do {
                guard let data = try await photo.loadTransferable(type: Data.self) else { throw AccountError.unavailable }
                let prepared = try await Task.detached(priority: .userInitiated) { try ProfilePhoto.prepare(data) }.value
                try Task.checkCancellation(); model.photo = prepared
            } catch { if !Task.isCancelled { localError = NativeText.text("profile.photo.error") } }
        }
        .fileExporter(isPresented: $exporting, document: account.signupBackup.map { SignupBackupDocument(contents: $0.contents) }, contentType: .json, defaultFilename: "LearnCard-Recovery") { result in
            guard let id = exportID, account.signupBackup?.id == id, !model.password.isEmpty else { return }
            switch result {
            case .success(let url):
                do {
                    let access = url.startAccessingSecurityScopedResource(); defer { if access { url.stopAccessingSecurityScopedResource() } }
                    guard try Data(contentsOf: url) == Data((account.signupBackup?.contents ?? "").utf8) else { throw AccountError.storage }
                    focused = nil; Task { await account.confirmSignupBackup(password: model.password) }
                } catch { localError = signupText("backup.saveError") }
            case .failure(let error): if (error as? CocoaError)?.code != .userCancelled { localError = signupText("backup.saveError") }
            }
        }
    }
    private var progress: some View {
        HStack(alignment: .top, spacing: 8) {
            ForEach(0..<3) { index in
                VStack(spacing: 7) {
                    Text(index < model.step ? "✓" : "\(index + 1)").font(.subheadline.bold()).frame(width: 30, height: 30)
                        .foregroundStyle(index <= model.step ? Palette.cardInk : Palette.secondary)
                        .background(index <= model.step ? Palette.blueCard : Palette.surface, in: Circle())
                    Text(signupText(["about", "profile", "choices"][index])).font(.caption.weight(index == model.step ? .bold : .medium)).multilineTextAlignment(.center)
                }.frame(maxWidth: .infinity)
            }
        }.accessibilityElement(children: .ignore).accessibilityLabel(signupText(["about", "profile", "choices"][model.step])).accessibilityValue("\(model.step + 1) / 3")
    }
    private var ageFields: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(signupText("about.detail")).font(.body).foregroundStyle(Palette.secondary)
            selector(title: signupText("birthDate"), value: birthLabel, symbol: "calendar", tint: Palette.blueCard, id: "signup-birth-date") { focused = nil; birthSheet = true }
            selector(title: signupText("country"), value: model.draft.country.isEmpty ? signupText("country.choose") : locale.localizedString(forRegionCode: model.draft.country) ?? model.draft.country, symbol: "globe", tint: Palette.studiesCard, id: "signup-country") { focused = nil; countrySheet = true }
            if let eligibility {
                if eligibility.underage {
                    AccountAccessNotice(text: signupText("underage.detail"), symbol: "person.2")
                    Link(signupText("underage.family"), destination: URL(string: "https://staging.learncard.app/login?redirectTo=%2Ffamilies%3FcreateFamily%3Dtrue")!).font(.headline).accessibilityIdentifier("signup-family-handoff")
                } else if eligibility.guardianRequired {
                    Text(signupText("guardian.detail")).font(.subheadline).foregroundStyle(Palette.secondary)
                    field(signupText("guardian.email"), value: Binding(get: { model.draft.guardianEmail ?? "" }, set: { model.draft.guardianEmail = $0 }), focus: .guardian, id: "signup-guardian-email", email: true)
                } else if eligibility.teenNotice {
                    Toggle(signupText("teen.notice"), isOn: $model.draft.teenAcknowledged).font(.subheadline).tint(Palette.green).padding(16).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22)).accessibilityIdentifier("signup-teen-notice")
                }
            }
        }
    }
    private var profileFields: some View {
        // PhotosPicker builds its label in a Sendable closure; pass immutable values.
        let data = model.photo, working = preparingPhoto, large = textSize.isAccessibilitySize
        let photoTitle = signupText(model.photo == nil ? "photo.add" : "photo.change")
        let photoHint = signupText("photo.hint")
        let preparingTitle = NativeText.text("profile.photo.preparing")
        return VStack(alignment: .leading, spacing: 16) {
            PhotosPicker(selection: $photo, matching: .images) {
                SignupPhotoLabel(data: data, working: working, large: large, title: photoTitle, hint: photoHint, preparingTitle: preparingTitle)
            }.buttonStyle(CredentialPressStyle()).disabled(preparingPhoto || account.busy)
                .accessibilityLabel(signupText(model.photo == nil ? "photo.add" : "photo.change")).accessibilityHint(signupText("photo.hint"))
                .accessibilityIdentifier("signup-photo")
            if model.photo != nil {
                Button(NativeText.text("profile.photo.remove")) { model.photo = nil; photo = nil }
                    .font(.subheadline.weight(.semibold)).frame(minHeight: 44).accessibilityIdentifier("signup-photo-remove")
            }
            field(signupText("name"), value: $model.draft.name, focus: .name, id: "signup-name")
            field(signupText("username"), value: $model.draft.profileId, focus: .handle, id: "signup-username")
                .onChange(of: model.draft.profileId) { _, value in model.draft.profileId = value.lowercased() }
            if checking { ProgressView(signupText("username.checking")) }
            else if let availability {
                Label(signupText(availability ? "username.available" : "username.taken"), systemImage: availability ? "checkmark.circle" : "exclamationmark.circle").font(.subheadline).foregroundStyle(availability ? Palette.green : Palette.errorInk).accessibilityIdentifier("signup-username-status")
            } else if model.draft.validProfile {
                Button(signupText("username.retry")) { let value = model.draft.profileId; checking = true; Task { availability = try? await account.signupAvailability(value); checking = false } }.font(.subheadline).accessibilityIdentifier("signup-username-retry")
            }
            Text(signupText("username.detail")).font(.subheadline).foregroundStyle(Palette.secondary)
        }
    }
    private var choices: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(signupText("choices.detail")).font(.body).foregroundStyle(Palette.secondary)
            VStack(spacing: 12) {
                preference("ai", symbol: "sparkles", value: $model.draft.aiEnabled)
                preference("analytics", symbol: "chart.bar", value: $model.draft.analyticsEnabled)
                preference("bugs", symbol: "ladybug", value: $model.draft.bugReportsEnabled)
            }.disabled(eligibility?.isMinor != false || lockedDraft)
            if eligibility?.isMinor == true { Text(signupText("choices.younger")).font(.subheadline).foregroundStyle(Palette.secondary) }
            HStack(spacing: 20) {
                Link(signupText("terms"), destination: URL(string: "https://www.learncard.com/learncard-terms-of-service")!)
                Link(signupText("privacy"), destination: URL(string: "https://www.learncard.com/learncard-privacy-policy")!)
            }.font(.subheadline.weight(.semibold))
            Toggle(signupText("agree"), isOn: $model.draft.termsAccepted).font(.subheadline).tint(Palette.green).disabled(lockedDraft).accessibilityIdentifier("signup-terms")
            if account.state?.signup?.recoveryConfirmed != true {
                VStack(alignment: .leading, spacing: 14) {
                    Text(signupText("backup.title")).font(.title3.bold())
                    Text(signupText("backup.detail")).font(.subheadline).foregroundStyle(Palette.secondary)
                    if account.state?.signup?.backupNeedsReplacement == true { Text(signupText("backup.replace")).font(.subheadline).foregroundStyle(Palette.secondary) }
                    secret(signupText("backup.password"), value: $model.password, focus: .password, id: "signup-backup-password")
                    secret(signupText("backup.confirm"), value: $model.confirmation, focus: .confirmation, id: "signup-backup-confirm")
                    if lockedDraft { Text(signupText("backup.ready")).font(.subheadline).accessibilityIdentifier("signup-backup-ready") }
                }.padding(20).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
            } else { AccountAccessNotice(text: signupText("backup.saved"), symbol: "checkmark.shield") }
        }
    }
    private var approval: some View {
        VStack(alignment: .leading, spacing: 16) {
            AccountAccessNotice(text: signupText(account.state?.signup?.guardianSent == true ? "approval.sent" : "approval.detail"), symbol: "envelope")
            field(signupText("guardian.email"), value: Binding(get: { model.draft.guardianEmail ?? "" }, set: { model.draft.guardianEmail = $0 }), focus: .guardian, id: "signup-guardian-email", email: true)
            Button(signupText("approval.send")) { focused = nil; Task { await account.sendSignupApproval(email: model.draft.guardianEmail ?? "") } }
                .font(.headline).frame(minHeight: 44).disabled(account.busy || FirebaseSession.normalizedEmail(model.draft.guardianEmail ?? "") == nil).accessibilityIdentifier("signup-send-approval")
            Text(signupText("approval.waiting")).font(.subheadline).foregroundStyle(Palette.secondary)
        }
    }
    private var actionTray: some View {
        Group {
            if pending {
                PrimaryButton(title: signupText(account.busy ? "approval.checking" : "approval.check"), loading: account.busy, disabled: account.busy, fill: Palette.selection) { focused = nil; Task { await account.refreshSignup() } }.accessibilityIdentifier("signup-check-approval")
            } else if model.step == 0 {
                PrimaryButton(title: signupText(account.busy ? "preparing" : "continue"), loading: account.busy, disabled: !canContinueAge || eligibility?.underage == true || account.busy, fill: Palette.selection) {
                    focused = nil; Task { if await account.prepareSignup(model.draft) { withAnimation(reduceMotion ? nil : .easeInOut(duration: 0.22)) { model.step = 1 } } }
                }.accessibilityIdentifier("signup-continue")
            } else if model.step == 1 {
                PrimaryButton(title: signupText("continue"), disabled: !model.draft.validProfile || availability != true || checking || preparingPhoto || account.busy, fill: Palette.selection) { focused = nil; withAnimation(reduceMotion ? nil : .easeInOut(duration: 0.22)) { model.step = 2 } }.accessibilityIdentifier("signup-continue")
            } else {
                PrimaryButton(title: signupText(account.busy ? "creating" : account.state?.signup?.recoveryConfirmed == true ? "finish" : "backup.save"), loading: account.busy,
                              disabled: account.busy || (account.state?.signup?.recoveryConfirmed == true ? !validDraft : !canSave), fill: Palette.selection) {
                    focused = nil; localError = nil
                    Task {
                        if account.state?.signup?.recoveryConfirmed == true { await account.completeSignup(model.draft, photo: model.photo) }
                        else {
                            let ready: Bool
                            if account.signupBackup != nil { ready = true }
                            else { ready = await account.prepareSignupBackup(model.draft, password: model.password, photo: model.photo) }
                            if ready { exportID = account.signupBackup?.id; exporting = true }
                        }
                    }
                }.accessibilityIdentifier("signup-create")
            }
        }.frame(maxWidth: 580).frame(maxWidth: .infinity).padding(20).background(Palette.surface)
    }
    private func selector(title: String, value: String, symbol: String, tint: Color, id: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 14) {
                Image(systemName: symbol).font(.title2).foregroundStyle(Palette.cardInk).frame(width: 44, height: 44).background(tint, in: RoundedRectangle(cornerRadius: 13)).accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 5) { Text(title).font(.subheadline.weight(.semibold)); Text(value).font(.body).foregroundStyle(Palette.secondary) }.frame(maxWidth: .infinity, alignment: .leading)
                Image(systemName: "chevron.down").accessibilityHidden(true)
            }.padding(16).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
        }.foregroundStyle(Palette.ink).buttonStyle(CredentialPressStyle()).disabled(account.busy).accessibilityIdentifier(id)
    }
    private func field(_ title: String, value: Binding<String>, focus: Field, id: String, email: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title).font(.subheadline.weight(.semibold))
            TextField(title, text: value).font(.body).textInputAutocapitalization(focus == .name ? .words : .never).autocorrectionDisabled().keyboardType(email ? .emailAddress : .default)
                .focused($focused, equals: focus).submitLabel(focus == .name ? .next : .done).onSubmit { focused = focus == .name ? .handle : nil }.privacySensitive().frame(minHeight: 44).accessibilityIdentifier(id).disabled(account.busy || lockedDraft)
        }.padding(20).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22)).id(focus)
    }
    private func secret(_ title: String, value: Binding<String>, focus: Field, id: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.subheadline.weight(.semibold))
            SecureField(title, text: value).textContentType(nil).textInputAutocapitalization(.never).autocorrectionDisabled().privacySensitive().focused($focused, equals: focus)
                .frame(minHeight: 44).accessibilityIdentifier(id).disabled(account.busy || lockedDraft).submitLabel(.done).onSubmit { focused = nil }
        }.id(focus)
    }
    private func preference(_ key: String, symbol: String, value: Binding<Bool>) -> some View {
        Toggle(isOn: value) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: symbol).font(.title3).frame(width: 28).accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 5) { Text(signupText("choices.\(key)")).font(.headline); Text(signupText("choices.\(key).detail")).font(.subheadline).foregroundStyle(Palette.secondary) }
            }
        }.tint(Palette.green).padding(16).background(Palette.surface, in: RoundedRectangle(cornerRadius: 20)).accessibilityIdentifier("signup-choice-\(key)")
    }
}

private struct SignupBackupDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.json] }
    let contents: String
    init(contents: String) { self.contents = contents }
    init(configuration: ReadConfiguration) throws { guard let data = configuration.file.regularFileContents, data.count <= 65_536, let value = String(data: data, encoding: .utf8) else { throw AccountError.storage }; contents = value }
    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper { FileWrapper(regularFileWithContents: Data(contents.utf8)) }
}

private struct SignupPhotoLabel: View {
    let data: Data?
    let working: Bool
    let large: Bool
    let title: String
    let hint: String
    let preparingTitle: String
    var body: some View {
        Group {
            if large {
                VStack(alignment: .leading, spacing: 14) {
                    HStack { photoThumbnail; Spacer(); Image(systemName: "chevron.forward").font(.headline).accessibilityHidden(true) }
                    photoPrompt
                }
            } else {
                HStack(spacing: 16) {
                    photoThumbnail
                    photoPrompt.frame(maxWidth: .infinity, alignment: .leading)
                    Image(systemName: "chevron.forward").font(.headline).accessibilityHidden(true)
                }
            }
        }.padding(18).frame(maxWidth: .infinity, alignment: .leading)
            .background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
            .overlay(RoundedRectangle(cornerRadius: 24).stroke(Palette.line))
            .contentShape(RoundedRectangle(cornerRadius: 24))
    }
    private var photoThumbnail: some View {
        Group {
            if let data = data, let image = UIImage(data: data) { Image(uiImage: image).resizable().scaledToFill() }
            else { ProfileArtwork(url: nil, size: 74) }
        }.frame(width: 74, height: 74).clipShape(Circle())
            .overlay(alignment: .bottomTrailing) {
                Image(systemName: "camera.fill").font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Palette.cardInk).frame(width: 30, height: 30)
                    .background(Palette.blueCard, in: Circle()).overlay(Circle().stroke(Palette.surface, lineWidth: 3))
            }.accessibilityHidden(true)
    }
    private var photoPrompt: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).font(.headline).foregroundStyle(Palette.ink)
            if working { ProgressView(preparingTitle) }
            else { Text(hint).font(.subheadline).foregroundStyle(Palette.secondary).fixedSize(horizontal: false, vertical: true) }
        }
    }
}
