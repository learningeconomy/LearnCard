import SwiftUI
import LearnCardNativeSDK

struct BuilderSteps: View {
    let step: Int
    @Environment(\.dynamicTypeSize) private var textSize
    private let keys = ["builder.design", "builder.recipient", "builder.review"]
    private let colors = [Palette.pinkCard, Palette.cyanCard, Palette.portfolioCard]
    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            ForEach(keys.indices, id: \.self) { index in
                HStack(spacing: 6) {
                    Group {
                        if index < step { Image(systemName: "checkmark") }
                        else { Text((index + 1).formatted(.number.locale(NativeLanguage.selected.locale))) }
                    }
                        .font(.caption.bold()).frame(width: 26, height: 26)
                        .foregroundStyle(index == step ? Palette.cardInk : Palette.secondary)
                        .background(index == step ? colors[index] : Palette.surface, in: Circle())
                    if !textSize.isAccessibilitySize || step == index {
                        Text(NativeText.text(keys[index])).font(.caption.weight(index == step ? .bold : .medium))
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }.frame(maxWidth: .infinity, alignment: .leading)
            }
        }.foregroundStyle(Palette.secondary).padding(.bottom, 4)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(NativeText.format("builder.step", String(step + 1), "3", NativeText.text(keys[step])))
            .accessibilityIdentifier("create-step")
    }
}

struct BuilderHeading: View {
    let title: String
    let detail: String
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.largeTitle.bold()).tracking(-0.8).accessibilityAddTraits(.isHeader)
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
        HStack(spacing: 12) {
            Image(symbol).resizable().scaledToFit().frame(width: 30, height: 30).accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 4) {
                Text(label).font(.caption)
                Text(value).font(.subheadline.weight(.semibold))
            }.fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
            Image(systemName: "chevron.down").font(.caption.weight(.semibold)).accessibilityHidden(true)
        }.padding(16).frame(minWidth: 160, maxWidth: .infinity, minHeight: 80)
            .foregroundStyle(Palette.cardInk).background(tint, in: RoundedRectangle(cornerRadius: 20))
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
            HStack(spacing: 14) {
                Image(image).resizable().scaledToFit().padding(6).frame(width: 64, height: 64)
                    .background(tint, in: RoundedRectangle(cornerRadius: 18)).accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 5) {
                    Text(title).font(.headline)
                    Text(detail).font(.subheadline).foregroundStyle(Palette.secondary)
                }.frame(maxWidth: .infinity, alignment: .leading)
                Image(systemName: selected ? "checkmark.circle.fill" : "circle").font(.title3)
                    .accessibilityHidden(true)
            }.foregroundStyle(Palette.ink).padding(16).frame(maxWidth: .infinity, minHeight: 104)
                .background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
                .overlay(RoundedRectangle(cornerRadius: 24).stroke(selected ? Palette.ink : .clear, lineWidth: 2))
        }.buttonStyle(CredentialPressStyle()).accessibilityAddTraits(selected ? .isSelected : [])
    }
}
