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
                            if family.canEdit {
                                Button(NativeText.text("family.edit")) { edit = true }
                                    .font(.subheadline.weight(.semibold)).foregroundStyle(Palette.cardInk)
                                    .padding(.top, 10).accessibilityIdentifier("family-edit")
                            }
                        }.frame(maxWidth: .infinity, alignment: .leading)
                        FamilyArtwork(family: family.summary, size: 100)
                    }.padding(20).background(Palette.familyTint(family.color), in: RoundedRectangle(cornerRadius: 24))
                    if !appStore.isLive { FamilySampleNotice() }
                    roster("family.guardians", members: family.guardians)
                    roster("family.children", members: family.children)
                    if family.canInvite {
                        Button { invite = true } label: {
                            FamilyActionRow(title: NativeText.text("family.invite"), subtitle: NativeText.text("family.inviteBody"), symbol: "person.badge.plus", tint: Palette.studiesCard)
                        }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("family-invite")
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
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let appStore: AppStore
    let family: FamilyDetail
    @State private var query = ""
    @State private var recipients: [AccountRecipient] = []
    @State private var selected: AccountRecipient?
    @State private var searching = false
    @State private var searchError = false
    @State private var reviewing = false
    @State private var pin = ""
    @State private var requestID = UUID().uuidString
    @FocusState private var searchFocused: Bool
    private var store: FamiliesStore { appStore.families }
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    PageHeading(title: NativeText.text(reviewing ? "family.invite.reviewTitle" : "family.invite"))
                    Text(family.title).font(.subheadline.weight(.medium)).foregroundStyle(Palette.secondary)
                    if reviewing, let selected {
                        HStack(spacing: 14) {
                            FamilyAvatar(member: FamilyMember(id: selected.id, name: selected.name, role: "guardian"), size: 62)
                            VStack(alignment: .leading, spacing: 5) {
                                Text(selected.name).font(.title3.bold())
                                Text("@\(selected.id)").font(.subheadline).foregroundStyle(Palette.secondary)
                            }
                        }.frame(maxWidth: .infinity, alignment: .leading).padding(18).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
                        HStack(alignment: .top, spacing: 14) {
                            DrawnTile(symbol: .key, tint: Palette.pinkCard, size: 62)
                            VStack(alignment: .leading, spacing: 10) {
                                Text(NativeText.format("family.invite.review", selected.name)).font(.title2.bold())
                                Text(NativeText.text("family.invite.access")).font(.body).foregroundStyle(Palette.secondary)
                            }.frame(maxWidth: .infinity, alignment: .leading)
                        }.padding(18).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
                        VStack(alignment: .leading, spacing: 14) {
                            Text(NativeText.text("family.pin.enter")).font(.headline)
                            SecureField(text: $pin, prompt: Text(NativeText.text("family.pin.placeholder")).foregroundStyle(.clear)) {
                                Text(NativeText.text("family.pin.placeholder"))
                            }.keyboardType(.asciiCapableNumberPad).textContentType(.password)
                                .font(.title2.monospaced()).foregroundStyle(.clear).tint(.clear)
                                .padding(.horizontal, 18).frame(minHeight: 64)
                                .overlay {
                                    HStack {
                                        ForEach(0..<5) { index in
                                            Circle().fill(index < pin.count ? Palette.ink : Palette.line).frame(width: 9, height: 9).frame(maxWidth: .infinity)
                                        }
                                    }.padding(.horizontal, 20).allowsHitTesting(false).accessibilityHidden(true)
                                }.background(Palette.surface, in: RoundedRectangle(cornerRadius: 16))
                                .overlay(RoundedRectangle(cornerRadius: 16).stroke(Palette.line))
                                .accessibilityIdentifier("family-invite-pin")
                                .onChange(of: pin) { _, value in
                                    let digits = String(value.filter { $0.isASCII && $0.isNumber }.prefix(5))
                                    if digits != value { pin = digits }
                                }
                            if !appStore.isLive { Text(NativeText.text("family.pin.sample")).font(.footnote).foregroundStyle(Palette.secondary) }
                        }
                    } else {
                        Text(NativeText.text("family.invite.findAccount")).font(.body).foregroundStyle(Palette.secondary)
                        Image("FamilyInviteIllustration").resizable().scaledToFit().frame(height: 132)
                            .frame(maxWidth: .infinity).accessibilityHidden(true)
                        HStack(spacing: 10) {
                            Image(systemName: "magnifyingglass").foregroundStyle(Palette.secondary)
                            TextField(NativeText.text("family.invite.search"), text: $query).focused($searchFocused)
                                .autocorrectionDisabled().textInputAutocapitalization(.never).accessibilityIdentifier("family-recipient-search")
                        }.padding(16).background(Palette.surface, in: RoundedRectangle(cornerRadius: 18))
                        Text(NativeText.text("family.invite.choose")).font(.title3.bold())
                        if searching { ProgressView(NativeText.text("family.invite.searching")) }
                        if searchError { Text(NativeText.text("family.error.connection")).font(.subheadline).foregroundStyle(Palette.errorInk) }
                        ForEach(recipients.filter { value in !family.guardians.contains { $0.profileID == value.id } }) { recipient in
                            Button {
                                if selected?.id != recipient.id { requestID = UUID().uuidString; selected = recipient; pin = "" }
                            } label: {
                                HStack(spacing: 14) {
                                    FamilyAvatar(member: FamilyMember(id: recipient.id, name: recipient.name, role: "guardian"))
                                    VStack(alignment: .leading, spacing: 5) {
                                        Text(recipient.name).font(.headline)
                                        Text("@\(recipient.id)").font(.subheadline).foregroundStyle(Palette.secondary)
                                    }.frame(maxWidth: .infinity, alignment: .leading)
                                    Image(systemName: selected?.id == recipient.id ? "checkmark.circle.fill" : "circle").font(.title2).foregroundStyle(Palette.selection)
                                }.padding(16).background(selected?.id == recipient.id ? Palette.blueCard.opacity(0.25) : Palette.surface, in: RoundedRectangle(cornerRadius: 20))
                            }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("family-recipient-\(recipient.id)")
                        }
                    }
                    if let error = store.error { Text(error).font(.subheadline).foregroundStyle(Palette.errorInk).padding(16).frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface, in: RoundedRectangle(cornerRadius: 20)).accessibilityIdentifier("family-invite-error") }
                }.padding(20).foregroundStyle(Palette.ink).disabled(store.busy)
            }.background(Palette.familyDetailCanvas).scrollDismissesKeyboard(.interactively)
                .navigationTitle("").navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button(NativeText.text(reviewing ? "common.back" : "common.cancel")) {
                            if reviewing { pin = ""; reviewing = false; store.error = nil } else { dismiss() }
                        }.disabled(store.busy)
                    }
                }
                .safeAreaInset(edge: .bottom, spacing: 0) {
                    VStack(spacing: 10) {
                        ConsumerActionButton(title: NativeText.text(reviewing ? store.busy ? "family.invite.sending" : "family.invite.send" : "family.invite.reviewAction"), busy: store.busy,
                                             disabled: selected == nil || reviewing && (pin.count != 5 || !pin.allSatisfy(\.isASCII) || !pin.allSatisfy(\.isNumber))) {
                            guard let selected else { return }
                            if !reviewing {
                                searchFocused = false
                                withAnimation(reduceMotion ? nil : .easeInOut(duration: 0.2)) { reviewing = true }
                            } else {
                                let submitted = pin; pin = ""
                                Task { if await store.invite(family.id, recipient: selected.id, requestID: requestID, pin: submitted) { dismiss() } }
                            }
                        }.accessibilityIdentifier(reviewing ? "family-invite-send" : "family-invite-review")
                        if reviewing { Text(NativeText.text("family.invite.confirmNote")).font(.footnote).foregroundStyle(Palette.secondary).multilineTextAlignment(.center) }
                    }.padding(20).background(Palette.surface)
                }
                .task(id: query) {
                    recipients = []; searching = false; searchError = false
                    guard query.trimmingCharacters(in: .whitespacesAndNewlines).count >= 2 else { return }
                    do {
                        try await Task.sleep(for: .milliseconds(250)); try Task.checkCancellation(); searching = true
                        let values = try await appStore.searchRecipients(query); try Task.checkCancellation(); recipients = values; searching = false
                    } catch is CancellationError {} catch { if !Task.isCancelled { searchError = true; searching = false } }
                }
                .onChange(of: query) { _, _ in selected = nil; pin = "" }
                .onAppear { store.error = nil }
                .onChange(of: phase) { _, phase in if phase == .background { pin = ""; reviewing = false } }
        }.presentationDetents([.large]).presentationDragIndicator(.visible).interactiveDismissDisabled(store.busy)
    }
}

private struct FamilyAvatar: View {
    let member: FamilyMember
    var size: CGFloat = 50
    private var fallback: some View { Image("AccountAvatar").resizable().scaledToFit().padding(size * 0.08) }
    var body: some View {
        Group {
            if let url = member.imageURL {
                AsyncImage(url: url) { phase in if let image = phase.image { image.resizable().scaledToFill() } else if phase.error != nil { fallback } else { ProgressView().tint(Palette.cardInk) } }
            } else { fallback }
        }.frame(width: size, height: size).background(member.role == "child" ? Palette.studiesCard : Palette.blueCard).clipShape(RoundedRectangle(cornerRadius: size * 0.25)).accessibilityHidden(true)
    }
}

private struct FamilyEmblem: View {
    let name: String
    let color: FamilyColor
    let size: CGFloat
    var body: some View {
        Image("FamilyConstellation").resizable().scaledToFit().padding(size * 0.05)
            .frame(width: size, height: size).background(Palette.familyTint(color), in: RoundedRectangle(cornerRadius: size * 0.22))
            .accessibilityHidden(true)
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
        DrawnSettingsRow(title: title, symbol: .family, tint: tint, subtitle: subtitle)
            .padding(4).background(background ? Palette.surface : .clear, in: RoundedRectangle(cornerRadius: 22))
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
