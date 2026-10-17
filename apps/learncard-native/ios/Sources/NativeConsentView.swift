import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

struct NativeConsentView: View {
    @Environment(\.locale) private var nativeLocale
    @Environment(\.dynamicTypeSize) private var textSize
    let appTitle: String
    let iconURL: URL?
    @State private var review: ConsumerConsentReview
    let consumer: ConsumerAppsStore
    var addApp = false
    let completed: () -> Void
    let activityChanged: (Bool) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var decision: ConsumerConsentDecision
    @State private var refreshing = false
    init(appTitle: String, iconURL: URL?, review: ConsumerConsentReview, consumer: ConsumerAppsStore, addApp: Bool = false, activityChanged: @escaping (Bool) -> Void = { _ in }, completed: @escaping () -> Void) {
        self.appTitle = appTitle; self.iconURL = iconURL; self.consumer = consumer; self.addApp = addApp; self.activityChanged = activityChanged; self.completed = completed
        _review = State(initialValue: review)
        _decision = State(initialValue: ConsumerConsentDecision(review: review))
    }
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    HStack(alignment: .top, spacing: 16) {
                        ConsumerAppIcon(url: iconURL, title: appTitle, size: textSize.isAccessibilitySize ? 48 : 60)
                        VStack(alignment: .leading, spacing: 5) {
                            Text(appTitle).font(.title2.bold()).foregroundStyle(Palette.ink)
                            if review.title != appTitle { Text(review.title).font(.subheadline).foregroundStyle(Palette.secondary) }
                        }
                    }
                    Text(NativeText.text("consent.choiceTitle")).font(.title2.bold()).foregroundStyle(Palette.ink)
                        .headingFlair(Palette.flairTeal).accessibilityAddTraits(.isHeader)
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
                                                    }.padding(.vertical, 8).frame(minHeight: 44).contentShape(Rectangle())
                                                }.buttonStyle(.plain).accessibilityIdentifier("consent-choice-\(choice.id)")
                                                    .accessibilityAddTraits(decision.selectedCredentials[permission.id, default: []].contains(choice.id) ? .isSelected : [])
                                            }
                                        } else {
                                            Text(NativeText.text("consent.notSelected")).font(.caption).foregroundStyle(Palette.secondary)
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
                        Task {
                            activityChanged(true)
                            let success = await consumer.agree(decision, addApp: addApp)
                            activityChanged(false)
                            if success { completed(); dismiss() }
                        }
                    }.accessibilityIdentifier("consent-agree").padding(20).background(Palette.surface)
                }
                .navigationTitle(NativeText.text("consent.title")).navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button(NativeText.text("common.cancel")) { dismiss() } } }
        }.presentationDetents([.large]).presentationDragIndicator(.visible).presentationBackground(Palette.paper)
        #if DEBUG
        .modifier(NativeReviewPreferences())
        #endif
    }
    private func section<Content: View>(_ key: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(NativeText.text(key)).font(.title3.bold()).accessibilityAddTraits(.isHeader)
            content()
        }
            .foregroundStyle(Palette.ink).padding(20).frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
    }
    private func requirement(_ required: Bool) -> some View { Text(NativeText.text(required ? "common.required" : "common.optional")).font(.caption).foregroundStyle(Palette.secondary) }
    @ViewBuilder private func permissionToggle(_ permission: ConsentPermission, enabled: Binding<Bool>) -> some View {
        if permission.required {
            HStack(alignment: .top, spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(consentLabel(permission.id)).font(.body.weight(.semibold))
                    requirement(true)
                }.frame(maxWidth: .infinity, alignment: .leading)
                Image(systemName: "checkmark.circle.fill").foregroundStyle(Palette.selection)
                    .font(.title3).accessibilityHidden(true)
            }.padding(.vertical, 6).accessibilityElement(children: .combine)
                .accessibilityIdentifier("consent-permission-\(permission.id)")
        } else {
            Toggle(isOn: enabled) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(consentLabel(permission.id)).font(.body.weight(.semibold)); requirement(false)
                }
            }.tint(Palette.selection).accessibilityIdentifier("consent-permission-\(permission.id)")
        }
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
