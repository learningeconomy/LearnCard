import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

/// Compact dots-and-line progress from the reference, with one full spoken step label.
struct BuilderSteps: View {
    let step: Int
    @Environment(\.dynamicTypeSize) private var textSize
    private let keys = ["builder.design", "builder.recipient", "builder.review"]
    private let colors = [Palette.pinkCard, Palette.cyanCard, Palette.portfolioCard]
    var body: some View {
        VStack(spacing: 8) {
            HStack(alignment: .top, spacing: 0) {
                ForEach(keys.indices, id: \.self) { index in
                    VStack(spacing: 8) {
                        Group {
                            if index < step { Image(systemName: "checkmark") }
                            else { Text((index + 1).formatted(.number.locale(NativeLanguage.selected.locale))) }
                        }.font(.caption.bold()).frame(width: 30, height: 30)
                            .foregroundStyle(index <= step ? Palette.cardInk : Palette.secondary)
                            .background(index <= step ? colors[index] : Palette.surface, in: Circle())
                        if !textSize.isAccessibilitySize {
                            Text(NativeText.text(keys[index])).font(.caption.weight(index == step ? .bold : .medium))
                        }
                    }.frame(maxWidth: .infinity)
                }
            }.background {
                GeometryReader { geometry in
                    Rectangle().fill(Palette.line).frame(width: geometry.size.width * 2 / 3, height: 1.5)
                        .position(x: geometry.size.width / 2, y: 15)
                }
            }
            if textSize.isAccessibilitySize { Text(NativeText.text(keys[step])).font(.headline) }
        }.foregroundStyle(Palette.secondary).accessibilityElement(children: .ignore)
            .accessibilityLabel(NativeText.format("builder.step", String(step + 1), "3", NativeText.text(keys[step])))
            .accessibilityIdentifier("create-step")
    }
}

struct BuilderHeading: View {
    let title: String
    let detail: String
    var illustration = "BuilderPinkRays"
    @Environment(\.dynamicTypeSize) private var textSize
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .center, spacing: 6) {
                Text(title).font(.largeTitle.bold()).tracking(-0.8).accessibilityAddTraits(.isHeader)
                    .frame(maxWidth: .infinity, alignment: .leading)
                if !textSize.isAccessibilitySize {
                    Image(illustration).resizable().scaledToFit()
                        .frame(width: illustration == "BuilderPlane" ? 86 : 30, height: illustration == "BuilderPlane" ? 66 : 40)
                        .accessibilityHidden(true).allowsHitTesting(false)
                }
            }
            Text(detail).font(.subheadline).foregroundStyle(Palette.secondary)
        }.frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct BuilderSelector: View {
    let label: String
    let value: String
    let symbol: String
    let tint: Color
    var detail: String? = nil
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Image(symbol).resizable().scaledToFit().frame(width: 26, height: 26).accessibilityHidden(true)
                Text(label).font(.caption)
                Spacer(minLength: 0)
                Image(systemName: "chevron.forward").font(.caption.weight(.semibold)).accessibilityHidden(true)
            }
            Text(value).font(.subheadline.weight(.semibold))
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
            if let detail { Text(detail).font(.caption).fixedSize(horizontal: false, vertical: true) }
        }.padding(14).frame(minWidth: 154, maxWidth: .infinity, minHeight: 112)
            .foregroundStyle(Palette.cardInk).background(tint, in: RoundedRectangle(cornerRadius: 18))
            .accessibilityElement(children: .combine)
    }
}

struct BuilderRecipientChoice: View {
    let title: String
    let detail: String
    let image: String
    let tint: Color
    let selected: Bool
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            VStack(spacing: 12) {
                Image(image).resizable().scaledToFit().frame(width: 86, height: 80).accessibilityHidden(true)
                Text(title).font(.headline)
                Text(detail).font(.subheadline).multilineTextAlignment(.center)
            }.foregroundStyle(Palette.cardInk).padding(16).padding(.top, 10)
                .frame(minWidth: 154, maxWidth: .infinity, minHeight: 220)
                .background(tint, in: RoundedRectangle(cornerRadius: 24))
                .overlay(RoundedRectangle(cornerRadius: 24).stroke(selected ? Palette.ink : .clear, lineWidth: 2))
                .overlay(alignment: .topTrailing) {
                    Image(systemName: selected ? "checkmark.circle.fill" : "circle").font(.body.weight(.semibold))
                        .foregroundStyle(Palette.cardInk).padding(12).accessibilityHidden(true)
                }
        }.buttonStyle(CredentialPressStyle()).accessibilityAddTraits(selected ? .isSelected : [])
    }
}

extension CreationCategory {
    var localizedName: String { NativeText.text("credentialCategory.\(displayCategory.rawValue)") }
}
func authoringTypeName(_ value: String) -> String { NativeText.text("builder.type.\(value)") }
func authoringFormatName(_ value: CredentialDisplayFormat) -> String { NativeText.text("builder.display.\(value.rawValue)") }

/// Category and achievement type are chosen together, independently of visual format.
struct BuilderSelectionSheet: View {
    enum Selection { case format, category }
    let selection: Selection
    @Binding var format: CredentialDisplayFormat
    @Binding var category: CreationCategory
    @Binding var achievementType: String
    @Environment(\.dismiss) private var dismiss
    private var isFormat: Bool { selection == .format }
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    BuilderHeading(title: NativeText.text(isFormat ? "builder.chooseFormat" : "builder.chooseCategory"), detail: NativeText.text(isFormat ? category == .id ? "builder.idFormatHint" : "builder.formatHint" : "builder.categoryHint"), illustration: "BuilderYellowRays")
                    LazyVStack(spacing: 10) {
                        if isFormat {
                            ForEach(category.formats, id: \.self) { value in
                                Button { format = value; dismiss() } label: {
                                    BuilderOptionRow(title: authoringFormatName(value), detail: NativeText.text("builder.displayHint.\(value.rawValue)"), image: formatImage(value), tint: formatTint(value), selected: value == format)
                                }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("builder-format-\(value.rawValue)")
                                    .accessibilityAddTraits(value == format ? .isSelected : [])
                            }
                        } else {
                            ForEach(CreationCategory.ordered, id: \.self) { value in
                                NavigationLink {
                                    BuilderTypeList(category: value, selected: value == category ? achievementType : "", cancel: { dismiss() }) { type in
                                        category = value; achievementType = type; dismiss()
                                    }
                                } label: {
                                    BuilderOptionRow(title: value.localizedName, detail: NativeText.text("builder.categoryHint.\(value.displayCategory.rawValue)"), image: value.displayCategory.illustration, tint: Palette.categoryTint(value.displayCategory), selected: value == category, forward: true)
                                }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("builder-category-\(value.displayCategory.rawValue)")
                                    .accessibilityAddTraits(value == category ? .isSelected : [])
                            }
                        }
                    }
                }.padding(20).frame(maxWidth: 620).frame(maxWidth: .infinity)
            }.background(Palette.paper).navigationBarTitleDisplayMode(.inline)
                .accessibilityIdentifier(isFormat ? "builder-format-sheet" : "builder-category-sheet")
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button(NativeText.literal("Cancel")) { dismiss() }.accessibilityIdentifier("builder-selector-cancel") } }
        }
        .environment(\.locale, NativeLanguage.selected.locale)
        .environment(\.layoutDirection, NativeLanguage.selected.isRightToLeft ? .rightToLeft : .leftToRight)
        #if DEBUG
        .modifier(NativeReviewPreferences())
        #endif
        .presentationDetents([.fraction(0.78), .large]).presentationDragIndicator(.visible)
    }
    private func formatImage(_ value: CredentialDisplayFormat) -> String {
        switch value { case .badge: "CategoryBadge"; case .award: "CategoryAchievement"; case .certificate: "CategoryQualification"; case .media: "CategoryPortfolio"; case .id: "CategoryID"; case .course: "CategoryStudies" }
    }
    private func formatTint(_ value: CredentialDisplayFormat) -> Color {
        switch value { case .award: Palette.pinkCard; case .certificate: Palette.qualificationCard; case .media: Palette.portfolioCard; case .course: Palette.studiesCard; default: Palette.blueCard }
    }
}

private struct BuilderOptionRow: View {
    let title: String
    let detail: String?
    let image: String
    let tint: Color
    let selected: Bool
    var forward = false
    var body: some View {
        HStack(spacing: 14) {
            Image(image).resizable().scaledToFit().padding(8).frame(width: 50, height: 50)
                .background(tint, in: RoundedRectangle(cornerRadius: 14)).accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 5) {
                Text(title).font(.headline)
                if let detail { Text(detail).font(.subheadline).foregroundStyle(Palette.secondary) }
            }.frame(maxWidth: .infinity, alignment: .leading)
            Image(systemName: selected ? "checkmark.circle.fill" : forward ? "chevron.forward" : "circle")
                .font(.title3).foregroundStyle(Palette.ink).accessibilityHidden(true)
        }.padding(14).foregroundStyle(Palette.ink).frame(minHeight: 64)
            .background(Palette.surface, in: RoundedRectangle(cornerRadius: 20))
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(selected ? Palette.ink : .clear, lineWidth: 2))
    }
}

private struct BuilderTypeList: View {
    let category: CreationCategory
    let selected: String
    let cancel: () -> Void
    let choose: (String) -> Void
    @State private var search = ""
    private var options: [CredentialTypeOption] {
        let query = search.trimmingCharacters(in: .whitespacesAndNewlines)
        return category.types.filter { query.isEmpty || authoringTypeName($0.type).localizedStandardContains(query) || $0.title.localizedStandardContains(query) }.sorted { authoringTypeName($0.type).localizedStandardCompare(authoringTypeName($1.type)) == .orderedAscending }
    }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                BuilderHeading(title: NativeText.text("builder.chooseType"), detail: NativeText.format("builder.typeHint", category.localizedName), illustration: "BuilderYellowRays")
                HStack(spacing: 10) {
                    Image(systemName: "magnifyingglass").accessibilityHidden(true)
                    TextField(NativeText.text("builder.findType"), text: $search).autocorrectionDisabled().submitLabel(.search).accessibilityIdentifier("builder-type-search")
                    if !search.isEmpty { Button { search = "" } label: { Image(systemName: "xmark.circle.fill") }.accessibilityLabel(NativeText.text("builder.clearTypeSearch")).accessibilityIdentifier("builder-type-clear") }
                }.font(.body).foregroundStyle(Palette.ink).padding(16).background(Palette.surface, in: RoundedRectangle(cornerRadius: 18))
                if options.isEmpty { Text(NativeText.text("builder.noTypes")).font(.body).foregroundStyle(Palette.secondary) }
                LazyVStack(spacing: 10) {
                    ForEach(options) { option in
                        Button { choose(option.type) } label: {
                            BuilderOptionRow(title: authoringTypeName(option.type), detail: nil, image: category.displayCategory.illustration, tint: Palette.categoryTint(category.displayCategory), selected: option.type == selected)
                        }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("builder-type-\(option.type)")
                            .accessibilityAddTraits(option.type == selected ? .isSelected : [])
                    }
                }
            }.padding(20).frame(maxWidth: 620).frame(maxWidth: .infinity)
        }.background(Palette.paper).navigationBarTitleDisplayMode(.inline).scrollDismissesKeyboard(.interactively).accessibilityIdentifier("builder-type-sheet")
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button(NativeText.literal("Cancel"), action: cancel).accessibilityIdentifier("builder-selector-cancel") } }
    }
}
