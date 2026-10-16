import SwiftUI
import LearnCardNativeSDK

struct AccountView: View {
    @Environment(\.locale) private var nativeLocale
    @Environment(\.dismiss) private var dismiss
    var account: AccountController?
    let store: AppStore
    @State private var showForget = false
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    PageHeading(title: NativeText.literal("Your account"), identifier: "account")
                    NavigationLink { EditAccountProfileView(account: account) } label: {
                        HStack(spacing: 16) {
                            ProfileArtwork(url: account?.state?.profileImage, size: 68)
                                .padding(7).background(Palette.portfolioCard, in: RoundedRectangle(cornerRadius: 18))
                            VStack(alignment: .leading, spacing: 5) {
                                Text(account?.state?.profileName ?? "Native Lab").font(.title3.bold()).foregroundStyle(Palette.ink)
                                Text(account?.state?.profileId.map { "@\($0)" } ?? NativeText.literal("Unsigned samples"))
                                    .font(.subheadline).foregroundStyle(Palette.secondary)
                                Text(NativeText.literal("Edit profile")).font(.subheadline.weight(.semibold)).foregroundStyle(Palette.green)
                            }.frame(maxWidth: .infinity, alignment: .leading)
                            Image(systemName: "chevron.forward").font(.subheadline).foregroundStyle(Palette.secondary)
                        }.padding(16).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
                    }.accessibilityIdentifier("account-edit-profile")
                    VStack(spacing: 0) {
                        NavigationLink { FamiliesView(appStore: store) } label: { DrawnSettingsRow(title: NativeText.text("family.title"), symbol: .family, tint: Palette.blueCard) }.accessibilityIdentifier("account-families")
                        divider
                        NavigationLink { DataSharingView(consumer: store.consumer) } label: { DrawnSettingsRow(title: "Data Sharing", symbol: .sharing, tint: Palette.studiesCard) }.accessibilityIdentifier("account-data-sharing")
                        divider
                        NavigationLink { AccountSecurityView(account: account) } label: { DrawnSettingsRow(title: "Recovery & security", symbol: .security, tint: Palette.pinkCard) }.accessibilityIdentifier("account-security")
                        divider
                        NavigationLink { NativeLanguageView() } label: { DrawnSettingsRow(title: "App language", symbol: .language, tint: Palette.lilacCard) }.accessibilityIdentifier("account-language")
                        divider
                        Link(destination: URL(string: "https://staging.learncard.app/notifications")!) { DrawnSettingsRow(title: "Notifications", symbol: .notifications, tint: Palette.portfolioCard, web: true) }
                        divider
                        Link(destination: URL(string: "https://docs.learncard.com")!) { DrawnSettingsRow(title: "Help", symbol: .help, tint: Palette.cyanCard, web: true) }
                    }.background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
                    if let account {
                        NavigationLink { StagingResetView(account: account) } label: {
                            DrawnSettingsRow(title: NativeText.text("reset.title"), symbol: .forget, tint: Palette.pinkCard,
                                             subtitle: NativeText.text("reset.subtitle"), destructive: true)
                        }.background(Palette.surface, in: RoundedRectangle(cornerRadius: 22)).accessibilityIdentifier("account-staging-reset")
                        VStack(spacing: 0) {
                            Button { dismiss(); Task { await account.signOut(forget: false) } } label: {
                                DrawnSettingsRow(title: "Sign out", symbol: .signOut, tint: Palette.pinkCard)
                            }.accessibilityIdentifier("account-sign-out")
                            divider
                            Button { showForget = true } label: {
                                DrawnSettingsRow(title: "Forget this device", symbol: .forget, tint: Palette.pinkCard,
                                                 subtitle: NativeText.text("account.forget.caption"), destructive: true)
                            }.accessibilityIdentifier("account-forget-device")
                        }.background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
                    } else { Text(NativeText.literal("Sample mode")).font(.footnote).foregroundStyle(Palette.secondary) }
                }.padding(20).buttonStyle(CredentialPressStyle())
            }.background(Palette.paper).navigationTitle("").navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    if #available(iOS 26.0, *) {
                        ToolbarItem(placement: .topBarLeading) { LearnCardBrand() }.sharedBackgroundVisibility(.hidden)
                    } else { ToolbarItem(placement: .topBarLeading) { LearnCardBrand() } }
                    ToolbarItem(placement: .confirmationAction) { Button(NativeText.literal("Done")) { dismiss() } }
                }
                .confirmationDialog("Forget this device?", isPresented: $showForget, titleVisibility: .visible) {
                    Button("Sign Out & Forget Device", role: .destructive) { dismiss(); Task { await account?.signOut(forget: true) } }
                    Button(NativeText.literal("Cancel"), role: .cancel) {}
                } message: { Text("You'll need your recovery method when signing in again on this iPhone.") }
        }.environment(\.locale, NativeLanguage.selected.locale)
            .environment(\.layoutDirection, NativeLanguage.selected.isRightToLeft ? .rightToLeft : .leftToRight)
            #if DEBUG
            .modifier(NativeReviewPreferences())
            #endif
            .presentationDetents([.large]).presentationDragIndicator(.visible).presentationBackground(Palette.paper)
    }
    private var divider: some View { Divider().padding(.leading, 74) }
}

private struct NativeLanguageView: View {
    @Environment(\.locale) private var nativeLocale
    @AppStorage(NativeLanguage.preferenceKey) private var selected = "system"
    var body: some View {
        List(NativeLanguage.allCases) { language in
            Button { selected = language.rawValue } label: {
                HStack { Text(language.name).foregroundStyle(Palette.ink); Spacer(); if selected == language.rawValue { Image(systemName: "checkmark").foregroundStyle(Palette.selection) } }
            }.accessibilityIdentifier("language-\(language.rawValue)").accessibilityAddTraits(selected == language.rawValue ? .isSelected : [])
        }.navigationTitle(NativeText.text("language.title")).navigationBarTitleDisplayMode(.inline).scrollContentBackground(.hidden).background(Palette.paper)
    }
}

private struct AccountSecurityView: View {
    @Environment(\.locale) private var nativeLocale
    let account: AccountController?
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                PageHeading(title: NativeText.text("access.securityIntro"), identifier: "account-security")
                Image("AccessRecoveryIllustration").resizable().scaledToFit().frame(maxWidth: .infinity).frame(height: 120).accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 8) {
                    Text(NativeText.text("access.email")).font(.subheadline.weight(.semibold))
                    Text(account?.email ?? NativeText.literal("Sample mode")).font(.body).textSelection(.enabled)
                        .environment(\.layoutDirection, .leftToRight)
                }.padding(20).frame(maxWidth: .infinity, alignment: .leading)
                    .background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 12) {
                        Image(systemName: "iphone").font(.title2).frame(width: 44, height: 44)
                            .foregroundStyle(Palette.cardInk).background(Palette.blueCard, in: RoundedRectangle(cornerRadius: 13)).accessibilityHidden(true)
                        Text(NativeText.text("access.thisDevice")).font(.title3.bold())
                    }
                    Text(NativeText.text(account == nil ? "access.deviceSample" : "access.deviceSaved")).font(.body)
                    Text(NativeText.text("access.deviceDetail")).font(.subheadline).foregroundStyle(Palette.secondary)
                }.padding(20).frame(maxWidth: .infinity, alignment: .leading)
                    .background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
                VStack(alignment: .leading, spacing: 14) {
                    Link(destination: URL(string: "https://staging.learncard.app/wallet")!) {
                        DrawnSettingsRow(title: NativeText.text("access.manageRecovery"), symbol: .security, tint: Palette.portfolioCard, web: true)
                    }.background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
                    Text(NativeText.text("access.manageRecovery.detail")).font(.subheadline).foregroundStyle(Palette.secondary).padding(.horizontal, 4)
                }
                VStack(spacing: 0) {
                    Link(destination: URL(string: "https://www.learncard.com/learncard-privacy-policy")!) {
                        DrawnSettingsRow(title: NativeText.text("access.privacy"), symbol: .security, tint: Palette.pinkCard, web: true)
                    }
                    Divider().padding(.leading, 74)
                    Link(destination: URL(string: "https://www.learncard.com/learncard-terms-of-service")!) {
                        DrawnSettingsRow(title: NativeText.text("access.terms"), symbol: .help, tint: Palette.lilacCard, web: true)
                    }
                }.background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
            }.padding(20).frame(maxWidth: 620).frame(maxWidth: .infinity)
        }.background(Palette.paper).foregroundStyle(Palette.ink).buttonStyle(CredentialPressStyle())
            .navigationTitle(NativeText.literal("Recovery & security")).navigationBarTitleDisplayMode(.inline)
    }
}
