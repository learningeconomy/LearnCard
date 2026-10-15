import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

enum BuilderField: Hashable { case title, summary, criteria, detail(String) }

struct BuilderOptionalDetails: View {
    @Binding var details: CredentialDraftDetails
    let focus: FocusState<BuilderField?>.Binding
    @State private var dateField: BuilderDateField?
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            input("builder.criteriaLink", value: $details.criteriaURL, id: "draft-criteria-url", keyboard: .URL)
            Divider()
            section("builder.activityDetails", image: "CategoryStudies")
            input("builder.fieldOfStudy", value: $details.fieldOfStudy, id: "draft-field-of-study")
            input("builder.role", value: $details.role, id: "draft-role")
            input("builder.term", value: $details.term, id: "draft-term")
            dateRow(.start); dateRow(.end); dateRow(.expiry)
            Divider()
            section("builder.evidence", image: "DrawnCollection")
            Text(NativeText.text("builder.evidenceHint")).font(.footnote).foregroundStyle(Palette.secondary)
            ForEach($details.evidence) { $evidence in
                VStack(alignment: .leading, spacing: 14) {
                    HStack {
                        Text(NativeText.text("builder.supportingLink")).font(.headline)
                        Spacer()
                        Button(role: .destructive) { details.evidence.removeAll { $0.id == evidence.id } } label: {
                            Image(systemName: "trash").frame(width: 44, height: 44)
                        }.accessibilityLabel(NativeText.text("builder.removeEvidence"))
                            .accessibilityIdentifier("draft-evidence-remove-\(evidence.id)")
                    }
                    input("builder.evidenceURL", value: $evidence.url, id: "draft-evidence-url-\(evidence.id)", keyboard: .URL)
                    input("builder.evidenceName", value: $evidence.name, id: "draft-evidence-name-\(evidence.id)")
                    input("builder.evidenceDescription", value: $evidence.summary, id: "draft-evidence-summary-\(evidence.id)", multiline: true)
                }.padding(16).background(Palette.paper, in: RoundedRectangle(cornerRadius: 20))
            }
            if details.evidence.count < 5 {
                Button { details.evidence.append(CredentialDraftEvidence()) } label: {
                    Label(NativeText.text("builder.addEvidence"), systemImage: "plus").font(.subheadline.weight(.semibold))
                        .frame(maxWidth: .infinity, minHeight: 48).background(Palette.blueCard, in: RoundedRectangle(cornerRadius: 16))
                        .foregroundStyle(Palette.cardInk)
                }.buttonStyle(.plain).accessibilityIdentifier("draft-add-evidence")
            }
        }
        .sheet(item: $dateField) { field in
            BuilderDateSheet(field: field, current: date(field)) { value in
                switch field { case .start: details.activityStartDate = value; case .end: details.activityEndDate = value; case .expiry: details.validUntil = value }
            }
        }
    }
    private func section(_ key: String, image: String) -> some View {
        HStack(spacing: 10) {
            Image(image).resizable().scaledToFit().frame(width: 28, height: 28).accessibilityHidden(true)
            Text(NativeText.text(key)).font(.headline).accessibilityAddTraits(.isHeader)
        }
    }
    private func input(_ key: String, value: Binding<String>, id: String, keyboard: UIKeyboardType = .default, multiline: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(NativeText.text(key)).font(.subheadline.weight(.semibold))
            TextField(NativeText.text(key), text: value, axis: multiline ? .vertical : .horizontal)
                .lineLimit(multiline ? 2...4 : 1...1).font(.body).keyboardType(keyboard)
                .textInputAutocapitalization(keyboard == .URL ? .never : .sentences)
                .autocorrectionDisabled(keyboard == .URL).focused(focus, equals: .detail(id))
                .padding(12).background(Palette.paper, in: RoundedRectangle(cornerRadius: 12))
                .accessibilityIdentifier(id)
        }.id(BuilderField.detail(id))
    }
    private func date(_ field: BuilderDateField) -> Date? {
        switch field { case .start: details.activityStartDate; case .end: details.activityEndDate; case .expiry: details.validUntil }
    }
    private func dateRow(_ field: BuilderDateField) -> some View {
        Button { focus.wrappedValue = nil; dateField = field } label: {
            HStack(alignment: .firstTextBaseline) {
                Text(NativeText.text(field.titleKey)).font(.subheadline.weight(.semibold))
                Spacer(minLength: 10)
                Text(date(field).map { $0.formatted(.dateTime.year().month(.abbreviated).day().locale(NativeLanguage.selected.locale)) } ?? NativeText.text("builder.addDate"))
                    .font(.subheadline).multilineTextAlignment(.trailing)
                Image(systemName: "calendar").font(.subheadline)
            }.foregroundStyle(Palette.ink).frame(minHeight: 48).contentShape(Rectangle())
        }.buttonStyle(.plain).accessibilityIdentifier("draft-date-\(field.rawValue)")
    }
}

enum BuilderDateField: String, Identifiable { case start, end, expiry
    var id: String { rawValue }
    var titleKey: String { "builder.date.\(rawValue)" }
}

private struct BuilderDateSheet: View {
    let field: BuilderDateField
    let current: Date?
    let choose: (Date?) -> Void
    @State private var selected: Date
    @Environment(\.dismiss) private var dismiss
    init(field: BuilderDateField, current: Date?, choose: @escaping (Date?) -> Void) {
        self.field = field; self.current = current; self.choose = choose; _selected = State(initialValue: current ?? .now)
    }
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        BuilderHeading(title: NativeText.text(field.titleKey), detail: NativeText.text(field == .expiry ? "builder.expiryHint" : "builder.activityDateHint"), illustration: "BuilderYellowRays")
                        DatePicker(NativeText.text(field.titleKey), selection: $selected, displayedComponents: .date)
                            .datePickerStyle(.graphical).tint(Palette.ink).accessibilityIdentifier("builder-calendar")
                        if current != nil {
                            Button(NativeText.text("builder.removeDate"), role: .destructive) { choose(nil); dismiss() }
                                .frame(minHeight: 44).accessibilityIdentifier("builder-date-remove")
                        }
                    }.padding(20)
                }
                PrimaryButton(title: NativeText.text("builder.useDate"), fill: Palette.selection) {
                    choose(CredentialDraftDetails.dateOnly(selected, expires: field == .expiry)); dismiss()
                }.padding(20).accessibilityIdentifier("builder-date-confirm")
            }.background(Palette.paper).foregroundStyle(Palette.ink)
                .navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button(NativeText.literal("Cancel")) { dismiss() }.accessibilityIdentifier("builder-date-cancel") } }
        }
        .environment(\.locale, NativeLanguage.selected.locale)
        .environment(\.layoutDirection, NativeLanguage.selected.isRightToLeft ? .rightToLeft : .leftToRight)
        #if DEBUG
        .modifier(NativeReviewPreferences())
        #endif
        .presentationDetents([.fraction(0.78), .large]).presentationDragIndicator(.visible)
    }
}

struct BuilderDetailsReview: View {
    let details: CredentialDraftDetails
    var body: some View {
        if !details.isEmpty {
            VStack(alignment: .leading, spacing: 16) {
                Text(NativeText.text("builder.extraDetails")).font(.title3.bold()).accessibilityAddTraits(.isHeader)
                row("builder.criteriaLink", value: details.criteriaURL)
                row("builder.fieldOfStudy", value: details.fieldOfStudy)
                row("builder.role", value: details.role)
                row("builder.term", value: details.term)
                date("builder.date.start", value: details.activityStartDate)
                date("builder.date.end", value: details.activityEndDate)
                date("builder.date.expiry", value: details.validUntil)
                ForEach(details.evidence.filter { !$0.isEmpty }) { evidence in
                    VStack(alignment: .leading, spacing: 6) {
                        Text(evidence.name.isEmpty ? NativeText.text("builder.supportingLink") : evidence.name).font(.headline)
                        Text(evidence.url).font(.footnote).foregroundStyle(Palette.secondary)
                        if !evidence.summary.isEmpty { Text(evidence.summary).font(.subheadline) }
                    }.textSelection(.enabled)
                }
            }.padding(20).frame(maxWidth: .infinity, alignment: .leading)
                .background(Palette.surface, in: RoundedRectangle(cornerRadius: 24)).accessibilityIdentifier("draft-optional-review")
        }
    }
    @ViewBuilder private func row(_ key: String, value: String) -> some View {
        if !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            VStack(alignment: .leading, spacing: 4) {
                Text(NativeText.text(key)).font(.subheadline.weight(.semibold))
                Text(value).font(.body).foregroundStyle(Palette.secondary).textSelection(.enabled)
            }
        }
    }
    @ViewBuilder private func date(_ key: String, value: Date?) -> some View {
        if let value { row(key, value: value.formatted(.dateTime.year().month(.wide).day().locale(NativeLanguage.selected.locale))) }
    }
}
