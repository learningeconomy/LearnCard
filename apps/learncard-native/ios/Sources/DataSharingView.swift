import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

struct DataSharingView: View {
    @Environment(\.locale) private var nativeLocale
    let consumer: ConsumerAppsStore
    @State private var sharedURL: URL?
    @State private var linkBusy: String?
    @State private var stopLink: ManagedCredentialLink?
    @State private var notice: String?
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                PageHeading(title: NativeText.text("sharing.title"), identifier: "sharing")
                IllustratedIntro(image: "PrivacyIllustration", title: NativeText.text("sharing.intro"))
                if let error = consumer.error { ConsumerErrorCard(error: error) { Task { await consumer.loadPrivacy() } } }
                if consumer.privacyBusy && consumer.connections.isEmpty && consumer.links.isEmpty { ConsumerLoadingRows() }
                Text(NativeText.text("sharing.connections")).font(.title3.bold())
                if consumer.connections.isEmpty && !consumer.privacyBusy { empty("sharing.emptyConnections") }
                ForEach(consumer.connections) { connection in
                    NavigationLink { DataConnectionView(connection: connection, consumer: consumer) } label: {
                        HStack(spacing: 14) {
                            ConsumerAppIcon(url: connection.imageURL, title: connection.title)
                            VStack(alignment: .leading, spacing: 5) { Text(connection.title).font(.system(size: 18, weight: .semibold)); Text(sharingStatus(connection.status)).font(.caption).foregroundStyle(Palette.secondary) }
                            Spacer(minLength: 0)
                            Image(systemName: "chevron.forward").font(.caption).foregroundStyle(Palette.secondary)
                        }.padding(16).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
                    }.buttonStyle(.plain).accessibilityIdentifier("sharing-connection-\(connection.id)")
                }
                Text(NativeText.text("sharing.links")).font(.title3.bold())
                if consumer.links.isEmpty && !consumer.privacyBusy { empty("sharing.emptyLinks") }
                ForEach(consumer.links) { link in
                    VStack(alignment: .leading, spacing: 14) {
                        HStack(alignment: .top, spacing: 12) {
                            DrawnTile(symbol: .sharing, tint: Palette.cyanCard)
                            VStack(alignment: .leading, spacing: 5) {
                                Text(link.title).font(.headline)
                                Text(NativeText.count("sharing.count", link.selectedCount)).font(.caption).foregroundStyle(Palette.secondary)
                            }
                            Spacer(minLength: 0)
                            Text(sharingStatus(link.status)).font(.caption.weight(.medium)).foregroundStyle(Palette.secondary)
                        }
                        if link.contentState != "finalized" { Text(NativeText.text("sharing.pending")).font(.caption).foregroundStyle(Palette.secondary) }
                        HStack { Text(NativeText.text("sharing.created")); Spacer(); Text(link.createdAt, style: .date) }.font(.caption).foregroundStyle(Palette.secondary)
                        if let expiry = link.expiresAt { HStack { Text(NativeText.text("sharing.expires")); Spacer(); Text(expiry, style: .date) }.font(.caption).foregroundStyle(Palette.secondary) }
                        if link.passcodeProtected { Label(NativeText.text("sharing.protected"), systemImage: "lock").font(.caption).foregroundStyle(Palette.secondary) }
                        HStack(spacing: 18) {
                            Button(NativeText.text("sharing.share"), systemImage: "square.and.arrow.up") { resolve(link, copy: false) }.disabled(!link.canShare || linkBusy != nil)
                            Button(NativeText.text("sharing.copy"), systemImage: "document.on.document") { resolve(link, copy: true) }.disabled(!link.canShare || linkBusy != nil)
                            Spacer(minLength: 0)
                            if linkBusy == link.id { ProgressView() }
                            if link.status == "active" { Button(role: .destructive) { stopLink = link } label: { Image(systemName: "xmark.circle") }.accessibilityLabel(NativeText.text("sharing.stop")).disabled(consumer.actionBusy) }
                        }.font(.subheadline.weight(.medium)).foregroundStyle(Palette.selection)
                    }.padding(18).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24)).accessibilityIdentifier("sharing-link-\(link.id)")
                }
                if consumer.hasMorePrivacy { Button(NativeText.text("common.more")) { Task { await consumer.loadPrivacy(more: true) } }.disabled(consumer.privacyBusy) }
            }.foregroundStyle(Palette.ink).padding(20)
        }.background(Palette.paper).navigationTitle(NativeText.text("sharing.title")).navigationBarTitleDisplayMode(.inline)
            .task { await consumer.loadPrivacy() }.refreshable { await consumer.loadPrivacy() }
            .sheet(isPresented: Binding(get: { sharedURL != nil }, set: { if !$0 { sharedURL = nil } })) { if let sharedURL { NativeShareSheet(url: sharedURL) } }
            .confirmationDialog(NativeText.text("sharing.linkStopTitle"), isPresented: Binding(get: { stopLink != nil }, set: { if !$0 { stopLink = nil } }), titleVisibility: .visible) {
                Button(NativeText.text("sharing.stop"), role: .destructive) { if let link = stopLink { Task { _ = await consumer.stop(link) } }; stopLink = nil }
                Button(NativeText.text("common.cancel"), role: .cancel) {}
            } message: { Text(NativeText.text("sharing.linkStopBody")) }
            .alert(NativeText.text("common.done"), isPresented: Binding(get: { notice != nil || consumer.notice != nil }, set: { if !$0 { notice = nil; consumer.notice = nil } })) {
                Button(NativeText.text("common.done"), role: .cancel) { notice = nil; consumer.notice = nil }
            } message: { Text(notice ?? NativeText.text(consumer.notice ?? "")) }
    }
    private func empty(_ key: String) -> some View { Text(NativeText.text(key)).font(.subheadline).foregroundStyle(Palette.secondary).padding(20).frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24)) }
    private func resolve(_ link: ManagedCredentialLink, copy: Bool) {
        linkBusy = link.id
        Task {
            defer { linkBusy = nil }
            do {
                let url = try await consumer.service.linkURL(link.id)
                guard !Task.isCancelled, consumer.links.contains(where: { $0.id == link.id && $0.canShare }) else { return }
                if copy { UIPasteboard.general.setItems([[UIPasteboard.typeAutomatic: url.absoluteString]], options: [.localOnly: true, .expirationDate: Date.now.addingTimeInterval(300)]); notice = NativeText.text("sharing.copied") }
                else { sharedURL = url }
            } catch { consumer.fail(error) }
        }
    }
}

private struct DataConnectionView: View {
    @Environment(\.locale) private var nativeLocale
    let connection: DataConnection
    let consumer: ConsumerAppsStore
    @State private var confirm = false
    @State private var withdrew = false
    private var current: DataConnection { consumer.connections.first { $0.id == connection.id } ?? connection }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                HStack(spacing: 16) { ConsumerAppIcon(url: current.imageURL, title: current.title, size: 64); VStack(alignment: .leading, spacing: 6) { Text(current.title).font(.title2.bold()); Text(sharingStatus(withdrew ? "withdrawn" : current.status)).font(.subheadline).foregroundStyle(Palette.secondary) } }
                ConsentRecipients(recipients: current.recipients)
                VStack(alignment: .leading, spacing: 16) {
                    Text(NativeText.text("sharing.access")).font(.title2.bold())
                    ForEach(current.disclosures) { disclosure in
                        HStack(alignment: .top, spacing: 14) {
                            DrawnTile(symbol: disclosure.direction == "read" ? .credential : .add,
                                      tint: disclosure.direction == "read" ? Palette.pinkCard : Palette.blueCard)
                            VStack(alignment: .leading, spacing: 5) {
                                Text(consentLabel(disclosure.label)).font(.subheadline.weight(.medium))
                                Text(NativeText.text(directionKey(disclosure.direction))).font(.caption).foregroundStyle(Palette.secondary)
                                if let count = disclosure.count { Text(disclosure.detail == "all" ? NativeText.text("sharing.all") : NativeText.count("sharing.count", count)).font(.caption).foregroundStyle(Palette.secondary) }
                                else if let detail = disclosure.detail { Text(detail).font(.subheadline).foregroundStyle(Palette.secondary) }
                            }.frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                    if let date = current.expiresAt { LabeledContent(NativeText.text("sharing.expires")) { Text(date, style: .date) }.font(.caption) }
                }.padding(20).frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
                if let error = consumer.error { ConsumerErrorCard(error: error) { consumer.error = nil } }
                if current.status != "withdrawn" && !withdrew { Button(role: .destructive) { confirm = true } label: {
                    Text(NativeText.text("sharing.stop")).font(.body.weight(.semibold)).foregroundStyle(Palette.errorInk)
                        .frame(maxWidth: .infinity, minHeight: 52).background(Palette.pinkCard.opacity(0.18), in: RoundedRectangle(cornerRadius: 18))
                        .overlay(RoundedRectangle(cornerRadius: 18).stroke(Palette.errorInk.opacity(0.3)))
                }.buttonStyle(CredentialPressStyle()).disabled(consumer.actionBusy).accessibilityIdentifier("connection-stop"); if consumer.actionBusy { ProgressView() } }
            }.padding(20).foregroundStyle(Palette.ink)
        }.background(Palette.paper).navigationTitle(current.title).navigationBarTitleDisplayMode(.inline)
            .confirmationDialog(NativeText.text("sharing.stopTitle"), isPresented: $confirm, titleVisibility: .visible) {
                Button(NativeText.text("sharing.stop"), role: .destructive) { Task { withdrew = await consumer.withdraw(current) } }
                Button(NativeText.text("common.cancel"), role: .cancel) {}
            } message: { Text(NativeText.text("sharing.stopBody")) }
    }
    private func directionKey(_ value: String) -> String {
        switch value { case "read": "sharing.readLabel"; case "write": "sharing.writeLabel"; case "personal": "sharing.personalLabel"; default: "sharing.writePersonalLabel" }
    }
}

private func sharingStatus(_ status: String) -> String { NativeText.text("sharing.\(status == "live" ? "active" : status)") }
