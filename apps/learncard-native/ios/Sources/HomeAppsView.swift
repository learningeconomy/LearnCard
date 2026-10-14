import SwiftUI
import LearnCardNativeSDK
import LearnCardNativeCore

/// A compact personal dashboard. Counts describe loaded data; activity is session-local.
struct HomeView: View {
    @Environment(\.locale) private var nativeLocale
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
                            Text(NativeText.literal("Create")).font(.title2.bold())
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
                            Text(NativeText.literal("Your creations")).font(.headline).foregroundStyle(Palette.ink)
                            Text("Credentials you can give again").font(.caption).foregroundStyle(Palette.secondary)
                        }
                        Spacer(); Image(systemName: "chevron.right").foregroundStyle(Palette.secondary)
                    }.padding(20).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
                }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("home-creations")
                NavigationLink { FamiliesView(appStore: store) } label: {
                    HStack(spacing: 14) {
                        Image(systemName: "person.2").font(.system(size: 22, weight: .regular)).foregroundStyle(Palette.cardInk)
                            .frame(width: 44, height: 44).background(Palette.familyCard, in: Circle())
                        VStack(alignment: .leading, spacing: 5) {
                            Text(NativeText.text("family.title")).font(.headline).foregroundStyle(Palette.ink)
                            Text(NativeText.text("family.subtitle")).font(.caption).foregroundStyle(Palette.secondary)
                        }.frame(maxWidth: .infinity, alignment: .leading)
                        Image(systemName: "chevron.right").font(.caption.weight(.semibold)).foregroundStyle(Palette.secondary)
                    }.padding(20).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
                }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("home-families")
                if !store.isLive {
                    Button("Try a sample claim link", action: receive).accessibilityIdentifier("receive")
                        .font(.subheadline.weight(.medium)).foregroundStyle(Palette.selection)
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
        .background(SectionBackground(tint: Palette.homeCanvas))
        .onScrollGeometryChange(for: Bool.self) { $0.contentOffset.y + $0.contentInsets.top > 60 } action: { _, value in scrolled = value }
        .navigationTitle(scrolled ? "Home" : "").navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Palette.homeCanvas, for: .navigationBar).toolbarBackground(.visible, for: .navigationBar)
        .refreshable { await store.refresh() }
    }
}
