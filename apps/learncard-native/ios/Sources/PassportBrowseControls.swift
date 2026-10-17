import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

enum PassportBrowseSheet: String, Identifiable {
    case date, sort
    var id: String { rawValue }
}

/// Date choices are a draft until Apply; sorting is an immediate single choice.
struct PassportBrowseOptions: View {
    let selection: PassportBrowseSheet
    @Binding var query: CredentialPickerQuery
    @State private var draft: CredentialPickerQuery
    @Environment(\.dismiss) private var dismiss

    init(selection: PassportBrowseSheet, query: Binding<CredentialPickerQuery>) {
        self.selection = selection; _query = query; _draft = State(initialValue: query.wrappedValue)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    PageHeading(title: NativeText.text(selection == .date ? "passport.dateTitle" : "sharePicker.sort"),
                                accent: selection == .date ? Palette.flairBlue : Palette.flairYellow)
                    Text(NativeText.text(selection == .date ? "sharePicker.dateHint" : "passport.sortHint"))
                        .font(.subheadline).foregroundStyle(Palette.secondary)
                    VStack(spacing: 10) {
                        if selection == .date {
                            ForEach(CredentialPickerDate.allCases, id: \.self) { range in
                                option(title: NativeText.text("sharePicker.date.\(range.rawValue)"),
                                       selected: draft.dateRange == range, id: "passport-date-\(range.rawValue)") {
                                    draft.dateRange = range
                                }
                            }
                            if draft.dateRange == .custom {
                                VStack(alignment: .leading, spacing: 20) {
                                    VStack(alignment: .leading, spacing: 8) {
                                        Text(NativeText.text("sharePicker.from")).fontWeight(.medium)
                                        DatePicker(NativeText.text("sharePicker.from"), selection: $draft.from, displayedComponents: .date)
                                            .labelsHidden().accessibilityIdentifier("passport-date-from")
                                            .onChange(of: draft.from) { _, value in if value > draft.through { draft.through = value } }
                                    }
                                    VStack(alignment: .leading, spacing: 8) {
                                        Text(NativeText.text("sharePicker.through")).fontWeight(.medium)
                                        DatePicker(NativeText.text("sharePicker.through"), selection: $draft.through, in: draft.from..., displayedComponents: .date)
                                            .labelsHidden().accessibilityIdentifier("passport-date-through")
                                    }
                                }.datePickerStyle(.compact).font(.subheadline).foregroundStyle(Palette.ink)
                                    .padding(18).background(Palette.surface, in: RoundedRectangle(cornerRadius: 20))
                            }
                        } else {
                            ForEach(CredentialPickerSort.allCases, id: \.self) { order in
                                option(title: NativeText.text("sharePicker.sort.\(order.rawValue)"),
                                       selected: query.sort == order, id: "passport-sort-\(order.rawValue)") {
                                    query.sort = order; dismiss()
                                }
                            }
                        }
                    }
                }.padding(20).frame(maxWidth: 620).frame(maxWidth: .infinity)
            }.background(Palette.paper).navigationBarTitleDisplayMode(.inline)
                .accessibilityIdentifier("passport-\(selection.rawValue)-sheet")
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button(NativeText.text("common.cancel")) { dismiss() }.accessibilityIdentifier("passport-options-cancel")
                    }
                }
                .safeAreaInset(edge: .bottom, spacing: 0) {
                    if selection == .date {
                        PrimaryButton(title: NativeText.text("passport.applyDates"), fill: Palette.selection) {
                            query.dateRange = draft.dateRange; query.from = draft.from; query.through = draft.through; dismiss()
                        }.accessibilityIdentifier("passport-date-apply").padding(20).background(Palette.surface)
                    }
                }
        }
        .environment(\.locale, NativeLanguage.selected.locale)
        .environment(\.layoutDirection, NativeLanguage.selected.isRightToLeft ? .rightToLeft : .leftToRight)
        #if DEBUG
        .modifier(NativeReviewPreferences())
        #endif
        .presentationDetents([.large]).presentationDragIndicator(.visible)
    }

    private func option(title: String, selected: Bool, id: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 14) {
                Text(title).font(.body.weight(.semibold)).frame(maxWidth: .infinity, alignment: .leading)
                    .fixedSize(horizontal: false, vertical: true)
                Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                    .font(.title3).accessibilityHidden(true)
            }.foregroundStyle(Palette.ink).padding(18).frame(minHeight: 64)
                .background(Palette.surface, in: RoundedRectangle(cornerRadius: 20))
                .overlay(RoundedRectangle(cornerRadius: 20).stroke(selected ? Palette.selection : .clear, lineWidth: 2))
                .contentShape(RoundedRectangle(cornerRadius: 20))
        }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier(id)
            .accessibilityAddTraits(selected ? .isSelected : [])
    }
}
