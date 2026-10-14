import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

/// Compact artwork-led row shared by Collection matches and incoming credentials.
struct CredentialListRow: View {
    let credential: Credential
    @Environment(\.dynamicTypeSize) private var textSize
    @ScaledMetric(relativeTo: .headline) private var titleSize = 18.0
    private var tint: Color { Palette.categoryTint(credential.displayCategory) }

    var body: some View {
        HStack(spacing: 12) {
            CredentialArtwork(credential: credential, size: 56)
                .frame(width: 74, height: 78).background(tint, in: RoundedRectangle(cornerRadius: 17))
            RoundedRectangle(cornerRadius: 2).fill(tint).frame(width: 4, height: 52).accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 5) {
                Text(credential.title).font(.system(size: titleSize, weight: .semibold)).tracking(-0.2).foregroundStyle(Palette.ink)
                    .lineLimit(textSize.isAccessibilitySize ? nil : 3)
                Text(credential.issuer).font(.subheadline).foregroundStyle(Palette.secondary)
                    .lineLimit(textSize.isAccessibilitySize ? nil : 2)
                Text(NativeText.literal(credential.kind.rawValue)).font(.footnote.weight(.medium))
                    .foregroundStyle(Palette.categoryAccent(credential.displayCategory))
            }.frame(maxWidth: .infinity, alignment: .leading).multilineTextAlignment(.leading)
            Image(systemName: "chevron.right").font(.caption.weight(.semibold))
                .foregroundStyle(Palette.secondary).accessibilityHidden(true)
        }.padding(12).frame(maxWidth: .infinity, minHeight: 108)
            .fixedSize(horizontal: false, vertical: true)
            .background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
            .accessibilityElement(children: .combine)
    }
}

struct ProfileArtwork: View {
    var url: URL?
    var size: CGFloat = 32
    var body: some View {
        Group {
            if let url {
                AsyncImage(url: url) { phase in
                    if let image = phase.image { image.resizable().scaledToFill() }
                    else {
                        placeholder.overlay {
                            if phase.error == nil { ProgressView().controlSize(.mini) }
                        }
                    }
                }
            } else { placeholder }
        }.frame(width: size, height: size).clipShape(RoundedRectangle(cornerRadius: size * 0.25))
            .accessibilityHidden(true)
    }
    private var placeholder: some View { Image("AccountAvatar").resizable().scaledToFit() }
}
