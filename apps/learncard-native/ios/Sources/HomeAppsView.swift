import SwiftUI
import LearnCardNativeCore

/// A compact personal dashboard. Counts describe loaded data; activity is session-local.
struct HomeView: View {
    let store: AppStore
    var profileName: String?
    let openInbox: () -> Void
    let create: () -> Void
    let receive: () -> Void
    @State private var scrolled = false
    @Environment(\.dynamicTypeSize) private var textSize

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                PageHeading(title: "Home")
                Text(profileName.map { "Welcome back, \($0)." } ?? "A little space for what's next.")
                    .font(.title3.weight(.medium)).foregroundStyle(Palette.secondary)
                (textSize.isAccessibilitySize ? AnyLayout(VStackLayout(spacing: 12)) : AnyLayout(HStackLayout(spacing: 12))) {
                    Button(action: openInbox) {
                        VStack(alignment: .leading, spacing: 14) {
                            Image(systemName: "tray.and.arrow.down").font(.title2)
                            Text("\(store.snapshot?.offers.count ?? 0)").font(.largeTitle.bold())
                            Text("To review").font(.subheadline.weight(.medium))
                        }.frame(maxWidth: .infinity, alignment: .leading).padding(20)
                            .foregroundStyle(Palette.cardInk).background(Palette.cyanCard, in: RoundedRectangle(cornerRadius: 24))
                    }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("home-inbox")
                    Button(action: create) {
                        VStack(alignment: .leading, spacing: 14) {
                            Image(systemName: "plus").font(.title2)
                            Text("Create").font(.title2.bold())
                            Text("Celebrate someone").font(.subheadline.weight(.medium))
                        }.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading).padding(20)
                            .foregroundStyle(Palette.cardInk).background(Palette.pinkCard, in: RoundedRectangle(cornerRadius: 24))
                    }.buttonStyle(CredentialPressStyle())
                }.fixedSize(horizontal: false, vertical: true)
                NavigationLink {
                    CreationsView(store: store)
                } label: {
                    HStack(spacing: 14) {
                        Image(systemName: "rectangle.stack.badge.plus").font(.title2).foregroundStyle(Palette.green)
                        VStack(alignment: .leading, spacing: 5) {
                            Text("Your creations").font(.headline).foregroundStyle(Palette.ink)
                            Text("Credentials you can give again").font(.caption).foregroundStyle(Palette.secondary)
                        }
                        Spacer(); Image(systemName: "chevron.right").foregroundStyle(Palette.secondary)
                    }.padding(20).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
                }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("home-creations")
                if !store.isLive {
                    Button("Try a sample claim link", action: receive).accessibilityIdentifier("receive")
                        .font(.subheadline.weight(.medium)).foregroundStyle(Palette.green)
                }
                VStack(alignment: .leading, spacing: 16) {
                    Text("Recent activity").font(.title3.bold()).foregroundStyle(Palette.ink)
                    Text("Created, received, and sent during this session.").font(.subheadline).foregroundStyle(Palette.secondary)
                    if store.snapshot?.activity.isEmpty != false {
                        Text("Your next action will appear here.").font(.body).foregroundStyle(Palette.secondary).padding(.vertical, 16)
                    }
                    ForEach(store.snapshot?.activity ?? []) { item in
                        HStack(alignment: .top, spacing: 14) {
                            Image(systemName: item.symbol).font(.body).foregroundStyle(Palette.green)
                                .frame(width: 40, height: 40).background(Palette.mint, in: Circle()).accessibilityHidden(true)
                            VStack(alignment: .leading, spacing: 5) {
                                Text(item.title).font(.headline).foregroundStyle(Palette.ink)
                                Text(item.detail).font(.subheadline).foregroundStyle(Palette.secondary)
                                Text(item.date, style: .relative).font(.caption).foregroundStyle(Palette.secondary)
                            }
                            Spacer(minLength: 0)
                        }.padding(.vertical, 8)
                    }
                }.padding(20).frame(maxWidth: .infinity, alignment: .leading)
                    .background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
            }.padding(20)
        }
        .background(SectionBackground(tint: Palette.paper))
        .onScrollGeometryChange(for: Bool.self) { $0.contentOffset.y + $0.contentInsets.top > 60 } action: { _, value in scrolled = value }
        .navigationTitle(scrolled ? "Home" : "").navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Palette.paper, for: .navigationBar).toolbarBackground(.visible, for: .navigationBar)
        .refreshable { await store.refresh() }
    }
}

/// Consumer store destination reserved for the next integration phase.
struct AppsView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                PageHeading(title: "Apps")
                VStack(alignment: .leading, spacing: 22) {
                    Image("AppsTabActive").resizable().scaledToFit().frame(width: 64, height: 64).accessibilityHidden(true)
                    Text("More ways to learn").font(.title.bold())
                    Text("Discover experiences that connect with your LearnCard.").font(.body)
                    Link(destination: URL(string: "https://staging.learncard.app/launchpad/browse")!) {
                        Label("Browse on LearnCard", systemImage: "arrow.up.right")
                            .font(.body.weight(.semibold)).padding(.vertical, 14).padding(.horizontal, 18)
                            .background(.white.opacity(0.75), in: Capsule())
                    }.accessibilityIdentifier("apps-browse")
                }.padding(24).frame(maxWidth: .infinity, alignment: .leading)
                    .foregroundStyle(Palette.cardInk).background(Palette.blueCard, in: RoundedRectangle(cornerRadius: 28))
                Text("Native app browsing and installation are coming next. The web store may ask you to sign in.")
                    .font(.subheadline).foregroundStyle(Palette.secondary)
            }.padding(20)
        }.background(SectionBackground(tint: Palette.paper))
            .navigationTitle("").navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Palette.paper, for: .navigationBar).toolbarBackground(.visible, for: .navigationBar)
    }
}
