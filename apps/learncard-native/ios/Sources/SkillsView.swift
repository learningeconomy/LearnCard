import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

struct SkillsView: View {
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.locale) private var locale
    @Environment(\.layoutDirection) private var direction
    @Environment(\.dynamicTypeSize) private var textSize
    let appStore: AppStore
    @State private var query = ""
    @State private var filter = "all"
    @State private var editingGoals = false
    private var learner: LearnerStore { appStore.learner }
    private var visibleSkills: [LearnerSkill] {
        learner.skills.filter { skill in
            (query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || skill.name.localizedCaseInsensitiveContains(query.trimmingCharacters(in: .whitespacesAndNewlines))) &&
            (filter == "all" || skill.sources.contains { filter == "self" ? $0.selfReported : !$0.selfReported })
        }.sorted { $0.name.localizedStandardCompare($1.name) == .orderedAscending }
    }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: NativeLayout.sectionGap) {
                PageHeading(title: NativeText.text("skills.heading"), identifier: "skills", accent: Palette.flairTeal)
                Text(NativeText.text("skills.intro")).foregroundStyle(Palette.secondary)
                goalsSection
                HStack {
                    Image(systemName: "magnifyingglass").accessibilityHidden(true)
                    TextField(NativeText.text("skills.search"), text: $query).autocorrectionDisabled().submitLabel(.search).accessibilityIdentifier("skills-search")
                    if !query.isEmpty { Button { query = "" } label: { Image(systemName: "xmark.circle.fill").frame(minWidth: 44, minHeight: 44) }.accessibilityLabel(NativeText.text("people.clear")) }
                }.foregroundStyle(Palette.secondary).padding(14).background(Palette.surface, in: RoundedRectangle(cornerRadius: 20))
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(["all", "credentials", "self"], id: \.self) { value in
                            Button { filter = value } label: {
                                Text(NativeText.text("skills.filter.\(value)")).font(.subheadline.weight(.semibold)).padding(.horizontal, 16).frame(minHeight: 46)
                                    .foregroundStyle(filter == value ? Palette.selectionInk : Palette.ink)
                                    .background(filter == value ? Palette.selection : Palette.surface, in: Capsule())
                            }.accessibilityIdentifier("skills-filter-\(value)").accessibilityAddTraits(filter == value ? .isSelected : [])
                        }
                    }
                }
                if let error = learner.error { LearnerErrorCard(error: error) { Task { await learner.load(reset: true) } } }
                if learner.loading { ProgressView(NativeText.text("skills.loading")).accessibilityIdentifier("skills-loading") }
                ForEach(visibleSkills) { skill in
                    NavigationLink { SkillSourcesView(appStore: appStore, skillID: skill.id) } label: { SkillSummaryRow(skill: skill) }
                        .buttonStyle(CredentialPressStyle()).accessibilityIdentifier("skill-\(skill.name)")
                }
                if learner.hasMore {
                    Text(NativeText.text("skills.moreNotice")).font(.footnote).foregroundStyle(Palette.secondary)
                    Button { Task { await learner.load() } } label: {
                        HStack(spacing: 8) {
                            if learner.loading { ProgressView() }
                            Text(NativeText.text(learner.loading ? "skills.loading" : "skills.more"))
                        }.font(.headline).frame(minHeight: 48)
                    }.disabled(learner.loading).accessibilityIdentifier("skills-more")
                }
                if learner.unavailable > 0 {
                    Text(NativeText.text("skills.partial")).font(.subheadline).foregroundStyle(Palette.secondary)
                    Button(NativeText.literal("Try Again")) { Task { await learner.load(reset: true) } }.frame(minHeight: 44)
                }
                if learner.loaded, !learner.loading, learner.error == nil, learner.unavailable == 0, visibleSkills.isEmpty {
                    VStack(spacing: 14) {
                        DrawnTile(symbol: .skill, tint: Palette.lilacCard, size: 88)
                        Text(NativeText.text(learner.hasMore ? "skills.checkingEmpty" : query.isEmpty && filter == "all" ? "skills.empty" : "skills.noMatches")).font(.title3.bold())
                        Text(NativeText.text(learner.hasMore ? "skills.moreNotice" : query.isEmpty && filter == "all" ? "skills.emptyBody" : "skills.noMatchesBody")).font(.subheadline).foregroundStyle(Palette.secondary)
                    }.multilineTextAlignment(.center).padding(24).frame(maxWidth: .infinity).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24)).accessibilityIdentifier("skills-empty")
                }
            }.padding(NativeLayout.pageInset).frame(maxWidth: 680).frame(maxWidth: .infinity)
        }.background(Palette.paper).foregroundStyle(Palette.ink).scrollDismissesKeyboard(.interactively)
            .navigationTitle(NativeText.text("skills.title")).navigationBarTitleDisplayMode(.inline)
            .task { await reload() }.refreshable { await reload() }
            .sheet(isPresented: $editingGoals, onDismiss: { Task { await learner.loadGoals() } }) {
                if let value = learner.goals {
                    GoalsEditorView(appStore: appStore, original: value)
                        .environment(\.locale, locale).environment(\.layoutDirection, direction).environment(\.dynamicTypeSize, textSize)
                }
            }
            .onChange(of: scenePhase) { _, phase in
                if phase == .background { query = ""; editingGoals = false; learner.lock() }
                else if phase == .active { Task { await reload() } }
            }
    }
    private func reload() async { await learner.load(reset: true); await learner.loadGoals() }
    private var goalsSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(NativeText.text("goals.title")).font(.title2.bold()).headingFlair(Palette.flairYellow)
            if learner.goalsLoading { ProgressView(NativeText.text("goals.loading")) }
            if let error = learner.goalsError { LearnerErrorCard(error: error) { Task { await learner.loadGoals() } } }
            if let value = learner.goals {
                VStack(alignment: .leading, spacing: 14) {
                    if value.goals.isEmpty { Text(NativeText.text("goals.empty")).foregroundStyle(Palette.secondary) }
                    if let goal = value.goals.first {
                        HStack(alignment: .top, spacing: 12) { Image(systemName: "flag").foregroundStyle(Palette.green).accessibilityHidden(true); Text(goal).lineLimit(2).frame(maxWidth: .infinity, alignment: .leading) }
                        Text(NativeText.count("goals.count", value.goals.count)).font(.footnote).foregroundStyle(Palette.secondary)
                    }
                    Button(NativeText.text(value.goals.isEmpty ? "goals.add" : "goals.edit")) { learner.clearSaveError(); editingGoals = true }
                        .font(.headline).frame(minHeight: 44).foregroundStyle(Palette.green).accessibilityIdentifier("goals-edit")
                }.padding(20).frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
            }
        }
    }
}

private struct SkillSummaryRow: View {
    let skill: LearnerSkill
    @Environment(\.dynamicTypeSize) private var size
    var body: some View {
        (size.isAccessibilitySize ? AnyLayout(VStackLayout(alignment: .leading, spacing: 12)) : AnyLayout(HStackLayout(spacing: 14))) {
            DrawnTile(symbol: .skill, tint: Palette.lilacCard, size: 54)
            VStack(alignment: .leading, spacing: 6) {
                Text(skill.name).font(.headline).foregroundStyle(Palette.ink)
                Text(NativeText.count("skills.sourcesCount", skill.sources.count)).font(.subheadline).foregroundStyle(Palette.secondary)
                if skill.sources.contains(where: \.selfReported) { Text(NativeText.text("skills.selfAssessed")).font(.caption.weight(.medium)).foregroundStyle(Palette.secondary) }
            }.frame(maxWidth: .infinity, alignment: .leading)
            Image(systemName: "chevron.right").font(.footnote.weight(.semibold)).foregroundStyle(Palette.secondary).accessibilityHidden(true)
        }.padding(18).frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24)).accessibilityElement(children: .combine)
    }
}

private struct SkillSourcesView: View {
    let appStore: AppStore
    let skillID: String
    @State private var selected: Credential?
    @State private var opening: String?
    @State private var retrySource: String?
    @State private var error: LearnerError?
    private var skill: LearnerSkill? { appStore.learner.skills.first { $0.id == skillID } }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                if let skill {
                    DrawnTile(symbol: .skill, tint: Palette.lilacCard, size: 88)
                    Text(skill.name).font(.largeTitle.bold()).foregroundStyle(Palette.ink).accessibilityAddTraits(.isHeader)
                        .headingFlair(Palette.flairTeal, size: 32).accessibilityIdentifier("page-title-skill-detail")
                    if !skill.description.isEmpty { Text(skill.description).foregroundStyle(Palette.secondary) }
                    if !skill.framework.isEmpty { Text(skill.framework).font(.subheadline).foregroundStyle(Palette.secondary) }
                    Text(NativeText.text("skills.sources")).font(.title2.bold())
                    if let error { LearnerErrorCard(error: error) { if let retrySource { open(retrySource) } } }
                    ForEach(skill.sources) { source in
                        Button {
                            open(source.id)
                        } label: {
                            HStack(alignment: .top, spacing: 14) {
                                DrawnTile(symbol: .credential, tint: Palette.blueCard)
                                VStack(alignment: .leading, spacing: 8) {
                                    Text(source.title.isEmpty ? NativeText.text("skills.sourceFallback") : source.title).font(.headline)
                                    if !source.issuer.isEmpty { Text(NativeText.format("skills.issuedBy", source.issuer)).font(.subheadline).foregroundStyle(Palette.secondary) }
                                    if source.selfReported { Text(NativeText.text("skills.selfAssessed")).font(.subheadline).foregroundStyle(Palette.secondary) }
                                    Text(NativeText.text("skills.viewSource")).font(.subheadline.weight(.semibold)).foregroundStyle(Palette.green)
                                    if opening == source.id { ProgressView(NativeText.text("skills.opening")) }
                                }.frame(maxWidth: .infinity, alignment: .leading)
                            }.padding(18).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
                        }.buttonStyle(CredentialPressStyle()).disabled(opening != nil).accessibilityIdentifier("skill-source-\(source.id)")
                    }
                    Text(NativeText.text("skills.provenanceNotice")).font(.footnote).foregroundStyle(Palette.secondary)
                }
            }.padding(NativeLayout.pageInset).frame(maxWidth: 680).frame(maxWidth: .infinity)
        }.background(Palette.paper).foregroundStyle(Palette.ink).navigationTitle(NativeText.text("skills.detailTitle")).navigationBarTitleDisplayMode(.inline)
            .navigationDestination(item: $selected) { CredentialDetailView(store: appStore, credential: $0) }
    }
    private func open(_ id: String) {
        guard opening == nil else { return }; opening = id; retrySource = id; error = nil
        Task {
            do { selected = try await appStore.learner.source(id: id); retrySource = nil }
            catch { self.error = error as? LearnerError ?? .connection }
            opening = nil
        }
    }
}

struct GoalsEditorView: View {
    @Environment(\.dismiss) private var dismiss
    let appStore: AppStore
    let original: LearnerGoals
    @State private var draft: [String]
    @State private var newGoal = ""
    @State private var discard = false
    @FocusState private var focused: Bool
    private var learner: LearnerStore { appStore.learner }
    init(appStore: AppStore, original: LearnerGoals, proposedGoal: String = "") { self.appStore = appStore; self.original = original; _draft = State(initialValue: original.goals); _newGoal = State(initialValue: proposedGoal) }
    private var dirty: Bool { draft != original.goals || !newGoal.isEmpty }
    private var candidate: String { newGoal.trimmingCharacters(in: .whitespacesAndNewlines) }
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    Text(NativeText.text("goals.heading")).font(.title.bold()).foregroundStyle(Palette.ink).accessibilityAddTraits(.isHeader)
                        .headingFlair(Palette.flairYellow, size: 24).accessibilityIdentifier("page-title-goals")
                    Text(NativeText.text("goals.intro")).foregroundStyle(Palette.secondary)
                    ForEach(Array(draft.enumerated()), id: \.offset) { index, goal in
                        HStack(alignment: .top, spacing: 12) {
                            Text(goal).frame(maxWidth: .infinity, alignment: .leading)
                            Button { draft.remove(at: index) } label: { Image(systemName: "xmark.circle.fill").frame(minWidth: 44, minHeight: 44) }
                                .foregroundStyle(Palette.secondary).accessibilityLabel(NativeText.format("goals.remove", goal)).accessibilityIdentifier("goal-remove-\(index)")
                        }.padding(14).background(Palette.surface, in: RoundedRectangle(cornerRadius: 20))
                    }
                    VStack(alignment: .leading, spacing: 12) {
                        Text(NativeText.text("goals.add")).font(.headline)
                        HStack(alignment: .top, spacing: 10) {
                            TextField(NativeText.text("goals.placeholder"), text: $newGoal, axis: .vertical).lineLimit(1...3).focused($focused).submitLabel(.done).onSubmit { addGoal() }
                                .padding(.vertical, 10).accessibilityIdentifier("goal-input")
                            Button(NativeText.text("goals.addShort")) { addGoal() }
                                .font(.subheadline.weight(.semibold)).padding(.horizontal, 14).frame(minHeight: 44)
                                .foregroundStyle(Palette.selectionInk).background(Palette.selection, in: Capsule())
                                .disabled(!LearnerGoals.acceptsNewGoal(candidate) || draft.count >= 200 || draft.contains(candidate)).accessibilityIdentifier("goal-add")
                                .opacity(!LearnerGoals.acceptsNewGoal(candidate) || draft.count >= 200 || draft.contains(candidate) ? 0.4 : 1)
                        }.padding(12).background(Palette.surface, in: RoundedRectangle(cornerRadius: 18))
                        Text(NativeText.text("goals.limit")).font(.footnote).foregroundStyle(Palette.secondary)
                    }
                    NavigationLink { DataSharingView(consumer: appStore.consumer) } label: { DrawnSettingsRow(title: NativeText.text("goals.sharing"), symbol: .sharing, tint: Palette.tealCard) }.buttonStyle(CredentialPressStyle())
                    Text(NativeText.text("goals.sharingNotice")).font(.footnote).foregroundStyle(Palette.secondary)
                }.padding(20).frame(maxWidth: 620).frame(maxWidth: .infinity).disabled(learner.saving)
            }.background(Palette.paper).foregroundStyle(Palette.ink).scrollDismissesKeyboard(.interactively)
                .safeAreaInset(edge: .bottom) {
                    VStack(alignment: .leading, spacing: 12) {
                        if let error = learner.saveError { Text(error.localizedDescription).font(.footnote).foregroundStyle(Palette.errorInk).accessibilityIdentifier("goals-save-error") }
                        PrimaryButton(title: NativeText.text(learner.saving ? "goals.saving" : learner.saveError == .uncertain ? "goals.checkSave" : "goals.save"), loading: learner.saving, disabled: draft == original.goals || !newGoal.isEmpty, fill: Palette.selection) {
                            focused = false
                            Task { if await learner.saveGoals(draft, revision: original.revision) { dismiss() } }
                        }.accessibilityIdentifier("goals-save")
                    }.padding(20).background(Palette.surface)
                }
                .navigationTitle(NativeText.text("goals.title")).navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button(NativeText.text("common.cancel")) { if dirty { discard = true } else { dismiss() } }.disabled(learner.saving).accessibilityIdentifier("goals-cancel") } }
                .interactiveDismissDisabled(dirty || learner.saving)
                .confirmationDialog(NativeText.text("goals.discardTitle"), isPresented: $discard, titleVisibility: .visible) {
                    Button(NativeText.text("goals.discard"), role: .destructive) { dismiss() }
                    Button(NativeText.text("goals.keepEditing"), role: .cancel) {}
                }
        }
    }
    private func addGoal() {
        guard LearnerGoals.acceptsNewGoal(candidate), draft.count < 200, !draft.contains(candidate) else { return }
        draft.append(candidate); newGoal = ""; focused = false
    }
}

private struct LearnerErrorCard: View {
    let error: LearnerError
    let retry: () -> Void
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(error.localizedDescription).foregroundStyle(Palette.errorInk)
            Button(NativeText.literal("Try Again"), action: retry).font(.headline).frame(minHeight: 44)
        }.padding(18).frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
    }
}
