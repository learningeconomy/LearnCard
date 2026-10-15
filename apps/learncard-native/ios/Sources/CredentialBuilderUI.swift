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
        }.padding(14).frame(minWidth: 154, maxWidth: .infinity, minHeight: 80)
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

/// Custom list sheet, deliberately avoiding confirmationDialog/menu adaptation on iOS 26.
struct BuilderSelectionSheet: View {
    enum Selection { case format, category }
    let selection: Selection
    @Binding var format: String
    @Binding var category: CredentialKind
    @Environment(\.dismiss) private var dismiss
    private var isFormat: Bool { selection == .format }
    private var values: [String] { isFormat ? ["Badge", "Certificate", "Course", "Competency", "Membership", "License", "MicroCredential"] : CredentialKind.allCases.map(\.rawValue) }
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    BuilderHeading(title: NativeText.text(isFormat ? "builder.chooseFormat" : "builder.chooseCategory"), detail: NativeText.text(isFormat ? "builder.formatHint" : "builder.categoryHint"), illustration: "BuilderYellowRays")
                    VStack(spacing: 10) {
                        ForEach(values, id: \.self) { value in
                            let selected = isFormat ? value == format : value == category.rawValue
                            Button {
                                if isFormat { format = value }
                                else if let kind = CredentialKind(rawValue: value) { category = kind }
                                dismiss()
                            } label: {
                                HStack(spacing: 14) {
                                    Image(image(value)).resizable().scaledToFit().padding(8).frame(width: 50, height: 50)
                                        .background(tint(value), in: RoundedRectangle(cornerRadius: 14)).accessibilityHidden(true)
                                    VStack(alignment: .leading, spacing: 5) {
                                        Text(isFormat ? NativeText.text("builder.format.\(value)") : NativeText.literal(value)).font(.headline)
                                        Text(NativeText.text("builder.option.\(value)")).font(.subheadline).foregroundStyle(Palette.secondary)
                                    }.frame(maxWidth: .infinity, alignment: .leading)
                                    Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                                        .font(.title3).foregroundStyle(Palette.ink).accessibilityHidden(true)
                                }.padding(14).foregroundStyle(Palette.ink)
                                    .background(Palette.surface, in: RoundedRectangle(cornerRadius: 20))
                                    .overlay(RoundedRectangle(cornerRadius: 20).stroke(selected ? Palette.ink : .clear, lineWidth: 2))
                            }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("builder-option-\(value)")
                                .accessibilityAddTraits(selected ? .isSelected : [])
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
    private func image(_ value: String) -> String {
        switch value {
        case "Badge", "MicroCredential": "CategoryBadge"
        case "Certificate", "License": "CategoryQualification"
        case "Course", "Learning": "CategoryStudies"
        case "Competency": "CategorySkill"
        case "Membership", "Memberships": "CategoryID"
        default: "CategoryAchievement"
        }
    }
    private func tint(_ value: String) -> Color {
        switch value {
        case "Course", "Learning": Palette.studiesCard
        case "Competency": Palette.lilacCard
        case "Certificate", "License": Palette.qualificationCard
        case "Achievements": Palette.pinkCard
        default: Palette.blueCard
        }
    }
}
