import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

struct ConnectionInboxRow: View {
    @Bindable var inbox: InboxStore
    let item: InboxItem
    private var tint: Color { item.kind == .prompt ? Palette.portfolioCard : item.kind == .notice ? Palette.blueCard : Palette.studiesCard }
    private var title: String {
        if item.kind == .request { return NativeText.text("inbox.connection.request") }
        if item.kind == .connection { return NativeText.text("inbox.connection.accepted") }
        if item.kind == .prompt { return NativeText.text("inbox.connection.prompt") }
        return item.title ?? NativeText.text("inbox.update")
    }
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                Group {
                    if item.kind == .notice { Image("InboxIllustration").resizable().scaledToFit().padding(4) }
                    else { ProfileArtwork(url: item.imageURL, size: 43) }
                }.frame(width: 74, height: 78).background(tint, in: RoundedRectangle(cornerRadius: 17)).accessibilityHidden(true)
                RoundedRectangle(cornerRadius: 2).fill(tint).frame(width: 4, height: 50).accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 4) {
                    Text(title).font(.system(.caption, design: .rounded).weight(.medium)).foregroundStyle(Palette.secondary)
                    if !item.name.isEmpty { Text(item.name).font(.headline.weight(.semibold)).foregroundStyle(Palette.ink) }
                    if item.kind == .notice, let body = item.body { Text(body).font(.subheadline).foregroundStyle(Palette.secondary) }
                    if item.kind != .notice, !item.actionable { Text(NativeText.text("inbox.status.\(item.status.rawValue)")).font(.caption).foregroundStyle(Palette.secondary) }
                }.frame(maxWidth: .infinity, alignment: .leading)
                if !item.read { Circle().fill(Palette.ink).frame(width: 6, height: 6).padding(.top, 7).accessibilityLabel(NativeText.text("inbox.unread")) }
            }
            HStack(spacing: 10) {
                if item.actionable {
                    action(item.kind == .prompt ? "inbox.connect" : "inbox.accept", item.kind == .prompt ? .connect : .accept, prominent: true)
                    if item.kind == .prompt { action("inbox.skip", .skip) }
                } else if !item.read { action("inbox.read", .read) }
                if item.dismissible && item.kind != .prompt { action("inbox.dismiss", .dismiss) }
            }
        }.padding(12).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
    }
    private func action(_ key: String, _ action: InboxAction, prominent: Bool = false) -> some View {
        Button { Task { _ = await inbox.act(item, action) } } label: {
            HStack(spacing: 6) {
                if inbox.busyID == item.id { ProgressView().controlSize(.mini) }
                Text(NativeText.text(key)).font(.system(.subheadline, design: .rounded).weight(.semibold))
            }.padding(.horizontal, 16).frame(minHeight: 44).frame(maxWidth: prominent ? .infinity : nil)
                .foregroundStyle(prominent ? Palette.cardInk : Palette.ink)
                .background(prominent ? tint : Palette.paper, in: RoundedRectangle(cornerRadius: 20))
        }.buttonStyle(.plain).disabled(inbox.busyID != nil || inbox.loading)
            .accessibilityIdentifier("inbox-\(action.rawValue)-\(item.id)")
    }
}

struct ConnectionPromptView: View {
    @Bindable var inbox: InboxStore
    let item: InboxItem
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 18) {
                    Image("ConnectionsIllustration").resizable().scaledToFit().frame(width: 190, height: 140).accessibilityHidden(true)
                    Text(NativeText.format("inbox.prompt.title", item.name)).font(.system(.title2, design: .rounded).weight(.bold)).foregroundStyle(Palette.ink)
                    Text(NativeText.text("inbox.prompt.detail")).font(.subheadline).foregroundStyle(Palette.secondary)
                    if let error = inbox.error { Text(error).font(.subheadline).foregroundStyle(Palette.ink) }
                    PrimaryButton(title: NativeText.text("inbox.connect"), loading: inbox.busyID != nil) {
                        Task { _ = await inbox.act(item, .connect) }
                    }.disabled(inbox.loading || inbox.busyID != nil).accessibilityIdentifier("connection-prompt-connect")
                    Button(NativeText.text("inbox.skip")) { Task { _ = await inbox.act(item, .skip) } }
                        .font(.subheadline.weight(.medium)).foregroundStyle(Palette.secondary).frame(minHeight: 44)
                        .disabled(inbox.loading || inbox.busyID != nil).accessibilityIdentifier("connection-prompt-skip")
                }.multilineTextAlignment(.center).padding(24)
            }.background(Palette.paper).navigationBarTitleDisplayMode(.inline)
        }.presentationDetents([.medium, .large])
    }
}
