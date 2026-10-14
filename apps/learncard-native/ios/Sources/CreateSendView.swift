import SwiftUI
import PhotosUI
import LearnCardNativeCore
import LearnCardNativeSDK

struct CreateView: View {
    @Environment(\.locale) private var nativeLocale
    @Environment(\.dismiss) private var dismiss
    let store: AppStore
    @State private var title = ""
    @State private var summary = ""
    @State private var kind = CredentialKind.achievement
    @State private var achievementType = "Badge"
    @State private var criteria = ""
    @State private var step = 0
    @State private var forMe = true
    @State private var recipient: AccountRecipient?
    @State private var showRecipients = false
    @State private var showFormat = false
    @State private var showCategory = false
    @State private var photo: PhotosPickerItem?
    @State private var jpeg: Data?
    @State private var preparing = false
    @State private var submitting = false
    @State private var uploadedURL: URL?
    @State private var requestID = UUID().uuidString
    @State private var localError: String?

    private var detailsValid: Bool {
        !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !summary.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        title.count <= 100 && summary.count <= 1000 && criteria.count <= 2000 && !preparing
    }
    private var preview: Credential {
        Credential(id: "draft", title: title.isEmpty ? "Your credential" : title, issuer: "You",
                   summary: summary, kind: kind, date: .now, isSample: !store.isLive, artworkURL: uploadedURL)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    HStack {
                        ForEach(Array(["Design", "Recipient", "Review"].enumerated()), id: \.offset) { index, label in
                            Text(label).font(.caption.weight(index == step ? .bold : .medium))
                                .foregroundStyle(index == step ? Palette.ink : Palette.secondary)
                            if index < 2 { Spacer(); Image(systemName: "chevron.right").font(.caption2).foregroundStyle(Palette.secondary); Spacer() }
                        }
                    }.padding(.vertical, 6)
                }.listRowBackground(Color.clear)
                if step == 0 { design }
                if step == 1 { destination }
                if step == 2 { review }
                if let localError {
                    Section { Text(localError).font(.subheadline).foregroundStyle(Palette.ink) }
                }
                Section {
                    PrimaryButton(title: step == 2 ? (submitting ? (jpeg != nil && uploadedURL == nil ? "Uploading artwork…" : "Creating…") : forMe ? "Create for Me" : "Create & Send") : "Continue",
                                  loading: submitting, disabled: step == 0 ? !detailsValid : step == 1 ? !forMe && recipient == nil : !detailsValid || !forMe && recipient == nil) {
                        if step < 2 { withAnimation { step += 1 } }
                        else { Task { await finish() } }
                    }.accessibilityIdentifier(step == 2 ? "create-confirm" : "create-next")
                }.listRowBackground(Color.clear)
            }
            .scrollContentBackground(.hidden).background(Palette.paper).foregroundStyle(Palette.ink)
            .navigationTitle(NativeText.literal("Create a credential")).navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button(NativeText.literal("Cancel")) { dismiss() }.disabled(submitting) }
                if step > 0 {
                    ToolbarItem(placement: .topBarTrailing) { Button("Back") { withAnimation { step -= 1 } }.disabled(submitting) }
                }
            }
            .scrollDismissesKeyboard(.interactively)
            .sheet(isPresented: $showRecipients) { RecipientPickerView(store: store, selection: $recipient) }
            .onChange(of: title) { _, _ in requestID = UUID().uuidString }
            .onChange(of: summary) { _, _ in requestID = UUID().uuidString }
            .onChange(of: kind) { _, _ in requestID = UUID().uuidString }
            .onChange(of: achievementType) { _, _ in requestID = UUID().uuidString }
            .onChange(of: criteria) { _, _ in requestID = UUID().uuidString }
            .onChange(of: forMe) { _, _ in requestID = UUID().uuidString }
            .onChange(of: recipient) { _, _ in requestID = UUID().uuidString }
            .onChange(of: photo) { _, item in
                guard let item else { return }
                preparing = true; localError = nil; uploadedURL = nil
                Task { @MainActor in
                    do {
                        guard let data = try await item.loadTransferable(type: Data.self), data.count <= 25_000_000,
                              let image = UIImage(data: data) else { throw AccountError.unavailable }
                        let scale = min(1, 900 / max(image.size.width, image.size.height))
                        let size = CGSize(width: image.size.width * scale, height: image.size.height * scale)
                        let format = UIGraphicsImageRendererFormat(); format.scale = 1
                        let resized = UIGraphicsImageRenderer(size: size, format: format).image { _ in image.draw(in: CGRect(origin: .zero, size: size)) }
                        guard let encoded = resized.jpegData(compressionQuality: 0.78), encoded.count <= 1_000_000 else { throw AccountError.unavailable }
                        if photo == item { jpeg = encoded; requestID = UUID().uuidString }
                    } catch { if photo == item { localError = "Couldn't prepare that photo. Try a smaller image." } }
                    if photo == item { preparing = false }
                }
            }
        }.interactiveDismissDisabled(submitting || store.isBusy)
    }

    private var design: some View {
        Group {
            Section("Artwork") {
                PhotosPicker(selection: $photo, matching: .images, photoLibrary: .shared()) {
                    HStack(spacing: 18) {
                        artwork.frame(width: 76, height: 76).clipShape(Circle())
                        VStack(alignment: .leading, spacing: 5) {
                            Text(preparing ? "Preparing photo…" : jpeg == nil ? "Add an image" : "Change image").font(.headline)
                            Text("Choose a badge, illustration, or photo.").font(.caption).foregroundStyle(Palette.secondary)
                        }
                        Spacer(); Image(systemName: "plus.circle").foregroundStyle(Palette.green)
                    }.padding(.vertical, 8)
                }.accessibilityIdentifier("draft-artwork")
                if jpeg != nil { Button("Remove image", role: .destructive) { jpeg = nil; photo = nil; uploadedURL = nil; requestID = UUID().uuidString } }
            }
            Section("Credential details") {
                TextField("Give it a title", text: $title).accessibilityIdentifier("draft-title")
                TextField("What makes it special?", text: $summary, axis: .vertical).lineLimit(3...6).accessibilityIdentifier("draft-summary")
                Button { showFormat = true } label: { selectionRow("Format", value: formatName(achievementType)) }
                    .accessibilityIdentifier("draft-format")
                    .confirmationDialog("Credential format", isPresented: $showFormat, titleVisibility: .visible) {
                        ForEach(["Badge", "Certificate", "Course", "Competency", "Membership", "License", "MicroCredential"], id: \.self) { format in
                            Button(formatName(format)) { achievementType = format }
                        }
                        Button(NativeText.literal("Cancel"), role: .cancel) {}
                    }
                Button { showCategory = true } label: { selectionRow("Category", value: kind.rawValue) }
                    .accessibilityIdentifier("draft-category")
                    .confirmationDialog("Collection category", isPresented: $showCategory, titleVisibility: .visible) {
                        ForEach(CredentialKind.allCases, id: \.self) { category in Button(category.rawValue) { kind = category } }
                        Button(NativeText.literal("Cancel"), role: .cancel) {}
                    }
            }
            Section("How was it earned?") {
                TextField("Criteria (optional)", text: $criteria, axis: .vertical).lineLimit(2...5)
            }
        }
    }
    private var destination: some View {
        Group {
            Section("Who is it for?") {
                Button { forMe = true } label: { choice("Myself", detail: "Add it to my credentials", selected: forMe) }.accessibilityIdentifier("recipient-self")
                Button { forMe = false; showRecipients = true } label: { choice("Someone else", detail: recipient.map { "\($0.name) · @\($0.id)" } ?? "Choose a LearnCard member", selected: !forMe) }.accessibilityIdentifier("recipient-other")
            }
            if !forMe, let recipient {
                Section { Text("Ready to send to \(recipient.name).").font(.body); Button("Choose someone else") { showRecipients = true } }
            }
        }
    }
    private var review: some View {
        Group {
            Section {
                VStack(spacing: 14) {
                    artwork.frame(width: 116, height: 116).clipShape(Circle()).overlay(Circle().stroke(.white.opacity(0.8), lineWidth: 3))
                    Text(title).font(.title2.bold())
                    Text(summary).font(.body).multilineTextAlignment(.center)
                    Text("\(formatName(achievementType)) · \(kind.rawValue)").font(.caption.weight(.medium))
                }.foregroundStyle(Palette.cardInk).padding(24).frame(maxWidth: .infinity)
                    .background(Palette.categoryTint(.resolve(nil, fallback: kind)), in: RoundedRectangle(cornerRadius: 24))
            }.listRowBackground(Color.clear).listRowInsets(EdgeInsets())
            Section("Delivery") {
                Label(forMe ? "For you" : "For \(recipient?.name ?? "the selected member")", systemImage: "person.crop.circle")
                Text(forMe ? "Added to My credentials. Reuse it from Your creations." : "Delivered to their Inbox. Reuse it from Your creations.").font(.subheadline).foregroundStyle(Palette.secondary)
            }
            if jpeg != nil { Section { Text(store.isLive ? "Artwork is uploaded to LearnCard's image service and can be viewed by anyone with its link." : "Sample artwork stays on this simulator.").font(.caption).foregroundStyle(Palette.secondary) } }
        }
    }
    @ViewBuilder private var artwork: some View {
        if let jpeg, let image = UIImage(data: jpeg) { Image(uiImage: image).resizable().scaledToFill() }
        else { Image(systemName: kind.symbol).font(.system(size: 32, weight: .light)).frame(maxWidth: .infinity, maxHeight: .infinity).foregroundStyle(Palette.green).background(Palette.surface) }
    }
    private func formatName(_ value: String) -> String {
        value == "Competency" ? "Skill" : value == "MicroCredential" ? "Microcredential" : value
    }
    private func selectionRow(_ title: String, value: String) -> some View {
        HStack {
            Text(title).foregroundStyle(Palette.ink)
            Spacer()
            Text(value).foregroundStyle(Palette.green)
            Image(systemName: "chevron.down").font(.caption.weight(.semibold)).foregroundStyle(Palette.secondary)
        }.padding(.vertical, 4).contentShape(Rectangle())
    }
    private func choice(_ title: String, detail: String, selected: Bool) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 5) { Text(title).font(.headline); Text(detail).font(.caption).foregroundStyle(Palette.secondary) }
            Spacer(); Image(systemName: selected ? "checkmark.circle.fill" : "circle").foregroundStyle(selected ? Palette.green : Palette.secondary)
        }.padding(.vertical, 10).foregroundStyle(Palette.ink)
    }
    @MainActor private func finish() async {
        guard !submitting else { return }
        submitting = true; localError = nil
        defer { submitting = false }
        do {
            if let jpeg, uploadedURL == nil {
                if store.isLive { uploadedURL = try await ArtworkUploader.upload(jpeg: jpeg) }
                else {
                    let file = FileManager.default.temporaryDirectory.appendingPathComponent("credential-\(requestID).jpg")
                    try jpeg.write(to: file); uploadedURL = file
                }
            }
            let draft = CredentialDraft(requestID: requestID, title: title, summary: summary, kind: kind,
                                        achievementType: achievementType, criteria: criteria, artworkURL: uploadedURL,
                                        recipient: forMe ? nil : recipient?.id)
            if await store.create(draft: draft) { dismiss() }
            else { localError = "Couldn't finish. Your details are still here; try again." }
        } catch { localError = "Couldn't upload the image. Try again or remove it." }
    }
}

struct RecipientPickerView: View {
    @Environment(\.locale) private var nativeLocale
    @Environment(\.dismiss) private var dismiss
    let store: AppStore
    @Binding var selection: AccountRecipient?
    @State private var query = ""
    @State private var results: [AccountRecipient] = []
    @State private var loading = false
    @State private var error: String?
    var body: some View {
        NavigationStack {
            List {
                Section {
                    TextField("Name or LearnCard username", text: $query).textInputAutocapitalization(.never).autocorrectionDisabled().submitLabel(.search).onSubmit { search() }.accessibilityIdentifier("recipient-search")
                    Button(loading ? "Searching…" : "Search", action: search).disabled(loading || store.isLive && query.count < 2).accessibilityIdentifier("recipient-search-confirm")
                }
                if loading { ProgressView("Finding people…") }
                if let error { Text(error).foregroundStyle(Palette.secondary) }
                ForEach(results) { person in
                    Button { selection = person; dismiss() } label: {
                        HStack { Image(systemName: "person.crop.circle").font(.title2).foregroundStyle(Palette.green)
                            VStack(alignment: .leading) { Text(person.name).foregroundStyle(Palette.ink); Text("@\(person.id)").font(.caption).foregroundStyle(Palette.secondary) }
                        }
                    }.accessibilityIdentifier("recipient-\(person.id)")
                }
            }.navigationTitle("Choose someone").navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button(NativeText.literal("Cancel")) { dismiss() } } }
                .task { if !store.isLive { results = (try? await store.searchRecipients("")) ?? [] } }
        }
    }
    private func search() {
        guard !loading else { return }
        loading = true; error = nil; results = []
        let requested = query
        Task { @MainActor in
            defer { loading = false }
            do { let people = try await store.searchRecipients(requested)
                if query == requested { results = people; if people.isEmpty { error = "No matches. Try their LearnCard username." } }
            } catch { self.error = "Couldn't look up people. Try again." }
        }
    }
}

struct SendView: View {
    @Environment(\.locale) private var nativeLocale
    @Environment(\.dismiss) private var dismiss
    let store: AppStore
    let credential: Credential
    @State private var recipient = "Alex Morgan"
    @State private var profileId = ""
    @State private var verifiedRecipient: AccountRecipient?
    @State private var lookingUp = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                Section { CredentialCard(credential: credential) }.listRowBackground(Color.clear)
                if store.isLive {
                    Section("Choose a recipient") {
                        TextField("LearnCard username", text: $profileId).textInputAutocapitalization(.never).autocorrectionDisabled()
                            .onChange(of: profileId) { _, _ in verifiedRecipient = nil }
                        Button(lookingUp ? "Looking up…" : "Review Recipient") {
                            lookingUp = true; error = nil
                            let requested = profileId
                            Task {
                                defer { lookingUp = false }
                                do {
                                    let recipient = try await store.recipient(requested)
                                    if profileId == requested { verifiedRecipient = recipient }
                                }
                                catch { if profileId == requested { self.error = "Couldn't find that recipient. Check the username and try again." } }
                            }
                        }.disabled(lookingUp || profileId.isEmpty)
                        if let verifiedRecipient { Text("Send to \(verifiedRecipient.name) (@\(verifiedRecipient.id))") }
                        if let error { Text(error).foregroundStyle(Palette.ink) }
                    }
                } else { Section("Choose a sample recipient") {
                    Picker("To", selection: $recipient) {
                        Text("Alex Morgan").tag("Alex Morgan")
                        Text("Jordan Lee").tag("Jordan Lee")
                    }
                } }
                Section {
                    PrimaryButton(title: store.isBusy ? "Sending…" : store.isLive ? "Send Credential" : "Record Sample Send", loading: store.isBusy,
                                  disabled: store.isLive && verifiedRecipient == nil) {
                        Task { if await store.send(credential, to: store.isLive ? verifiedRecipient?.id ?? "" : recipient) { dismiss() } }
                    }.accessibilityIdentifier("send-confirm")
                } footer: { Text(store.isLive ? "Delivers this credential to the confirmed recipient." : "Records this action in Home. No credential is delivered.") }
            }
            .foregroundStyle(Palette.ink)
            .navigationTitle(store.isLive ? "Send a credential" : "Send a sample")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button(NativeText.literal("Cancel")) { dismiss() } } }
        }
        .interactiveDismissDisabled(store.isBusy)
    }
}
