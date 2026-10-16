import SwiftUI
import PhotosUI
import LearnCardNativeCore
import LearnCardNativeSDK

/// Native authoring keeps category, achievement type and visual format independent; delivery retains its existing retry identity.
struct CreateView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.dynamicTypeSize) private var textSize
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let store: AppStore
    private let onComplete: () -> Void
    @State private var title = ""
    @State private var summary = ""
    @State private var category = CreationCategory.achievement
    @State private var displayType = CredentialDisplayFormat.badge
    @State private var achievementType = "Certificate"
    private var kind: CredentialKind { category.legacyKind }
    @State private var criteria = ""
    @State private var details = CredentialDraftDetails()
    @State private var step = 0
    @State private var forMe = true
    @State private var recipient: AccountRecipient?
    @State private var showRecipients = false
    @State private var showFormat = false
    @State private var showCategory = false
    @State private var showCriteria = false
    @State private var photo: PhotosPickerItem?
    @State private var jpeg: Data?
    @State private var preparing = false
    @State private var submitting = false
    @State private var uploadedURL: URL?
    @State private var requestID = UUID().uuidString
    @State private var localError: String?
    @FocusState private var focused: BuilderField?

    init(store: AppStore, initialRecipient: AccountRecipient? = nil, onComplete: @escaping () -> Void = {}) {
        self.store = store
        self.onComplete = onComplete
        _recipient = State(initialValue: initialRecipient)
        _forMe = State(initialValue: initialRecipient == nil)
    }

    private var detailsValid: Bool {
        !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !summary.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        title.count <= 100 && summary.count <= 1000 && criteria.count <= 2000 && details.validationIssue == nil && !preparing && category.types.contains { $0.type == achievementType } && category.formats.contains(displayType)
    }
    private var ready: Bool { detailsValid && (forMe || recipient != nil) }
    private var preview: Credential {
        Credential(id: "draft", title: title.isEmpty ? NativeText.text("builder.previewTitle") : title,
                   issuer: NativeText.literal("You"), summary: summary, kind: kind, date: .now,
                   isSample: !store.isLive, artworkURL: uploadedURL, category: category.rawValue)
    }
    private var tint: Color { Palette.categoryTint(category.displayCategory) }
    private var categoryName: String { category.localizedName }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollViewReader { proxy in
                    ScrollView {
                        VStack(alignment: .leading, spacing: 24) {
                            BuilderSteps(step: step).id("builder-top")
                            if step == 0 { design }
                            else if step == 1 { destination }
                            else { review }
                        }
                        .padding(.horizontal, NativeLayout.pageInset).padding(.top, 16).padding(.bottom, 24)
                        .frame(maxWidth: 620).frame(maxWidth: .infinity)
                    }
                    .disabled(submitting)
                    .accessibilityIdentifier("create-content")
                    .background(Palette.paper).foregroundStyle(Palette.ink)
                    .onChange(of: step) { _, _ in proxy.scrollTo("builder-top", anchor: .top) }
                    .onChange(of: focused) { _, field in
                        if let field { withAnimation(reduceMotion ? nil : .easeOut(duration: 0.2)) { proxy.scrollTo(field, anchor: .top) } }
                    }
                }
                actionTray
            }
            .navigationTitle(NativeText.literal("Create a credential")).navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button(NativeText.literal("Cancel")) { dismiss() }.disabled(submitting) }
                if step > 0 {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button(NativeText.literal("Back")) { changeStep(step - 1) }.disabled(submitting)
                            .accessibilityIdentifier("create-back")
                    }
                }
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button(NativeText.literal("Done")) { focused = nil }
                }
            }
            .scrollDismissesKeyboard(.interactively)
            .sheet(isPresented: $showRecipients) { RecipientPickerView(store: store, selection: $recipient) }
            .onChange(of: title) { _, _ in requestID = UUID().uuidString }
            .onChange(of: summary) { _, _ in requestID = UUID().uuidString }
            .onChange(of: category) { _, value in displayType = value.defaultFormat; requestID = UUID().uuidString }
            .onChange(of: displayType) { _, _ in requestID = UUID().uuidString }
            .onChange(of: achievementType) { _, _ in requestID = UUID().uuidString }
            .onChange(of: criteria) { _, _ in requestID = UUID().uuidString }
            .onChange(of: details) { _, _ in requestID = UUID().uuidString }
            .onChange(of: forMe) { _, _ in requestID = UUID().uuidString }
            .onChange(of: recipient) { _, _ in requestID = UUID().uuidString }
            .onChange(of: photo) { _, item in prepare(item) }
        }
        .environment(\.locale, NativeLanguage.selected.locale)
        .environment(\.layoutDirection, NativeLanguage.selected.isRightToLeft ? .rightToLeft : .leftToRight)
        #if DEBUG
        .modifier(NativeReviewPreferences())
        #endif
        .interactiveDismissDisabled(submitting || store.isBusy)
    }

    private var design: some View {
        Group {
            BuilderHeading(title: NativeText.text("builder.designTitle"), detail: NativeText.text("builder.designDetail"))
            designCanvas
            VStack(alignment: .leading, spacing: 16) {
                Text(NativeText.text("builder.details")).font(.title3.bold())
                Text(NativeText.text("builder.required")).font(.footnote).foregroundStyle(Palette.secondary)
                VStack(alignment: .leading, spacing: 18) {
                    VStack(alignment: .leading, spacing: 12) {
                        fieldLabel("builder.title", count: title.count, limit: 100)
                        TextField(NativeText.text("builder.titlePlaceholder"), text: $title)
                            .font(.body).focused($focused, equals: .title).submitLabel(.next)
                            .onSubmit { focused = .summary }.accessibilityIdentifier("draft-title")
                    }.id(BuilderField.title)
                    Divider()
                    VStack(alignment: .leading, spacing: 12) {
                        fieldLabel("builder.description", count: summary.count, limit: 1000)
                        TextField(NativeText.text("builder.descriptionPlaceholder"), text: $summary, axis: .vertical)
                            .font(.body).lineLimit(3...6).focused($focused, equals: .summary)
                            .accessibilityIdentifier("draft-summary")
                    }.id(BuilderField.summary)
                }.padding(20).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
            }
            if textSize.isAccessibilitySize {
                VStack(spacing: 12) { categorySelector; formatSelector }
            } else { ViewThatFits(in: .horizontal) {
                HStack(spacing: 12) { categorySelector; formatSelector }
                VStack(spacing: 12) { categorySelector; formatSelector }
            } }
            VStack(alignment: .leading, spacing: 16) {
                Button {
                    withAnimation(reduceMotion ? nil : .easeInOut(duration: 0.22)) { showCriteria.toggle() }
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 5) {
                            Text(NativeText.text("builder.moreDetails")).font(.headline)
                            Text(NativeText.text("builder.moreDetailsHint")).font(.footnote).foregroundStyle(Palette.secondary)
                        }
                        Spacer(minLength: 8)
                        Image(systemName: showCriteria ? "chevron.up" : "chevron.down").font(.caption.weight(.semibold))
                    }.frame(maxWidth: .infinity, minHeight: 44).contentShape(Rectangle())
                }.buttonStyle(.plain).accessibilityIdentifier("draft-criteria-section")
                    .accessibilityValue(NativeText.text(showCriteria ? "builder.expanded" : "builder.collapsed"))
                if showCriteria {
                    VStack(alignment: .leading, spacing: 12) {
                        fieldLabel("builder.criteria", count: criteria.count, limit: 2000)
                        TextField(NativeText.text("builder.criteriaPlaceholder"), text: $criteria, axis: .vertical)
                            .lineLimit(2...5).focused($focused, equals: .criteria).accessibilityIdentifier("draft-criteria")
                    }.id(BuilderField.criteria)
                    BuilderOptionalDetails(details: $details, focus: $focused)
                }
            }.padding(20).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
        }
    }

    private var formatSelector: some View {
        Button { focused = nil; showFormat = true } label: {
            BuilderSelector(label: NativeText.text("builder.format"), value: authoringFormatName(displayType), symbol: "DrawnCredential", tint: Palette.blueCard)
        }.buttonStyle(.plain).accessibilityIdentifier("draft-format")
            .sheet(isPresented: $showFormat) { BuilderSelectionSheet(selection: .format, format: $displayType, category: $category, achievementType: $achievementType) }
    }
    private var categorySelector: some View {
        Button { focused = nil; showCategory = true } label: {
            BuilderSelector(label: NativeText.literal("Category"), value: categoryName, symbol: category.displayCategory.illustration, tint: tint, detail: NativeText.format("builder.typeSummary", authoringTypeName(achievementType)))
        }.buttonStyle(.plain).accessibilityIdentifier("draft-category")
            .sheet(isPresented: $showCategory) { BuilderSelectionSheet(selection: .category, format: $displayType, category: $category, achievementType: $achievementType) }
    }

    private var destination: some View {
        Group {
            BuilderHeading(title: NativeText.text("builder.recipientTitle"), detail: NativeText.text("builder.recipientDetail"), illustration: "BuilderPlane")
            draftCard(compact: true)
            if textSize.isAccessibilitySize {
                VStack(spacing: 12) { selfChoice; otherChoice }
            } else {
                HStack(alignment: .top, spacing: 12) { selfChoice; otherChoice }
            }
            if !forMe, let recipient {
                HStack(spacing: 12) {
                    ProfileArtwork(size: 44)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(recipient.name).font(.headline)
                        Text("@\(recipient.id)").font(.subheadline).foregroundStyle(Palette.secondary)
                    }.frame(maxWidth: .infinity, alignment: .leading)
                    Button(NativeText.text("builder.changeRecipient")) { showRecipients = true }
                        .frame(minHeight: 44).font(.subheadline.weight(.semibold))
                }.padding(16).background(Palette.surface, in: RoundedRectangle(cornerRadius: 20))
            }
        }
    }

    private var selfChoice: some View {
        BuilderRecipientChoice(title: NativeText.text("builder.myself"), detail: NativeText.text("builder.selfDetail"),
                               image: "AccountAvatar", tint: Palette.portfolioCard, selected: forMe) { forMe = true }
            .accessibilityIdentifier("recipient-self")
    }
    private var otherChoice: some View {
        BuilderRecipientChoice(title: NativeText.text("builder.someoneElse"), detail: NativeText.text("builder.otherDetail"),
                               image: "FamilyInviteIllustration", tint: Palette.cyanCard, selected: !forMe) {
            forMe = false; showRecipients = true
        }.accessibilityIdentifier("recipient-other")
    }

    private var review: some View {
        Group {
            BuilderHeading(title: NativeText.text("builder.reviewTitle"), detail: NativeText.text("builder.reviewDetail"), illustration: "BuilderYellowRays")
            draftCard(compact: false)
            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 12) {
                    ProfileArtwork(size: 48)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(forMe ? NativeText.literal("For you") : NativeText.format("builder.forPerson", recipient?.name ?? ""))
                            .font(.headline).accessibilityIdentifier("draft-delivery")
                        Text(NativeText.text(forMe ? "builder.deliverSelf" : "builder.deliverOther"))
                            .font(.subheadline).foregroundStyle(Palette.secondary)
                    }
                }
                Divider()
                Label(NativeText.text("builder.reusable"), systemImage: "rectangle.on.rectangle")
                    .font(.footnote).foregroundStyle(Palette.secondary)
            }.padding(20).frame(maxWidth: .infinity, alignment: .leading)
                .background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
            if !criteria.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text(NativeText.text("builder.criteriaHeading")).font(.headline)
                    Text(criteria).font(.body).foregroundStyle(Palette.secondary)
                }.frame(maxWidth: .infinity, alignment: .leading).accessibilityIdentifier("draft-criteria-review")
            }
            BuilderDetailsReview(details: details)
            if jpeg != nil {
                Text(NativeText.text(store.isLive ? "builder.artworkPublic" : "builder.artworkSample"))
                    .font(.footnote).foregroundStyle(Palette.secondary)
            }
        }
    }

    private var designCanvas: some View {
        VStack(spacing: 14) {
            if textSize.isAccessibilitySize {
                decoratedArtwork(size: 116)
                imagePicker
            } else {
                HStack(spacing: 12) { decoratedArtwork(size: 116); imagePicker }.padding(.horizontal, 4)
            }
            Button { focused = .title } label: {
                HStack(spacing: 10) {
                    Text(title.isEmpty ? NativeText.text("builder.previewTitle") : title).font(.headline).lineLimit(3)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    Image("DrawnPencil").resizable().scaledToFit().frame(width: 24, height: 24).accessibilityHidden(true)
                }.padding(12).foregroundStyle(Palette.cardInk).frame(minHeight: 48)
                    .background(.white.opacity(0.94), in: RoundedRectangle(cornerRadius: 14))
            }.buttonStyle(.plain).accessibilityIdentifier("draft-preview-title")
        }.padding(18).background(tint, in: RoundedRectangle(cornerRadius: 24))
    }
    private var imagePicker: some View {
        // PhotosPicker's label builder is nonisolated; capture immutable display values.
        let working = preparing
        let large = textSize.isAccessibilitySize
        let label = NativeText.text(preparing ? "builder.preparingPhoto" : jpeg == nil ? "builder.addImage" : "builder.changeImage")
        return VStack(spacing: 4) {
            PhotosPicker(selection: $photo, matching: .images, photoLibrary: .shared()) {
                VStack(spacing: 6) {
                    if working { ProgressView().tint(Palette.cardInk) }
                    else { Image(systemName: "camera").font(.title3.weight(.semibold)).accessibilityHidden(true) }
                    Text(label).font(.caption.weight(.semibold)).multilineTextAlignment(.center)
                }.padding(12).frame(width: large ? nil : 90, height: large ? nil : 90)
                    .frame(maxWidth: large ? .infinity : nil, minHeight: 54)
                    .foregroundStyle(Palette.cardInk).background(.white.opacity(0.94), in: RoundedRectangle(cornerRadius: large ? 18 : 45))
            }.buttonStyle(.plain).disabled(preparing).accessibilityIdentifier("draft-artwork")
            if jpeg != nil {
                Button(NativeText.text("builder.removeImage"), role: .destructive) {
                    jpeg = nil; photo = nil; uploadedURL = nil; requestID = UUID().uuidString
                }.font(.footnote.weight(.semibold)).foregroundStyle(Palette.cardInk).frame(minHeight: 44).disabled(preparing)
            }
        }
    }
    private func draftCard(compact: Bool) -> some View {
        Group {
            if compact && !textSize.isAccessibilitySize {
                HStack(spacing: 14) {
                    artwork(size: 62).padding(8).background(tint, in: RoundedRectangle(cornerRadius: 16))
                    cardIdentity(compact: true).frame(maxWidth: .infinity, alignment: .leading)
                }.padding(14).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
                    .foregroundStyle(Palette.ink)
            } else {
                VStack(spacing: 16) {
                    decoratedArtwork(size: compact ? 88 : 132)
                    cardIdentity(compact: compact)
                    if !compact, !summary.isEmpty { Text(summary).font(.body).fixedSize(horizontal: false, vertical: true) }
                }.multilineTextAlignment(.center).foregroundStyle(Palette.cardInk).padding(22)
                    .frame(maxWidth: .infinity).background(tint, in: RoundedRectangle(cornerRadius: 24))
            }
        }.accessibilityElement(children: .combine).accessibilityIdentifier("draft-preview")
    }
    private func decoratedArtwork(size: CGFloat) -> some View {
        ZStack {
            Image("BuilderCardMarks").resizable().scaledToFit().frame(maxWidth: 270, minHeight: size + 24, maxHeight: size + 24)
                .accessibilityHidden(true).allowsHitTesting(false)
            artwork(size: size)
        }.frame(maxWidth: .infinity).frame(height: size + 24)
    }
    private func cardIdentity(compact: Bool) -> some View {
        VStack(alignment: compact ? .leading : .center, spacing: 10) {
            Text(title.isEmpty ? NativeText.text("builder.previewTitle") : title)
                .font(compact ? .headline : .title2.bold()).lineLimit(compact ? 3 : nil).fixedSize(horizontal: false, vertical: true)
            Text("\(authoringFormatName(displayType)) · \(categoryName)").font(.subheadline.weight(.medium))
            Text(NativeText.format("builder.typeSummary", authoringTypeName(achievementType))).font(.subheadline)
        }
    }
    @ViewBuilder private func artwork(size: CGFloat) -> some View {
        if let jpeg, let image = UIImage(data: jpeg) {
            Image(uiImage: image).resizable().scaledToFill().frame(width: size, height: size).clipShape(RoundedRectangle(cornerRadius: artworkRadius(size)))
                .overlay(RoundedRectangle(cornerRadius: artworkRadius(size)).stroke(.white.opacity(0.8), lineWidth: 3)).accessibilityHidden(true)
        } else {
            Image(category.displayCategory.illustration)
                .resizable().scaledToFit().padding(size * 0.17).frame(width: size, height: size)
                .background(.white.opacity(0.95), in: RoundedRectangle(cornerRadius: artworkRadius(size))).accessibilityHidden(true)
        }
    }
    private func fieldLabel(_ key: String, count: Int, limit: Int) -> some View {
        HStack(alignment: .firstTextBaseline) {
            Text(NativeText.text(key)).font(.subheadline.weight(.semibold))
            Spacer(minLength: 8)
            Text("\(count.formatted(.number.locale(NativeLanguage.selected.locale))) / \(limit.formatted(.number.locale(NativeLanguage.selected.locale)))")
                .font(.caption.monospacedDigit()).foregroundStyle(count > limit ? Palette.errorInk : Palette.secondary)
                .accessibilityLabel(NativeText.format("builder.characterCount", String(count), String(limit)))
        }
    }
    private var actionTray: some View {
        VStack(spacing: 10) {
            if let message = localError ?? details.validationIssue.map({ NativeText.text("builder.detailError.\($0.rawValue)") }) {
                Label(message, systemImage: "exclamationmark.circle").font(.subheadline)
                    .foregroundStyle(Palette.errorInk).frame(maxWidth: .infinity, alignment: .leading)
                    .accessibilityIdentifier("create-error")
            }
            PrimaryButton(title: NativeText.text(step == 2 ? (submitting ? (jpeg != nil && uploadedURL == nil ? "builder.uploading" : "builder.creating") : forMe ? "builder.createSelf" : "builder.createSend") : "common.continue"),
                          loading: submitting, disabled: step == 0 ? !detailsValid : step == 1 ? !forMe && recipient == nil : !ready,
                          fill: Palette.selection) {
                if step < 2 { changeStep(step + 1) }
                else { focused = nil; Task { await finish() } }
            }.accessibilityIdentifier(step == 2 ? "create-confirm" : "create-next")
        }.padding(.horizontal, 20).padding(.top, 12).padding(.bottom, 10)
            .frame(maxWidth: 620).frame(maxWidth: .infinity)
            .background { Palette.surface.ignoresSafeArea(edges: .bottom).shadow(color: .black.opacity(0.04), radius: 10, y: -4) }
    }
    private func artworkRadius(_ size: CGFloat) -> CGFloat { displayType == .badge || displayType == .award ? size / 2 : size * 0.15 }
    private func changeStep(_ value: Int) {
        focused = nil
        withAnimation(reduceMotion ? nil : .easeInOut(duration: 0.22)) { step = value }
    }
    private func prepare(_ item: PhotosPickerItem?) {
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
            } catch { if photo == item { localError = NativeText.text("builder.photoError") } }
            if photo == item { preparing = false }
        }
    }
    @MainActor private func finish() async {
        guard !submitting, ready else { return }
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
                                        recipient: forMe ? nil : recipient?.id, details: details.isEmpty ? nil : details, category: category, displayType: displayType)
            if await store.create(draft: draft) { onComplete(); dismiss() }
            else { localError = NativeText.text("builder.createError") }
        } catch { localError = NativeText.text("builder.uploadError") }
    }
}

struct RecipientPickerView: View {
    @Environment(\.dismiss) private var dismiss
    let store: AppStore
    @Binding var selection: AccountRecipient?
    @State private var query = ""
    @State private var results: [AccountRecipient] = []
    @State private var loading = false
    @State private var error: String?
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    HStack(spacing: 16) {
                        Image("FamilyInviteIllustration").resizable().scaledToFit().frame(width: 82, height: 72).accessibilityHidden(true)
                        Text(NativeText.text("builder.otherDetail")).font(.title3.bold())
                    }
                    VStack(spacing: 16) {
                        TextField(NativeText.text("builder.peopleSearch"), text: $query)
                            .textInputAutocapitalization(.never).autocorrectionDisabled().submitLabel(.search)
                            .onSubmit { search() }.accessibilityIdentifier("recipient-search")
                        PrimaryButton(title: NativeText.text(loading ? "builder.searching" : "builder.search"), loading: loading,
                                      disabled: store.isLive && query.trimmingCharacters(in: .whitespacesAndNewlines).count < 2,
                                      fill: Palette.selection, action: search).accessibilityIdentifier("recipient-search-confirm")
                    }.padding(20).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
                    if loading { ProgressView(NativeText.text("builder.findingPeople")) }
                    if let error { Text(error).foregroundStyle(Palette.secondary).accessibilityIdentifier("recipient-search-error") }
                    ForEach(results) { person in
                        Button { selection = person; dismiss() } label: {
                            HStack(spacing: 14) {
                                ProfileArtwork(size: 48)
                                VStack(alignment: .leading, spacing: 5) {
                                    Text(person.name).font(.headline)
                                    Text("@\(person.id)").font(.subheadline).foregroundStyle(Palette.secondary)
                                }.frame(maxWidth: .infinity, alignment: .leading)
                                Image(systemName: "chevron.forward").font(.subheadline.weight(.semibold))
                            }.foregroundStyle(Palette.ink).padding(16).frame(minHeight: 80)
                                .background(Palette.surface, in: RoundedRectangle(cornerRadius: 20))
                        }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("recipient-\(person.id)")
                    }
                }.padding(20).frame(maxWidth: 620).frame(maxWidth: .infinity)
            }.background(Palette.paper).foregroundStyle(Palette.ink)
                .navigationTitle(NativeText.text("builder.chooseSomeone")).navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button(NativeText.literal("Cancel")) { dismiss() }.accessibilityIdentifier("recipient-picker-cancel") } }
                .task {
                    if !store.isLive, query.isEmpty {
                        let people = (try? await store.searchRecipients("")) ?? []
                        if query.isEmpty { results = people }
                    }
                }
                .onChange(of: query) { _, _ in results = []; error = nil }
        }
        .environment(\.locale, NativeLanguage.selected.locale)
        .environment(\.layoutDirection, NativeLanguage.selected.isRightToLeft ? .rightToLeft : .leftToRight)
        #if DEBUG
        .modifier(NativeReviewPreferences())
        #endif
    }
    private func search() {
        guard !loading, !store.isLive || query.trimmingCharacters(in: .whitespacesAndNewlines).count >= 2 else { return }
        loading = true; error = nil; results = []
        let requested = query
        Task { @MainActor in
            defer { loading = false }
            do {
                let people = try await store.searchRecipients(requested)
                if query == requested {
                    results = people
                    if people.isEmpty { error = NativeText.text("builder.peopleEmpty") }
                }
            } catch { if query == requested { self.error = NativeText.text("builder.peopleError") } }
        }
    }
}

struct SendView: View {
    @Environment(\.locale) private var nativeLocale
    @Environment(\.dismiss) private var dismiss
    let store: AppStore
    let credential: Credential
    private let onComplete: () -> Void
    @State private var recipient = "Alex Morgan"
    @State private var profileId = ""
    @State private var verifiedRecipient: AccountRecipient?
    @State private var lookingUp = false
    @State private var error: String?

    init(store: AppStore, credential: Credential, initialRecipient: AccountRecipient? = nil, onComplete: @escaping () -> Void = {}) {
        self.store = store
        self.credential = credential
        self.onComplete = onComplete
        _recipient = State(initialValue: initialRecipient?.name ?? "Alex Morgan")
        _profileId = State(initialValue: initialRecipient?.id ?? "")
    }

    var body: some View {
        NavigationStack {
            Form {
                Section { CredentialCard(credential: credential) }.listRowBackground(Color.clear)
                if store.isLive {
                    Section("Choose a recipient") {
                        TextField("LearnCard username", text: $profileId).textInputAutocapitalization(.never).autocorrectionDisabled()
                            .onChange(of: profileId) { _, _ in verifiedRecipient = nil }
                            .accessibilityIdentifier("send-recipient-search")
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
                        }.disabled(lookingUp || profileId.isEmpty).accessibilityIdentifier("send-review-recipient")
                        if let verifiedRecipient { Text("Send to \(verifiedRecipient.name) (@\(verifiedRecipient.id))") }
                        if let error { Text(error).foregroundStyle(Palette.ink) }
                    }
                } else { Section("Choose a sample recipient") {
                    Picker("To", selection: $recipient) {
                        Text("Alex Morgan").tag("Alex Morgan")
                        Text("Jordan Lee").tag("Jordan Lee")
                    }.accessibilityIdentifier("send-recipient-picker")
                } }
                Section {
                    PrimaryButton(title: store.isBusy ? "Sending…" : store.isLive ? "Send Credential" : "Record Sample Send", loading: store.isBusy,
                                  disabled: store.isLive && verifiedRecipient == nil) {
                        Task { if await store.send(credential, to: store.isLive ? verifiedRecipient?.id ?? "" : recipient) { onComplete(); dismiss() } }
                    }.accessibilityIdentifier("send-confirm")
                } footer: { Text(store.isLive ? "Delivers this credential to the confirmed recipient." : "Records this action in Home. No credential is delivered.") }
            }
            .foregroundStyle(Palette.ink)
            .navigationTitle(store.isLive ? "Send a credential" : "Send a sample")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button(NativeText.literal("Cancel")) { dismiss() } } }
        }
        .interactiveDismissDisabled(store.isBusy)
        #if DEBUG
        .modifier(NativeReviewPreferences())
        #endif
    }
}
