import SwiftUI
import LearnCardNativeSDK

struct SignupCountrySheet: View {
    @Binding var value: String
    let countries: [String: String]
    @Environment(\.dismiss) private var dismiss
    @Environment(\.locale) private var locale
    @State private var search = ""
    private var rows: [String] {
        countries.keys.filter { code in
            search.isEmpty || code.localizedCaseInsensitiveContains(search) || (countries[code] ?? "").localizedCaseInsensitiveContains(search) || (locale.localizedString(forRegionCode: code) ?? "").localizedCaseInsensitiveContains(search)
        }.sorted { (locale.localizedString(forRegionCode: $0) ?? $0).localizedStandardCompare(locale.localizedString(forRegionCode: $1) ?? $1) == .orderedAscending }
    }
    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(spacing: 10) {
                    ForEach(rows, id: \.self) { code in
                        Button { value = code; dismiss() } label: {
                            HStack(spacing: 14) {
                                Text(locale.localizedString(forRegionCode: code) ?? countries[code] ?? code).font(.body.weight(.medium)).frame(maxWidth: .infinity, alignment: .leading)
                                if value == code { Image(systemName: "checkmark.circle.fill").accessibilityHidden(true) }
                            }.foregroundStyle(Palette.ink).padding(18).frame(minHeight: 52).background(Palette.surface, in: RoundedRectangle(cornerRadius: 18))
                        }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("signup-country-\(code)").accessibilityAddTraits(value == code ? .isSelected : [])
                    }
                    if rows.isEmpty { Text(NativeText.text("signup.country.empty")).font(.body).padding(24) }
                }.padding(20)
            }.background(Palette.paper).searchable(text: $search, prompt: NativeText.text("signup.country.search"))
                .navigationTitle(NativeText.text("signup.country.choose")).navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button(NativeText.literal("Cancel")) { dismiss() } } }
        }.modifier(SignupSheetPreferences()).presentationDetents([.large]).presentationDragIndicator(.visible).presentationBackground(Palette.paper)
    }
}
struct SignupBirthDateSheet: View {
    @Environment(\.dynamicTypeSize) private var textSize
    @Binding var value: String
    @Environment(\.dismiss) private var dismiss
    @State private var date = Calendar(identifier: .gregorian).date(from: DateComponents(year: 2000, month: 1, day: 1))!
    var body: some View {
        NavigationStack {
            ScrollView { VStack(alignment: .leading, spacing: 24) {
                Text(NativeText.text("signup.birthDate.detail")).font(.body).foregroundStyle(Palette.secondary)
                DatePicker(NativeText.text("signup.birthDate"), selection: $date,
                           in: Calendar(identifier: .gregorian).date(from: DateComponents(year: 1900, month: 1, day: 1))!...Date(), displayedComponents: .date)
                    .datePickerStyle(.wheel).labelsHidden().frame(maxWidth: .infinity).environment(\.calendar, Calendar(identifier: .gregorian)).accessibilityIdentifier("signup-birth-picker")
                PrimaryButton(title: NativeText.literal("Done"), fill: Palette.selection) { value = SignupPolicy.civilDate(date); dismiss() }.accessibilityIdentifier("signup-birth-done")
            }.padding(20).frame(maxWidth: .infinity, alignment: .top) }.background(Palette.paper)
                .navigationTitle(NativeText.text("signup.birthDate")).navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button(NativeText.literal("Cancel")) { dismiss() } } }
        }.onAppear {
            let parts = value.split(separator: "-").compactMap { Int($0) }
            if parts.count == 3, let saved = Calendar(identifier: .gregorian).date(from: DateComponents(year: parts[0], month: parts[1], day: parts[2])) { date = saved }
        }.modifier(SignupSheetPreferences()).presentationDetents(textSize.isAccessibilitySize ? [.large] : [.height(460), .large]).presentationDragIndicator(.visible).presentationBackground(Palette.paper)
    }
}
private struct SignupSheetPreferences: ViewModifier {
    func body(content: Content) -> some View {
        content.environment(\.locale, NativeLanguage.selected.locale).environment(\.layoutDirection, NativeLanguage.selected.isRightToLeft ? .rightToLeft : .leftToRight)
        #if DEBUG
            .modifier(NativeReviewPreferences())
        #endif
    }
}
