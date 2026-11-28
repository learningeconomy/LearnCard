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
                VStack(alignment: .leading, spacing: 14) {
                    overview
                    if !review.recipients.isEmpty { ConsentRecipients(recipients: review.recipients, compact: true) }
                    if let reason = review.blockReason {
                        Text(ConsumerAppError(rawValue: reason)?.errorDescription ?? ConsumerAppError.unsupported.errorDescription ?? "")
                            .font(.body).foregroundStyle(Palette.cardInk).padding(20)
                            .background(Palette.pinkCard, in: RoundedRectangle(cornerRadius: 20))
                    } else {
                        permissions
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
                }.padding(20).frame(maxWidth: 620).frame(maxWidth: .infinity)
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
    private var overview: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .center, spacing: 12) {
                ConsumerAppIcon(url: iconURL, title: appTitle, size: 44)
                VStack(alignment: .leading, spacing: 3) {
                    Text(appTitle).font(.headline).foregroundStyle(Palette.ink)
                    if review.title != appTitle {
                        Text(review.title).font(.subheadline).foregroundStyle(Palette.secondary)
                    }
                }.frame(maxWidth: .infinity, alignment: .leading)
                Image(systemName: "lock.shield")
                    .font(.title2.weight(.semibold)).foregroundStyle(Palette.green)
                    .accessibilityHidden(true)
            }
            Text(NativeText.text("consent.choiceTitle")).font(.title2.bold()).foregroundStyle(Palette.ink)
                .headingFlair(Palette.flairTeal).accessibilityAddTraits(.isHeader)
            if let description = review.description {
                Text(description).font(.subheadline).foregroundStyle(Palette.secondary)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Palette.mint, in: RoundedRectangle(cornerRadius: 24))
    }

    @ViewBuilder private var permissions: some View {
        if !review.readCredentials.isEmpty {
            section("consent.read", symbol: "arrow.up.right", tint: Palette.tealCard) {
                Text(NativeText.text("consent.selectedOnly")).font(.caption).foregroundStyle(Palette.secondary)
                    .padding(.bottom, 4)
                ForEach(review.readCredentials) { permission in
                    readGroup(permission)
                }
                if decision.selectedCount > 0 {
                    Text(NativeText.count("consent.count", decision.selectedCount))
                        .font(.caption.weight(.semibold)).foregroundStyle(Palette.green)
                        .accessibilityAddTraits(.updatesFrequently)
                }
            }
        }
        if !review.readPersonal.isEmpty {
            section("consent.personal", symbol: "person.crop.circle", tint: Palette.lilacCard) {
                ForEach(review.readPersonal) { permission in
                    VStack(alignment: .leading, spacing: 8) {
                        HStack { Text(consentLabel(permission.id)); Spacer(); requirement(permission.required) }
                            .font(.subheadline.weight(.medium))
                        TextField(NativeText.text("consent.value"), text: Binding(
                            get: { decision.personalValues[permission.id] ?? "" },
                            set: { decision.personalValues[permission.id] = $0 }
                        ))
                        .textInputAutocapitalization(.never).autocorrectionDisabled().padding(12)
                        .background(Palette.paper, in: RoundedRectangle(cornerRadius: 12))
                        .accessibilityIdentifier("consent-personal-\(permission.id)")
                    }
                }
            }
        }
        if !review.writeCredentials.isEmpty {
            section("consent.write", symbol: "arrow.down.left", tint: Palette.blueCard) {
                ForEach(review.writeCredentials) { permission in
                    permissionToggle(permission, category: credentialCategory(permission),
                                     enabled: membership(permission.id, in: $decision.writeCategories))
                }
            }
        }
        if !review.writePersonal.isEmpty {
            section("consent.writePersonal", symbol: "pencil", tint: Palette.lilacCard) {
                ForEach(review.writePersonal) { permission in
                    permissionToggle(permission, enabled: membership(permission.id, in: $decision.writePersonal))
                }
            }
        }
    }

    private func section<Content: View>(_ key: String, symbol: String, tint: Color,
                                        @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                Image(systemName: symbol).font(.subheadline.weight(.semibold))
                    .foregroundStyle(Palette.cardInk).frame(width: 31, height: 31)
                    .background(tint, in: RoundedRectangle(cornerRadius: 9)).accessibilityHidden(true)
                Text(NativeText.text(key)).font(.headline).accessibilityAddTraits(.isHeader)
            }
            content()
        }
        .foregroundStyle(Palette.ink).padding(14).frame(maxWidth: .infinity, alignment: .leading)
        .background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
    }

    private func readGroup(_ permission: ConsentPermission) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            permissionToggle(permission, category: credentialCategory(permission),
                             enabled: membership(permission.id, in: $decision.readCategories, clearCredentials: true))
            if decision.readCategories.contains(permission.id) {
                if permission.choices.isEmpty {
                    Text(NativeText.text("consent.none")).font(.caption).foregroundStyle(Palette.secondary)
                }
                ForEach(permission.choices) { choice in
                    let selected = decision.selectedCredentials[permission.id, default: []].contains(choice.id)
                    Button { toggleCredential(choice.id, category: permission.id) } label: {
                        HStack(spacing: 10) {
                            Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                                .foregroundStyle(selected ? Palette.green : Palette.secondary)
                                .accessibilityHidden(true)
                            Text(choice.title).font(.subheadline.weight(selected ? .semibold : .regular))
                                .foregroundStyle(Palette.ink)
                        }
                        .padding(.horizontal, 12).padding(.vertical, 5)
                        .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                        .background(selected ? Palette.mint : Palette.surface, in: RoundedRectangle(cornerRadius: 10))
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("consent-choice-\(choice.id)")
                    .accessibilityAddTraits(selected ? .isSelected : [])
                }
            }
        }
        .padding(8).background(Palette.paper, in: RoundedRectangle(cornerRadius: 15))
    }

    private func credentialCategory(_ permission: ConsentPermission) -> CredentialCategory {
        CredentialCategory.resolve(permission.id, fallback: .learning)
    }

    private func requirement(_ required: Bool) -> some View {
        Text(NativeText.text(required ? "common.required" : "common.optional"))
            .font(.caption).foregroundStyle(Palette.secondary)
    }

    private func permissionLabel(_ permission: ConsentPermission, category: CredentialCategory?) -> some View {
        HStack(spacing: 10) {
            if let category {
                Image(category.illustration).resizable().scaledToFit().padding(5)
                    .frame(width: 36, height: 36)
                    .background(Palette.categoryTint(category), in: RoundedRectangle(cornerRadius: 10))
                    .accessibilityHidden(true)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(consentLabel(permission.id)).font(.subheadline.weight(.semibold))
                requirement(permission.required)
            }
        }
    }

    @ViewBuilder private func permissionToggle(_ permission: ConsentPermission, category: CredentialCategory? = nil,
                                              enabled: Binding<Bool>) -> some View {
        if permission.required {
            HStack(spacing: 12) {
                permissionLabel(permission, category: category)
                Spacer(minLength: 0)
                Image(systemName: "checkmark.circle.fill").foregroundStyle(Palette.green)
                    .font(.title3).accessibilityHidden(true)
            }
            .frame(minHeight: 44)
            .accessibilityElement(children: .combine)
            .accessibilityIdentifier("consent-permission-\(permission.id)")
        } else {
            Toggle(isOn: enabled) { permissionLabel(permission, category: category) }
                .frame(minHeight: 44)
                .tint(Palette.brandGreen)
                .accessibilityIdentifier("consent-permission-\(permission.id)")
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
    var compact = false

    var body: some View {
        VStack(alignment: .leading, spacing: compact ? 8 : 14) {
            if !compact { recipientHeading }
            ForEach(recipients) { recipient in
                HStack(spacing: 10) {
                    ConsumerAppIcon(url: recipient.imageURL, title: recipient.name, size: compact ? 32 : 36)
                    VStack(alignment: .leading, spacing: 3) {
                        if compact && recipient.id == recipients.first?.id { recipientHeading }
                        Text(recipient.name).font(.subheadline.weight(compact ? .semibold : .regular))
                            .foregroundStyle(Palette.ink)
                    }
                }
            }
        }
        .padding(compact ? 14 : 20).frame(maxWidth: .infinity, alignment: .leading)
        .background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
    }

    private var recipientHeading: some View {
        Text(NativeText.text("consent.recipients"))
            .font(compact ? .caption.weight(.medium) : .headline)
            .foregroundStyle(compact ? Palette.secondary : Palette.ink)
            .accessibilityAddTraits(.isHeader)
    }
}
