import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

struct NativeConsentView: View {
    @Environment(\.locale) private var nativeLocale
    let appTitle: String
    let iconURL: URL?
    @State private var review: ConsumerConsentReview
    let consumer: ConsumerAppsStore
    var addApp = false
    let completed: () -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var decision: ConsumerConsentDecision
    @State private var refreshing = false
    init(appTitle: String, iconURL: URL?, review: ConsumerConsentReview, consumer: ConsumerAppsStore, addApp: Bool = false, completed: @escaping () -> Void) {
        self.appTitle = appTitle; self.iconURL = iconURL; self.consumer = consumer; self.addApp = addApp; self.completed = completed
        _review = State(initialValue: review)
        _decision = State(initialValue: ConsumerConsentDecision(review: review))
    }
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    HStack(spacing: 16) {
                        ConsumerAppIcon(url: iconURL, title: appTitle, size: 60)
                        VStack(alignment: .leading, spacing: 5) {
                            Text(appTitle).font(.title2.bold()).foregroundStyle(Palette.ink)
                            Text(review.title).font(.subheadline).foregroundStyle(Palette.secondary)
                        }
                    }
                    if let description = review.description { Text(description).font(.body).foregroundStyle(Palette.secondary) }
                    ConsentRecipients(recipients: review.recipients)
                    if let reason = review.blockReason {
                        Text(ConsumerAppError(rawValue: reason)?.errorDescription ?? ConsumerAppError.unsupported.errorDescription ?? "")
                            .font(.body).foregroundStyle(Palette.ink).padding(20).background(Palette.pinkCard, in: RoundedRectangle(cornerRadius: 20))
                    } else {
                        if !review.readCredentials.isEmpty {
                            section("consent.read") {
                                Text(NativeText.text("consent.selectedOnly")).font(.caption).foregroundStyle(Palette.secondary)
                                ForEach(review.readCredentials) { permission in
                                    VStack(alignment: .leading, spacing: 12) {
                                        permissionToggle(permission, enabled: membership(permission.id, in: $decision.readCategories, clearCredentials: true))
                                        if decision.readCategories.contains(permission.id) {
                                            if permission.choices.isEmpty { Text(NativeText.text("consent.none")).font(.caption).foregroundStyle(Palette.secondary) }
                                            ForEach(permission.choices) { choice in
                                                Button { toggleCredential(choice.id, category: permission.id) } label: {
                                                    HStack(spacing: 12) {
                                                        Image(systemName: decision.selectedCredentials[permission.id, default: []].contains(choice.id) ? "checkmark.circle.fill" : "circle")
                                                            .foregroundStyle(Palette.selection)
                                                        Text(choice.title).font(.subheadline).foregroundStyle(Palette.ink)
                                                        Spacer(minLength: 0)
                                                    }.padding(.vertical, 8).contentShape(Rectangle())
                                                }.buttonStyle(.plain).accessibilityIdentifier("consent-choice-\(choice.id)")
                                                    .accessibilityAddTraits(decision.selectedCredentials[permission.id, default: []].contains(choice.id) ? .isSelected : [])
                                            }
                                        }
                                    }
                                    Divider()
                                }
                                Text(NativeText.count("consent.count", decision.selectedCount)).font(.caption.weight(.medium)).foregroundStyle(Palette.selection)
                            }
                        }
                        if !review.readPersonal.isEmpty {
                            section("consent.personal") {
                                ForEach(review.readPersonal) { permission in
                                    VStack(alignment: .leading, spacing: 8) {
                                        HStack { Text(consentLabel(permission.id)); Spacer(); requirement(permission.required) }.font(.subheadline)
                                        TextField(NativeText.text("consent.value"), text: Binding(get: { decision.personalValues[permission.id] ?? "" }, set: { decision.personalValues[permission.id] = $0 }))
                                            .textInputAutocapitalization(.never).autocorrectionDisabled().padding(12)
                                            .background(Palette.paper, in: RoundedRectangle(cornerRadius: 12))
                                            .accessibilityIdentifier("consent-personal-\(permission.id)")
                                    }
                                }
                            }
                        }
                        if !review.writeCredentials.isEmpty {
                            section("consent.write") { ForEach(review.writeCredentials) { permission in permissionToggle(permission, enabled: membership(permission.id, in: $decision.writeCategories)) } }
                        }
                        if !review.writePersonal.isEmpty {
                            section("consent.writePersonal") { ForEach(review.writePersonal) { permission in permissionToggle(permission, enabled: membership(permission.id, in: $decision.writePersonal)) } }
                        }
                        if review.allowsAnonymous { Toggle(NativeText.text("consent.anonymous"), isOn: $decision.anonymize).tint(Palette.selection).padding(20).background(Palette.surface, in: RoundedRectangle(cornerRadius: 20)) }
                    }
                    if let error = consumer.error { ConsumerErrorCard(error: error) {
                        if error == .changed {
                            Task {
                                refreshing = true; defer { refreshing = false }
                                do {
                                    guard let fresh = try await consumer.review(id: review.listingID) else { throw ConsumerAppError.changed }
                                    review = fresh; decision = ConsumerConsentDecision(review: fresh); consumer.error = nil
                                } catch { consumer.fail(error) }
                            }
                        } else { consumer.error = nil }
                    } }
                }.padding(20)
            }.background(Palette.paper)
                .safeAreaInset(edge: .bottom) {
                    ConsumerActionButton(title: NativeText.text(addApp ? "consent.agreeAdd" : "consent.agree"), busy: consumer.actionBusy || refreshing, disabled: !decision.satisfies(review)) {
                        Task { if await consumer.agree(decision, addApp: addApp) { completed(); dismiss() } }
                    }.accessibilityIdentifier("consent-agree").padding(20).background(Palette.surface)
                }
                .navigationTitle(NativeText.text("consent.title")).navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button(NativeText.text("common.cancel")) { dismiss() } } }
        }.presentationDetents([.large]).presentationDragIndicator(.visible).presentationBackground(Palette.paper)
    }
    private func section<Content: View>(_ key: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 16) { Text(NativeText.text(key)).font(.headline); content() }
            .foregroundStyle(Palette.ink).padding(20).frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
    }
    private func requirement(_ required: Bool) -> some View { Text(NativeText.text(required ? "common.required" : "common.optional")).font(.caption).foregroundStyle(Palette.secondary) }
    private func permissionToggle(_ permission: ConsentPermission, enabled: Binding<Bool>) -> some View {
        Toggle(isOn: enabled) {
            VStack(alignment: .leading, spacing: 4) { Text(consentLabel(permission.id)).font(.subheadline.weight(.medium)); requirement(permission.required) }
        }.tint(Palette.selection).disabled(permission.required).accessibilityIdentifier("consent-permission-\(permission.id)")
    }
    private func membership(_ id: String, in items: Binding<[String]>, clearCredentials: Bool = false) -> Binding<Bool> {
        Binding(get: { items.wrappedValue.contains(id) }, set: { enabled in
            items.wrappedValue.removeAll { $0 == id }
            if enabled { items.wrappedValue.append(id) }
            else if clearCredentials { decision.selectedCredentials[id] = nil }
        })
    }
    private func toggleCredential(_ id: String, category: String) {
        var selected = decision.selectedCredentials[category] ?? []
        if selected.contains(id) { selected.removeAll { $0 == id } } else { selected.append(id) }
        decision.selectedCredentials[category] = selected
    }
}

func consentLabel(_ key: String) -> String { NativeText.literal(key) }

struct ConsentRecipients: View {
    @Environment(\.locale) private var nativeLocale
    let recipients: [ConsentAudienceMember]
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(NativeText.text("consent.recipients")).font(.headline).foregroundStyle(Palette.ink)
            ForEach(recipients) { recipient in
                HStack(spacing: 12) {
                    ConsumerAppIcon(url: recipient.imageURL, title: recipient.name, size: 36)
                    Text(recipient.name).font(.subheadline).foregroundStyle(Palette.ink)
                }
            }
        }.padding(20).frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
    }
}
