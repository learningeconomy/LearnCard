import SwiftUI
import LearnCardNativeSDK

struct PeopleView: View {
    @Environment(\.locale) private var nativeLocale
    @Environment(\.dynamicTypeSize) private var textSize
    let appStore: AppStore
    @State private var scope = PeopleScope.connections
    @State private var query = ""
    @FocusState private var searching: Bool
    private var people: PeopleStore { appStore.people }
    init(appStore: AppStore, initialScope: PeopleScope = .connections) { self.appStore = appStore; _scope = State(initialValue: initialScope) }
    private var currentResults: Bool { people.scope == scope && people.query == query }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                PageHeading(title: NativeText.text("people.title"), identifier: "people")
                IllustratedIntro(image: "PeopleIllustration", title: NativeText.text("people.intro"))
                HStack(spacing: 10) {
                    Image(systemName: "magnifyingglass").accessibilityHidden(true)
                    TextField(NativeText.text(scope == .find ? "people.findHint" : "people.searchHint"), text: $query)
                        .textInputAutocapitalization(.never).autocorrectionDisabled().submitLabel(.search).focused($searching).onSubmit { searching = false }.accessibilityIdentifier("people-search")
                    if !query.isEmpty { Button { query = "" } label: { Image(systemName: "xmark.circle.fill") }.accessibilityLabel(NativeText.text("people.clear")).accessibilityIdentifier("people-clear") }
                }.padding(16).foregroundStyle(Palette.secondary).background(Palette.surface, in: RoundedRectangle(cornerRadius: 20))
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach([PeopleScope.connections, .requests, .sent], id: \.self) { choice in
                            Button { scope = choice; query = "" } label: {
                                Text(NativeText.text("people.scope.\(choice.rawValue)")).font(.subheadline.weight(.semibold))
                                    .padding(.horizontal, 16).frame(minHeight: 46)
                                    .foregroundStyle(scope == choice ? Palette.selectionInk : Palette.ink)
                                    .background(scope == choice ? Palette.selection : Palette.surface, in: Capsule())
                            }.accessibilityIdentifier("people-scope-\(choice.rawValue)").accessibilityAddTraits(scope == choice ? .isSelected : [])
                        }
                    }
                }.accessibilityIdentifier("people-scopes")
                (textSize.isAccessibilitySize ? AnyLayout(VStackLayout(alignment: .leading, spacing: 12)) : AnyLayout(HStackLayout(spacing: 12))) {
                    scopeButton(.find)
                    scopeButton(.blocked)
                }
                if scope == .blocked { Text(NativeText.text("people.scope.blocked")).font(.title3.bold()) }
                if scope == .find { Text(NativeText.text("people.findBody")).font(.subheadline).foregroundStyle(Palette.secondary) }
                if currentResults, let error = people.error { PeopleErrorCard(error: error) { Task { await reload() } } }
                if people.loading || !currentResults { ProgressView(NativeText.text("people.loading")).padding(20).frame(maxWidth: .infinity).accessibilityIdentifier("people-loading") }
                ForEach(currentResults ? people.items : []) { person in
                    NavigationLink { PersonDetailView(appStore: appStore, id: person.id) } label: {
                        PersonRow(person: person)
                    }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("person-\(person.id)")
                }
                if currentResults && people.loaded && !people.hasMore && people.items.isEmpty && people.error == nil && !people.loading {
                    VStack(spacing: 12) {
                        Image("PeopleIllustration").resizable().scaledToFit().frame(height: 110).accessibilityHidden(true)
                        Text(NativeText.text(scope == .find && query.trimmingCharacters(in: .whitespacesAndNewlines).count < 2 ? "people.startSearch" : query.isEmpty ? "people.empty.\(scope.rawValue)" : "people.noMatches")).font(.title3.bold())
                        if scope == .connections && query.isEmpty {
                            Button(NativeText.text("people.scope.find")) { scope = .find }.font(.headline).frame(minHeight: 44).accessibilityIdentifier("people-find-empty")
                        }
                    }.multilineTextAlignment(.center).padding(24).frame(maxWidth: .infinity).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24)).accessibilityIdentifier("people-empty")
                }
                if currentResults && people.hasMore { Button(NativeText.text("people.more")) { Task { await people.load(scope: scope, query: query, more: true) } }.disabled(people.loading || people.busy).frame(maxWidth: .infinity, minHeight: 48).accessibilityIdentifier("people-more") }
                if currentResults && people.limited { Text(NativeText.text("people.refine")).font(.subheadline).foregroundStyle(Palette.secondary) }

            }.padding(NativeLayout.pageInset).frame(maxWidth: 680).frame(maxWidth: .infinity)
        }.background(Palette.paper).foregroundStyle(Palette.ink).navigationTitle("").navigationBarTitleDisplayMode(.inline)
            .task(id: "\(scope.rawValue)|\(query)|\(people.revision)") {
                do { if !query.isEmpty { try await Task.sleep(for: .milliseconds(300)) }; guard !Task.isCancelled else { return }; await reload() } catch {}
            }
            .refreshable { await reload() }
            .onChange(of: query) { _, value in if value.count > 100 { query = String(value.prefix(100)) } }
    }
    private func scopeButton(_ choice: PeopleScope) -> some View {
        Button { scope = choice; query = "" } label: {
            Label(NativeText.text("people.scope.\(choice.rawValue)"), systemImage: choice == .find ? "person.badge.plus" : "hand.raised")
                .font(.subheadline.weight(.semibold)).frame(maxWidth: .infinity, minHeight: 48).padding(.horizontal, 8)
                .foregroundStyle(scope == choice ? Palette.selectionInk : Palette.ink)
                .background(scope == choice ? Palette.selection : Palette.surface, in: RoundedRectangle(cornerRadius: 18))
        }.accessibilityIdentifier("people-scope-\(choice.rawValue)").accessibilityAddTraits(scope == choice ? .isSelected : [])
    }
    private func reload() async { await people.load(scope: scope, query: query) }
}

private struct PersonRow: View {
    @Environment(\.dynamicTypeSize) private var textSize
    let person: LearnCardPerson
    var body: some View {
        (textSize.isAccessibilitySize ? AnyLayout(VStackLayout(alignment: .leading, spacing: 12)) : AnyLayout(HStackLayout(spacing: 14))) {
            ProfileArtwork(url: person.imageURL, size: 46).padding(8).background(person.status == .incoming ? Palette.pinkCard : Palette.tealCard, in: RoundedRectangle(cornerRadius: 18))
            VStack(alignment: .leading, spacing: 4) {
                Text(person.name).font(.headline).foregroundStyle(Palette.ink)
                Text("@\(person.id)").font(.subheadline).foregroundStyle(Palette.secondary).environment(\.layoutDirection, .leftToRight)
                Text(NativeText.text("people.status.\(person.status.rawValue)")).font(.caption.weight(.medium)).foregroundStyle(Palette.secondary)
            }.frame(maxWidth: .infinity, alignment: .leading)
            Image(systemName: "chevron.forward").foregroundStyle(Palette.secondary).accessibilityHidden(true)
        }.padding(16).frame(minHeight: 94).multilineTextAlignment(.leading).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
    }
}

private struct PersonDetailView: View {
    @Environment(\.locale) private var nativeLocale
    let appStore: AppStore
    let id: String
    @State private var confirm: PeopleAction?
    @State private var sendTo: AccountRecipient?
    private var people: PeopleStore { appStore.people }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                if let person = people.detail, person.id == id {
                    VStack(spacing: 12) {
                        ProfileArtwork(url: person.imageURL, size: 80).padding(14).background(Palette.portfolioCard, in: RoundedRectangle(cornerRadius: 28))
                        Text(person.name).font(.largeTitle.bold()).accessibilityIdentifier("person-name")
                        Text("@\(person.id)").font(.title3).foregroundStyle(Palette.secondary).environment(\.layoutDirection, .leftToRight)
                        Text(NativeText.text("people.status.\(person.status.rawValue)")).font(.headline).accessibilityIdentifier("person-status")
                        if let bio = person.bio, !bio.isEmpty { Text(bio).font(.body).foregroundStyle(Palette.secondary) }
                    }.multilineTextAlignment(.center).frame(maxWidth: .infinity).padding(22).background(Palette.surface, in: RoundedRectangle(cornerRadius: 26))
                    Text(NativeText.text("people.privacy")).font(.subheadline).foregroundStyle(Palette.secondary)
                    if person.status == .connected {
                        Button { sendTo = AccountRecipient(id: person.id, name: person.name) } label: {
                            DrawnSettingsRow(title: NativeText.text("people.send"), symbol: .credential, tint: Palette.pinkCard,
                                             subtitle: NativeText.text("people.sendBody"))
                        }.buttonStyle(CredentialPressStyle()).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
                            .disabled(people.busy).accessibilityIdentifier("person-send")
                    }
                    if let error = people.error { Text(error).foregroundStyle(Palette.errorInk) }
                    if person.status == .none { primary(.connect) }
                    if person.status == .incoming { primary(.accept) }
                    if person.status == .outgoing { secondary(.cancel) }
                    if person.status == .connected { secondary(.disconnect) }
                    if person.status == .blocked { secondary(.unblock) } else { secondary(.block) }
                } else if people.detailLoading { ProgressView(NativeText.text("people.loading")).padding(40).frame(maxWidth: .infinity) }
                else if let error = people.error { PeopleErrorCard(error: error) { Task { await people.show(id: id) } } }
            }.padding(20).frame(maxWidth: 620).frame(maxWidth: .infinity)
        }.background(Palette.paper).foregroundStyle(Palette.ink).navigationTitle(NativeText.text("people.person")).navigationBarTitleDisplayMode(.inline)
            .task(id: people.revision) { await people.show(id: id) }
            .sheet(item: $sendTo) { recipient in
                NavigationStack {
                    CreationsView(store: appStore, sendOnSelect: true, initialRecipient: recipient)
                        .toolbar { ToolbarItem(placement: .cancellationAction) { Button(NativeText.text("common.done")) { sendTo = nil } } }
                }.environment(\.locale, NativeLanguage.selected.locale)
                    .environment(\.layoutDirection, NativeLanguage.selected.isRightToLeft ? .rightToLeft : .leftToRight)
            }
            .confirmationDialog(NativeText.text("people.action.\(confirm?.rawValue ?? "block")"), isPresented: Binding(get: { confirm != nil }, set: { if !$0 { confirm = nil } }), titleVisibility: .visible) {
                if let action = confirm {
                    Button(NativeText.text("people.action.\(action.rawValue)"), role: action == .block || action == .disconnect ? .destructive : nil) { confirm = nil; Task { _ = await people.act(action) } }
                }
                Button(NativeText.literal("Cancel"), role: .cancel) { confirm = nil }
            } message: { Text(NativeText.text("people.confirm.\(confirm?.rawValue ?? "block")")) }
    }
    private func primary(_ action: PeopleAction) -> some View {
        PrimaryButton(title: NativeText.text("people.action.\(action.rawValue)"), loading: people.busy, disabled: people.busy) { Task { _ = await people.act(action) } }.accessibilityIdentifier("person-action-\(action.rawValue)")
    }
    private func secondary(_ action: PeopleAction) -> some View {
        Button { confirm = action } label: {
            HStack { if people.busy { ProgressView() }; Text(NativeText.text("people.action.\(action.rawValue)")) }
                .font(.headline).frame(maxWidth: .infinity, minHeight: 54)
                .foregroundStyle(action == .block || action == .disconnect ? Palette.errorInk : Palette.ink)
                .background(Palette.surface, in: RoundedRectangle(cornerRadius: 20))
        }.disabled(people.busy).accessibilityIdentifier("person-action-\(action.rawValue)")
    }
}


private struct PeopleErrorCard: View {
    let error: String
    let retry: () -> Void
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label(error, systemImage: "exclamationmark.circle").font(.subheadline).foregroundStyle(Palette.errorInk)
            Button(NativeText.literal("Try Again"), action: retry).font(.headline).frame(minHeight: 44).foregroundStyle(Palette.ink)
        }.padding(18).frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
    }
}
