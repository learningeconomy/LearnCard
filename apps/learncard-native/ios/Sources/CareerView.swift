import SwiftUI
import SafariServices
import LearnCardNativeSDK

struct CareerView: View {
    @Environment(\.dynamicTypeSize) private var textSize
    @Environment(\.scenePhase) private var phase
    let appStore: AppStore
    @State private var input = ""
    @FocusState private var searching: Bool
    private var careers: CareerStore { appStore.careers }
    private var valid: Bool { input.trimmingCharacters(in: .whitespacesAndNewlines).count >= 2 && input.utf16.count <= 100 }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: NativeLayout.sectionGap) {
                PageHeading(title: NativeText.text("career.heading"), identifier: "careers", accent: Palette.flairTeal)
                Text(NativeText.text("career.intro")).foregroundStyle(Palette.secondary)
                if !appStore.isLive { Text(NativeText.text("career.demo")).font(.footnote).foregroundStyle(Palette.secondary) }
                if careers.checking { ProgressView(NativeText.text("career.checking")) }
                if careers.access?.enabled == true {
                    searchBox
                    if let error = careers.error { CareerFeedback(error: error) { search(careers.attemptedQuery) } }
                    if careers.loading { ProgressView(NativeText.text("career.searching")).accessibilityIdentifier("career-loading") }
                    if let result = careers.result {
                        Text(NativeText.format("career.resultsFor", careers.query)).font(.headline).accessibilityIdentifier("career-results-heading")
                        ForEach(result.occupations) { occupation in
                            NavigationLink { CareerDetailView(appStore: appStore, occupation: occupation) } label: {
                                let layout = textSize.isAccessibilitySize ? AnyLayout(VStackLayout(alignment: .leading, spacing: 14)) : AnyLayout(HStackLayout(alignment: .top, spacing: 14))
                                layout {
                                    DrawnTile(symbol: .career, tint: Palette.tealCard, size: 54)
                                    VStack(alignment: .leading, spacing: 8) {
                                        Text(occupation.title).font(.title3.bold())
                                        if !occupation.summary.isEmpty { Text(occupation.summary).font(.subheadline).foregroundStyle(Palette.secondary).lineLimit(3) }
                                        Text(NativeText.text("career.view")).font(.subheadline.weight(.semibold)).foregroundStyle(Palette.green)
                                    }.frame(maxWidth: .infinity, alignment: .leading)
                                    if !textSize.isAccessibilitySize { Image(systemName: "chevron.forward").accessibilityHidden(true) }
                                }.padding(18).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
                            }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("career-result-\(occupation.id)")
                        }
                        if result.occupations.isEmpty, careers.error == nil { emptyPanel("career.empty", "career.emptyBody") }
                        if result.limited { Text(NativeText.text("career.limited")).font(.footnote).foregroundStyle(Palette.secondary) }
                    } else if !careers.loading, careers.error == nil {
                        emptyPanel("career.firstTitle", "career.firstBody")
                    }
                    Text(NativeText.text("career.provider")).font(.footnote).foregroundStyle(Palette.secondary)
                } else if !careers.checking, let error = careers.error {
                    CareerFeedback(error: error) { Task { await careers.checkAccess() } }
                }
            }.padding(NativeLayout.pageInset).frame(maxWidth: 680).frame(maxWidth: .infinity)
        }.background(Palette.paper).foregroundStyle(Palette.ink).scrollDismissesKeyboard(.interactively)
            .navigationTitle(NativeText.text("career.title")).navigationBarTitleDisplayMode(.inline)
            .task { await careers.checkAccess() }
            .onChange(of: phase) { _, value in
                if value == .background { input = ""; careers.lock() }
                if value == .active { Task { await careers.checkAccess() } }
            }
    }
    private var searchBox: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(NativeText.text("career.searchLabel")).font(.headline)
            HStack {
                Image(systemName: "magnifyingglass").accessibilityHidden(true)
                TextField(NativeText.text("career.placeholder"), text: $input).focused($searching).autocorrectionDisabled().submitLabel(.search)
                    .onSubmit { if valid { search(input) } }.accessibilityIdentifier("career-input")
                if !input.isEmpty {
                    Button { input = ""; careers.clearSearch() } label: { Image(systemName: "xmark.circle.fill").frame(minWidth: 44, minHeight: 44) }
                        .accessibilityLabel(NativeText.text("people.clear")).accessibilityIdentifier("career-clear")
                }
            }.foregroundStyle(Palette.secondary).padding(14).background(Palette.surface, in: RoundedRectangle(cornerRadius: 20))
            PrimaryButton(title: NativeText.text(careers.loading ? "career.searching" : "career.search"), loading: careers.loading, disabled: !valid || careers.checking, fill: Palette.selection) { search(input) }
                .accessibilityIdentifier("career-search")
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach([("design", "design"), ("technology", "technology"), ("helping", "helping people")], id: \.0) { key, keyword in
                        Button(NativeText.text("career.idea.\(key)")) { input = keyword; search(keyword) }
                            .font(.subheadline.weight(.medium)).padding(.horizontal, 16).frame(minHeight: 44).background(Palette.surface, in: Capsule()).disabled(careers.loading)
                    }
                }
            }
        }
    }
    private func search(_ text: String) { searching = false; Task { await careers.search(text) } }
    private func emptyPanel(_ title: String, _ body: String) -> some View {
        HStack(alignment: .top, spacing: 16) {
            DrawnTile(symbol: .skill, tint: Palette.lilacCard, size: 60)
            VStack(alignment: .leading, spacing: 10) { Text(NativeText.text(title)).font(.title3.bold()); Text(NativeText.text(body)).foregroundStyle(Palette.secondary) }
        }.padding(20).frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22)).accessibilityIdentifier("career-empty")
    }
}

private struct CareerDetailView: View {
    @Environment(\.locale) private var locale
    @Environment(\.layoutDirection) private var direction
    @Environment(\.dynamicTypeSize) private var textSize
    @Environment(\.scenePhase) private var phase
    let appStore: AppStore
    let occupation: CareerOccupation
    @State private var goalReview = false
    @State private var readingGoals = false
    @State private var browser: CareerSchoolDestination?
    private var careers: CareerStore { appStore.careers }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: NativeLayout.sectionGap) {
                if careers.access?.enabled == true {
                    let layout = textSize.isAccessibilitySize ? AnyLayout(VStackLayout(alignment: .leading, spacing: 16)) : AnyLayout(HStackLayout(alignment: .top, spacing: 16))
                    layout {
                        DrawnTile(symbol: .career, tint: Palette.tealCard, size: 60)
                        Text(occupation.title).font(.title.bold()).headingFlair(Palette.flairTeal, size: 26).accessibilityAddTraits(.isHeader).accessibilityIdentifier("career-detail-title")
                    }
                    if !occupation.summary.isEmpty { panel("career.about") { Text(occupation.summary).foregroundStyle(Palette.secondary) } }
                    if !occupation.skills.isEmpty {
                        panel("career.skills") {
                            ForEach(occupation.skills) { skill in
                                VStack(alignment: .leading, spacing: 6) { Text(skill.name).font(.headline); if !skill.description.isEmpty { Text(skill.description).foregroundStyle(Palette.secondary) } }
                            }
                            Text(NativeText.text("career.skillsNotice")).font(.footnote).foregroundStyle(Palette.secondary)
                        }
                    }
                    if !occupation.tasks.isEmpty { panel("career.tasks") { ForEach(occupation.tasks, id: \.self) { Text($0).foregroundStyle(Palette.secondary) } } }
                    if !occupation.education.isEmpty || !occupation.experience.isEmpty || !occupation.training.isEmpty {
                        panel("career.preparation") {
                            preparation("career.education", occupation.education); preparation("career.experience", occupation.experience); preparation("career.training", occupation.training)
                        }
                    }
                    learning
                    VStack(alignment: .leading, spacing: 12) {
                        Text(NativeText.text("career.goalTitle")).font(.title3.bold())
                        Text(NativeText.text("career.goalBody")).foregroundStyle(Palette.secondary)
                        if let error = appStore.learner.goalsError { Text(error.localizedDescription).font(.footnote).foregroundStyle(Palette.errorInk) }
                        PrimaryButton(title: NativeText.text(readingGoals ? "career.readingGoals" : "career.addGoal"), loading: readingGoals, disabled: false, fill: Palette.selection) {
                            guard !readingGoals else { return }; readingGoals = true
                            Task {
                                await appStore.learner.loadGoals(); readingGoals = false
                                if appStore.learner.goalsError == nil, appStore.learner.goals != nil, careers.access?.enabled == true { appStore.learner.clearSaveError(); goalReview = true }
                            }
                        }.accessibilityIdentifier("career-add-goal")
                    }.padding(20).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
                    Text(NativeText.text("career.provider")).font(.footnote).foregroundStyle(Palette.secondary)
                } else if let error = careers.error { CareerFeedback(error: error) { Task { await careers.checkAccess() } } }
            }.padding(NativeLayout.pageInset).frame(maxWidth: 680).frame(maxWidth: .infinity)
        }.background(Palette.paper).foregroundStyle(Palette.ink).navigationTitle(NativeText.text("career.detail")).navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $goalReview) {
                if let value = appStore.learner.goals { GoalsEditorView(appStore: appStore, original: value, proposedGoal: occupation.title).environment(\.locale, locale).environment(\.layoutDirection, direction).environment(\.dynamicTypeSize, textSize) }
            }
            .sheet(item: $browser) { CareerSchoolBrowser(url: $0.url).ignoresSafeArea() }
            .onChange(of: phase) { _, value in if value == .background { goalReview = false; browser = nil } }
    }
    private var learning: some View {
        panel("career.learning") {
            Text(NativeText.text("career.learningBody")).font(.subheadline).foregroundStyle(Palette.secondary)
            if let error = careers.programErrors[occupation.id] { Text(error.localizedDescription).foregroundStyle(Palette.errorInk).accessibilityIdentifier("career-program-error") }
            if let result = careers.programs[occupation.id] {
                ForEach(result.programs) { program in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(program.title).font(.headline); Text(program.school).font(.subheadline.weight(.semibold))
                        if !program.location.isEmpty { Text(program.location).foregroundStyle(Palette.secondary) }
                        ForEach(program.lengths, id: \.self) { Text($0).font(.subheadline).foregroundStyle(Palette.secondary) }
                        if !program.formats.isEmpty { Text(program.formats.joined(separator: " · ")).font(.subheadline).foregroundStyle(Palette.secondary) }
                        if let url = program.schoolURL {
                            Button { browser = CareerSchoolDestination(url: url) } label: { Label(NativeText.text("career.school"), systemImage: "arrow.up.right").font(.subheadline.weight(.semibold)).frame(minHeight: 44) }
                                .accessibilityIdentifier("career-school-\(program.id)")
                        }
                    }.padding(.vertical, 8)
                    Divider()
                }
                if result.programs.isEmpty { Text(NativeText.text(result.unavailable > 0 ? "career.programPartial" : "career.programEmpty")).foregroundStyle(Palette.secondary) }
                else if result.unavailable > 0 { Text(NativeText.text("career.programPartial")).font(.footnote).foregroundStyle(Palette.secondary) }
                if result.limited { Text(NativeText.text("career.programLimited")).font(.footnote).foregroundStyle(Palette.secondary) }
            }
            if careers.programs[occupation.id] == nil || careers.programErrors[occupation.id] != nil {
                Button { Task { await careers.loadPrograms(occupation.id) } } label: {
                    HStack { if careers.loadingProgram == occupation.id { ProgressView() }; Text(NativeText.text(careers.loadingProgram == occupation.id ? "career.programLoading" : careers.programErrors[occupation.id] == nil ? "career.programFind" : "career.retry")) }.font(.headline).frame(minHeight: 48)
                }.disabled(careers.loadingProgram != nil).accessibilityIdentifier("career-programs")
            }
        }
    }
    private func panel<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 16) { Text(NativeText.text(title)).font(.title3.bold()).accessibilityAddTraits(.isHeader); content() }
            .padding(20).frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
    }
    @ViewBuilder private func preparation(_ label: String, _ value: String) -> some View {
        if !value.isEmpty { VStack(alignment: .leading, spacing: 6) { Text(NativeText.text(label)).font(.subheadline.weight(.semibold)); Text(value).foregroundStyle(Palette.secondary) } }
    }
}
private struct CareerFeedback: View {
    let error: CareerError
    let retry: () -> Void
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(error.localizedDescription).foregroundStyle(error.blocksAccess ? Palette.secondary : Palette.errorInk).accessibilityIdentifier("career-feedback")
            Button(NativeText.text("career.retry"), action: retry).font(.headline).frame(minHeight: 44)
        }.padding(20).frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
    }
}
private struct CareerSchoolDestination: Identifiable { let id = UUID(); let url: URL }
private struct CareerSchoolBrowser: UIViewControllerRepresentable {
    let url: URL
    func makeUIViewController(context: Context) -> SFSafariViewController { SFSafariViewController(url: url) }
    func updateUIViewController(_ controller: SFSafariViewController, context: Context) {}
}
