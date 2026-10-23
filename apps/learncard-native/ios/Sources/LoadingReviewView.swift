#if DEBUG
import SwiftUI
import LearnCardNativeSDK

/// Isolated production-style fixtures, never account or provider operations.
struct LoadingReviewView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 28) {
                PageHeading(title: NativeText.text("career.title"), identifier: "loading-review", accent: Palette.flairTeal)
                Text(NativeText.text("career.demo")).font(.footnote).foregroundStyle(Palette.secondary)
                ProgressView(NativeText.text("career.checking")).accessibilityIdentifier("loading-review-status")
                ProgressView(NativeText.text("skills.loading")).font(.subheadline)
                PrimaryButton(title: NativeText.text("career.searching"), loading: true, fill: Palette.selection) {}
                    .accessibilityIdentifier("loading-review-button")
                HStack { ProgressView().controlSize(.mini); Text(NativeText.text("skills.opening")) }
                ProgressView(value: 0.4).tint(Palette.green).accessibilityIdentifier("loading-review-determinate")
            }.padding(24).frame(maxWidth: .infinity, alignment: .leading)
        }.background(Palette.paper).foregroundStyle(Palette.ink)
    }
}
#endif
