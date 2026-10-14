import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

struct FamiliesView: View {
    @Environment(\.locale) private var locale
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let appStore: AppStore
    private var store: FamiliesStore { appStore.families }
    @State private var create = false
    @State private var scrolled = false
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                PageHeading(title: NativeText.text("family.title"), identifier: "families")
                Text(NativeText.text("family.subtitle")).font(.subheadline).foregroundStyle(Palette.secondary)
                if !appStore.isLive { FamilySampleNotice() }
                if let error = store.error { FamilyErrorBanner(error: error) { Task { await store.load() } } }
                if store.loading && !store.loaded {
                    ProgressView(NativeText.text("family.loading")).frame(maxWidth: .infinity).padding(36)
                } else if store.loaded && store.families.isEmpty {
                    VStack(alignment: .leading, spacing: 16) {
                        FamilyEmblem(name: "", color: .amber, size: 100)
                        Text(NativeText.text("family.empty")).font(.title2.bold()).foregroundStyle(Palette.ink)
                        Text(NativeText.text("family.emptyBody")).font(.subheadline).foregroundStyle(Palette.secondary)
                    }.padding(24).frame(maxWidth: .infinity, alignment: .leading)
                        .background(Palette.surface, in: RoundedRectangle(cornerRadius: 28))
                }
                ForEach(store.families) { family in
                    NavigationLink {
                        FamilyDetailView(appStore: appStore, id: family.id)
                    } label: { FamilyOverviewCard(family: family) }
                        .buttonStyle(CredentialPressStyle()).accessibilityIdentifier("family-\(family.id)")
                }
                Button { create = true } label: {
                    FamilyActionRow(title: NativeText.text("family.create"), subtitle: NativeText.text("family.createBody"), symbol: "person.2.badge.plus", tint: Palette.familyCard)
                }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("family-create")
            }.padding(20)
        }
        .background(Palette.familiesCanvas)
        .navigationTitle(scrolled ? NativeText.text("family.title") : "").navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Palette.familiesCanvas, for: .navigationBar).toolbarBackground(.visible, for: .navigationBar)
        .onScrollGeometryChange(for: Bool.self) { $0.contentOffset.y + $0.contentInsets.top > 50 } action: { _, value in scrolled = value }
        .task { if !store.loaded { await store.load() } }
        .refreshable { await store.load() }
        .sheet(isPresented: $create) { FamilyEditorView(appStore: appStore) }
    }
}

private struct FamilyOverviewCard: View {
    let family: FamilySummary
    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            FamilyArtwork(family: family, size: 112)
            VStack(alignment: .leading, spacing: 6) {
                Text(family.title).font(.title2.bold()).foregroundStyle(Palette.ink)
                if !family.motto.isEmpty { Text(family.motto).font(.subheadline).foregroundStyle(Palette.secondary) }
            }
            Divider().overlay(Palette.line)
            HStack {
                Text(NativeText.text("family.view")).font(.subheadline.weight(.semibold))
                Spacer(); Image(systemName: "arrow.right").flipsForRightToLeftLayoutDirection(true)
            }.foregroundStyle(Palette.selection)
        }.padding(24).frame(maxWidth: .infinity, alignment: .leading)
            .background(Palette.surface, in: RoundedRectangle(cornerRadius: 28))
            .subtleEntrance()
    }
}

struct FamilyDetailView: View {
    @Environment(\.locale) private var locale
    let appStore: AppStore
    let id: String
    private var store: FamiliesStore { appStore.families }
    @State private var edit = false
    @State private var invite = false
    @State private var openWeb = false
    @Environment(\.dynamicTypeSize) private var textSize
    private var value: FamilyDetail? { store.details[id] }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                if let family = value {
                    (textSize.isAccessibilitySize ? AnyLayout(VStackLayout(alignment: .leading, spacing: 16)) : AnyLayout(HStackLayout(alignment: .top, spacing: 16))) {
                        VStack(alignment: .leading, spacing: 10) {
                            Text(family.title).font(.largeTitle.bold()).foregroundStyle(Palette.cardInk).accessibilityAddTraits(.isHeader)
                            if !family.motto.isEmpty { Text(family.motto).font(.subheadline).foregroundStyle(Palette.cardSecondary) }
                        }.frame(maxWidth: .infinity, alignment: .leading)
                        FamilyArtwork(family: family.summary, size: 76)
                    }.padding(20).background(Palette.familyCard, in: RoundedRectangle(cornerRadius: 24))
                    if !appStore.isLive { FamilySampleNotice() }
                    roster("family.guardians", members: family.guardians)
                    roster("family.children", members: family.children)
                    if family.canInvite || family.canEdit {
                        VStack(spacing: 0) {
                            if family.canInvite {
                                Button { invite = true } label: {
                                    FamilyActionRow(title: NativeText.text("family.invite"), subtitle: NativeText.text("family.inviteBody"), symbol: "person.badge.plus", tint: Palette.limeCard, background: false)
                                }.accessibilityIdentifier("family-invite")
                            }
                            if family.canInvite && family.canEdit { Divider().padding(.leading, 70) }
                            if family.canEdit {
                                Button { edit = true } label: {
                                    FamilyActionRow(title: NativeText.text("family.edit"), subtitle: NativeText.text("family.editBody"), symbol: "pencil", tint: Palette.lilacCard, background: false)
                                }.accessibilityIdentifier("family-edit")
                            }
                        }.buttonStyle(CredentialPressStyle()).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
                    }
                    Text(NativeText.text("family.childBoundary")).font(.caption).foregroundStyle(Palette.secondary).padding(.horizontal, 4)
                    Button { openWeb = true } label: {
                        HStack { Text(NativeText.text("family.childWeb")).font(.subheadline.weight(.semibold)); Spacer(); Image(systemName: "arrow.up.right") }
                            .foregroundStyle(Palette.selection).padding(18).background(Palette.surface, in: RoundedRectangle(cornerRadius: 20))
                    }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("family-web-children")
                } else if store.detailLoading {
                    ProgressView(NativeText.text("family.loading")).frame(maxWidth: .infinity).padding(40)
                }
                if let notice = store.notice { Label(notice, systemImage: "checkmark.circle").font(.subheadline).foregroundStyle(Palette.green).padding(18).frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface, in: RoundedRectangle(cornerRadius: 20)) }
                if let error = store.error { FamilyErrorBanner(error: error) { Task { await store.loadDetail(id) } } }
            }.padding(20)
        }.background(Palette.familyDetailCanvas)
            .navigationTitle(NativeText.text("family.title")).navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Palette.familyDetailCanvas, for: .navigationBar).toolbarBackground(.visible, for: .navigationBar)
            .task { await store.loadDetail(id) }.refreshable { await store.loadDetail(id) }
            .sheet(isPresented: $edit) { if let value { FamilyEditorView(appStore: appStore, existing: value) } }
            .sheet(isPresented: $invite) { if let value { FamilyInviteView(appStore: appStore, family: value) } }
            .sheet(isPresented: $openWeb) {
                ConsumerBrowserView(launch: Self.webLaunch, consumer: appStore.consumer, isSample: !appStore.isLive, onCredential: {}, openInbox: {})
            }
    }
    private static var webLaunch: ConsumerAppLaunch {
        // Fixed first-party web fallback. No partner bridge or native account tokens are exposed.
        try! JSONDecoder().decode(ConsumerAppLaunch.self, from: Data("{\"id\":\"family-web\",\"title\":\"LearnCard\",\"url\":\"https://staging.learncard.app/families\",\"embedded\":false}".utf8))
    }
    private func roster(_ title: String, members: [FamilyMember]) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack { Text(NativeText.text(title)).font(.headline); Spacer(); Text(members.count, format: .number).font(.caption.monospacedDigit()).foregroundStyle(Palette.secondary) }
                .foregroundStyle(Palette.ink).padding(.bottom, 8)
            if members.isEmpty { Text(NativeText.text("family.noMembers")).font(.subheadline).foregroundStyle(Palette.secondary).padding(.vertical, 10) }
            ForEach(members) { member in
                NavigationLink { FamilyMemberView(member: member) } label: {
                    HStack(spacing: 12) {
                        FamilyAvatar(member: member)
                        VStack(alignment: .leading, spacing: 5) {
                            Text(member.name.isEmpty ? NativeText.text("family.member") : member.name).font(.body.weight(.semibold)).foregroundStyle(Palette.ink)
                            Text(NativeText.text("family.role.\(member.role)")).font(.caption).foregroundStyle(Palette.secondary)
                        }.frame(maxWidth: .infinity, alignment: .leading)
                        Image(systemName: "chevron.forward").font(.caption.weight(.semibold)).foregroundStyle(Palette.secondary)
                    }.padding(.vertical, 10).contentShape(Rectangle())
                }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("family-member-\(member.id)")
                if member.id != members.last?.id { Divider().padding(.leading, 64) }
            }
        }.padding(20).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24)).subtleEntrance()
    }
}

private struct FamilyMemberView: View {
    let member: FamilyMember
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                FamilyAvatar(member: member, size: 88)
                Text(member.name.isEmpty ? NativeText.text("family.member") : member.name).font(.largeTitle.bold()).foregroundStyle(Palette.ink)
                Text(NativeText.text("family.role.\(member.role)")).font(.subheadline.weight(.medium)).foregroundStyle(Palette.secondary)
                if !member.bio.isEmpty { Text(member.bio).font(.body).foregroundStyle(Palette.secondary) }
                if let profileID = member.profileID { Text("@\(profileID)").font(.subheadline).foregroundStyle(Palette.secondary) }
                if member.role == "child" { Text(NativeText.text("family.childBoundary")).font(.subheadline).foregroundStyle(Palette.secondary).padding(20).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24)) }
            }.frame(maxWidth: .infinity, alignment: .leading).padding(24)
        }.background(Palette.familyDetailCanvas).navigationTitle(NativeText.text("family.profile")).navigationBarTitleDisplayMode(.inline)
    }
}

private struct FamilyEditorView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.scenePhase) private var phase
    @Environment(\.locale) private var locale
    let appStore: AppStore
    var existing: FamilyDetail?
    private var store: FamiliesStore { appStore.families }
    @State private var draft = FamilyDraft()
    @State private var pin = ""
    @State private var confirmation = ""
    @State private var hasPin: Bool?
    @State private var preparationError: String?
    @State private var submitting = false
    private var ready: Bool { draft.isValid && (existing != nil || (hasPin != nil && pin.count == 5 && pin.allSatisfy(\.isASCII) && pin.allSatisfy(\.isNumber) && (hasPin == true || pin == confirmation))) }
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    FamilyEmblem(name: draft.name, color: draft.color, size: 100).padding(.vertical, 4)
                    VStack(alignment: .leading, spacing: 14) {
                        Text(NativeText.text("family.name")).font(.caption.weight(.semibold)).foregroundStyle(Palette.secondary)
                        TextField(NativeText.text("family.namePlaceholder"), text: $draft.name).font(.title3.weight(.semibold)).accessibilityIdentifier("family-name")
                        Divider()
                        Text(NativeText.text("family.motto")).font(.caption.weight(.semibold)).foregroundStyle(Palette.secondary)
                        TextField(NativeText.text("family.mottoPlaceholder"), text: $draft.motto, axis: .vertical).lineLimit(2...4).accessibilityIdentifier("family-motto")
                    }.foregroundStyle(Palette.ink).padding(20).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
                    VStack(alignment: .leading, spacing: 14) {
                        Text(NativeText.text("family.color")).font(.headline).foregroundStyle(Palette.ink)
                        HStack(spacing: 16) {
                            ForEach(FamilyColor.allCases) { color in
                                Button { draft.color = color; draft.changeColor = true } label: {
                                    Circle().fill(Palette.familyTint(color)).frame(width: 44, height: 44)
                                        .overlay { if draft.color == color { Image(systemName: "checkmark").font(.body.bold()).foregroundStyle(Palette.cardInk) } }
                                }.buttonStyle(CredentialPressStyle()).accessibilityLabel(NativeText.text("family.color.\(color.rawValue)"))
                                    .accessibilityAddTraits(draft.color == color ? .isSelected : []).accessibilityIdentifier("family-color-\(color.rawValue)")
                            }
                        }
                    }.padding(20).frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
                    if existing == nil { pinFields }
                    if let error = preparationError { FamilyErrorBanner(error: error) { Task { await prepare() } } }
                    if let error = store.error { Text(error).font(.subheadline).foregroundStyle(Palette.errorInk).padding(16).frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface, in: RoundedRectangle(cornerRadius: 20)).accessibilityIdentifier("family-form-error") }
                    if existing != nil { Text(NativeText.text("family.editNote")).font(.caption).foregroundStyle(Palette.secondary) }
                }.padding(20).disabled(store.busy || submitting)
            }.background(Palette.familiesCanvas)
                .navigationTitle(NativeText.text(existing == nil ? "family.create" : "family.edit")).navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button(NativeText.text("common.cancel")) { dismiss() }.disabled(store.busy || submitting) } }
                .safeAreaInset(edge: .bottom, spacing: 0) {
                    PrimaryButton(title: NativeText.text(store.busy || submitting ? "family.saving" : existing == nil ? "family.create" : "family.save"), loading: store.busy || submitting, disabled: !ready) {
                        let submittedPin = pin, submittedConfirmation = confirmation
                        pin = ""; confirmation = ""; submitting = true
                        Task {
                            defer { submitting = false }
                            let value: FamilyDetail?
                            if let existing { value = await store.edit(existing.id, draft: draft) }
                            else { value = await store.create(draft, pin: submittedPin, confirmation: submittedConfirmation) }
                            if value != nil {
                                if existing == nil { await appStore.refresh() }
                                dismiss()
                            } else if existing == nil { await prepare() }
                        }
                    }.accessibilityIdentifier("family-save").padding(20).background(Palette.surface)
                }
                .task {
                    store.error = nil
                    if let existing { draft = FamilyDraft(name: existing.title, motto: existing.motto, color: existing.color) }
                    else { await prepare() }
                }
                .onChange(of: phase) { _, phase in if phase == .background { pin = ""; confirmation = "" } }
        }.presentationDetents([.large]).presentationDragIndicator(.visible).interactiveDismissDisabled(store.busy || submitting)
    }
    @ViewBuilder private var pinFields: some View {
        if hasPin == nil && preparationError == nil { ProgressView(NativeText.text("family.preparing")) }
        else if hasPin != nil {
            VStack(alignment: .leading, spacing: 14) {
                Text(NativeText.text(hasPin == true ? "family.pin.enter" : "family.pin.create")).font(.headline).foregroundStyle(Palette.ink)
                Text(NativeText.text(appStore.isLive ? "family.pin.body" : "family.pin.sample")).font(.subheadline).foregroundStyle(Palette.secondary)
                SecureField(NativeText.text("family.pin.placeholder"), text: $pin).keyboardType(.asciiCapableNumberPad).textContentType(.password).accessibilityIdentifier("family-pin")
                if hasPin == false { Divider(); SecureField(NativeText.text("family.pin.confirm"), text: $confirmation).keyboardType(.asciiCapableNumberPad).textContentType(.password).accessibilityIdentifier("family-pin-confirm") }
            }.padding(20).foregroundStyle(Palette.ink).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
        }
    }
    private func prepare() async {
        preparationError = nil
        do { hasPin = try await store.hasPin() } catch { preparationError = NativeText.text("family.error.connection") }
    }
}

private struct FamilyInviteView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.scenePhase) private var phase
    let appStore: AppStore
    let family: FamilyDetail
    @State private var query = ""
    @State private var recipients: [AccountRecipient] = []
    @State private var selected: AccountRecipient?
    @State private var searching = false
    @State private var searchError = false
    @State private var pin = ""
    @State private var requestID = UUID().uuidString
    private var store: FamiliesStore { appStore.families }
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text(family.title).font(.title2.bold()).foregroundStyle(Palette.ink)
                    Text(NativeText.text("family.invite.explanation")).font(.subheadline).foregroundStyle(Palette.secondary)
                    TextField(NativeText.text("family.invite.search"), text: $query).autocorrectionDisabled().textInputAutocapitalization(.never)
                        .padding(18).background(Palette.surface, in: RoundedRectangle(cornerRadius: 20)).accessibilityIdentifier("family-recipient-search")
                    if searching { ProgressView(NativeText.text("family.invite.searching")) }
                    if searchError { Text(NativeText.text("family.error.connection")).font(.subheadline).foregroundStyle(Palette.errorInk) }
                    ForEach(recipients.filter { value in !family.guardians.contains { $0.profileID == value.id } }) { recipient in
                        Button { if selected?.id != recipient.id { requestID = UUID().uuidString; selected = recipient; pin = "" } } label: {
                            HStack(spacing: 12) {
                                FamilyAvatar(member: FamilyMember(id: recipient.id, name: recipient.name, role: "guardian"))
                                VStack(alignment: .leading, spacing: 4) { Text(recipient.name).font(.headline); Text("@\(recipient.id)").font(.caption).foregroundStyle(Palette.secondary) }
                                Spacer(); Image(systemName: selected?.id == recipient.id ? "checkmark.circle.fill" : "circle").foregroundStyle(Palette.selection)
                            }.foregroundStyle(Palette.ink).padding(16).background(Palette.surface, in: RoundedRectangle(cornerRadius: 20))
                        }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("family-recipient-\(recipient.id)")
                    }
                    if let selected {
                        VStack(alignment: .leading, spacing: 12) {
                            Text(NativeText.format("family.invite.review", selected.name)).font(.headline).foregroundStyle(Palette.ink)
                            Text(NativeText.text("family.invite.access")).font(.subheadline).foregroundStyle(Palette.secondary)
                            Divider()
                            Text(NativeText.text("family.pin.enter")).font(.caption.weight(.semibold)).foregroundStyle(Palette.secondary)
                            SecureField(NativeText.text("family.pin.placeholder"), text: $pin).keyboardType(.asciiCapableNumberPad).textContentType(.password).accessibilityIdentifier("family-invite-pin")
                            if !appStore.isLive { Text(NativeText.text("family.pin.sample")).font(.caption).foregroundStyle(Palette.secondary) }
                        }.padding(20).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
                    }
                    if let error = store.error { Text(error).font(.subheadline).foregroundStyle(Palette.errorInk).padding(16).frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface, in: RoundedRectangle(cornerRadius: 20)).accessibilityIdentifier("family-invite-error") }
                }.padding(20).disabled(store.busy)
            }.background(Palette.familyDetailCanvas)
                .navigationTitle(NativeText.text("family.invite")).navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button(NativeText.text("common.cancel")) { dismiss() }.disabled(store.busy) } }
                .safeAreaInset(edge: .bottom, spacing: 0) {
                    PrimaryButton(title: NativeText.text(store.busy ? "family.invite.sending" : "family.invite.send"), loading: store.busy,
                                  disabled: selected == nil || pin.count != 5 || !pin.allSatisfy(\.isASCII) || !pin.allSatisfy(\.isNumber)) {
                        guard let selected else { return }
                        let submitted = pin; pin = ""
                        Task { if await store.invite(family.id, recipient: selected.id, requestID: requestID, pin: submitted) { dismiss() } }
                    }.accessibilityIdentifier("family-invite-send").padding(20).background(Palette.surface)
                }
                .task(id: query) {
                    recipients = []; searching = false; searchError = false
                    guard query.trimmingCharacters(in: .whitespacesAndNewlines).count >= 2 else { return }
                    do {
                        try await Task.sleep(for: .milliseconds(250)); try Task.checkCancellation(); searching = true
                        let values = try await appStore.searchRecipients(query); try Task.checkCancellation(); recipients = values; searching = false
                    } catch is CancellationError {} catch { if !Task.isCancelled { searchError = true; searching = false } }
                }
                .onAppear { store.error = nil }
                .onChange(of: phase) { _, phase in if phase == .background { pin = "" } }
        }.presentationDetents([.large]).presentationDragIndicator(.visible).interactiveDismissDisabled(store.busy)
    }
}

private struct FamilyAvatar: View {
    let member: FamilyMember
    var size: CGFloat = 50
    private var fallback: some View { Text(member.name.split(separator: " ").prefix(2).compactMap(\.first).map(String.init).joined()).font(.system(size: size * 0.32, weight: .medium)).foregroundStyle(Palette.cardInk) }
    var body: some View {
        Group {
            if let url = member.imageURL {
                AsyncImage(url: url) { phase in if let image = phase.image { image.resizable().scaledToFill() } else if phase.error != nil { fallback } else { ProgressView().tint(Palette.cardInk) } }
            } else { fallback }
        }.frame(width: size, height: size).background(member.role == "child" ? Palette.studiesCard : Palette.blueCard).clipShape(Circle()).accessibilityHidden(true)
    }
}

private struct FamilyEmblem: View {
    let name: String
    let color: FamilyColor
    let size: CGFloat
    var body: some View {
        ZStack {
            Circle().fill(Palette.familyTint(color)).frame(width: size * 0.68).overlay(Circle().stroke(Palette.surface, lineWidth: 2)).offset(x: -size * 0.12, y: -size * 0.06)
            Circle().fill(color == .blue ? Palette.pinkCard : Palette.blueCard).frame(width: size * 0.5).overlay(Circle().stroke(Palette.surface, lineWidth: 2)).offset(x: size * 0.23, y: -size * 0.1)
            Circle().fill(Palette.studiesCard).frame(width: size * 0.36).overlay(Circle().stroke(Palette.surface, lineWidth: 2)).offset(x: size * 0.08, y: size * 0.27)
            Text(name.first.map { String($0).uppercased() } ?? "L").font(.system(size: size * 0.28, weight: .medium)).foregroundStyle(Palette.cardInk).offset(x: -size * 0.12, y: -size * 0.06)
        }.frame(width: size, height: size).accessibilityHidden(true)
    }
}

private struct FamilyArtwork: View {
    let family: FamilySummary
    let size: CGFloat
    var body: some View {
        Group {
            if let url = family.artworkURL {
                AsyncImage(url: url) { phase in
                    if let image = phase.image { image.resizable().scaledToFill().frame(width: size, height: size).clipShape(Circle()) }
                    else if phase.error != nil { FamilyEmblem(name: family.title, color: family.color, size: size) }
                    else { ProgressView().tint(Palette.selection).frame(width: size, height: size).background(Palette.familyTint(family.color), in: Circle()) }
                }
            } else { FamilyEmblem(name: family.title, color: family.color, size: size) }
        }.frame(width: size, height: size).accessibilityHidden(true)
    }
}

private struct FamilyActionRow: View {
    let title: String
    let subtitle: String
    let symbol: String
    let tint: Color
    var background = true
    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: symbol).font(.system(size: 20, weight: .regular)).foregroundStyle(Palette.cardInk).frame(width: 40, height: 40).background(tint, in: Circle()).accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 4) { Text(title).font(.body.weight(.semibold)).foregroundStyle(Palette.ink); Text(subtitle).font(.caption).foregroundStyle(Palette.secondary) }.frame(maxWidth: .infinity, alignment: .leading)
            Image(systemName: "chevron.forward").font(.caption.weight(.semibold)).foregroundStyle(Palette.secondary).accessibilityHidden(true)
        }.padding(18).background(background ? Palette.surface : .clear, in: RoundedRectangle(cornerRadius: 24))
    }
}

private struct FamilySampleNotice: View {
    var body: some View { Text(NativeText.text("family.sample")).font(.caption).foregroundStyle(Palette.secondary).padding(12).frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface.opacity(0.8), in: RoundedRectangle(cornerRadius: 14)) }
}

private struct FamilyErrorBanner: View {
    let error: String
    let retry: () -> Void
    var body: some View {
        VStack(alignment: .leading, spacing: 12) { Label(error, systemImage: "exclamationmark.circle").font(.subheadline).foregroundStyle(Palette.errorInk); Button(NativeText.text("common.retry"), action: retry).font(.subheadline.weight(.semibold)) }
            .padding(18).frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface, in: RoundedRectangle(cornerRadius: 20))
    }
}
