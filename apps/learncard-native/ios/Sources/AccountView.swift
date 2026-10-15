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
        }.presentationDetents([.large]).presentationDragIndicator(.visible).presentationBackground(Palette.paper)
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

private struct EditAccountProfileView: View {
    @Environment(\.locale) private var nativeLocale
    @Environment(\.dismiss) private var dismiss
    let account: AccountController?
    @State private var name = ""
    @State private var bio = ""
    @State private var error: String?
    var body: some View {
        Form {
            Section("Profile") {
                TextField("Display name", text: $name).accessibilityIdentifier("profile-name")
                TextField("A little about you", text: $bio, axis: .vertical).lineLimit(3...6)
            }
            if let error { Text(error).foregroundStyle(Palette.secondary) }
            Section {
                PrimaryButton(title: account?.busy == true ? "Saving…" : "Save Profile", loading: account?.busy == true,
                              disabled: account == nil || name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || name.count > 100 || bio.count > 500) {
                    Task { if await account?.updateProfile(name: name, bio: bio) == true { dismiss() } else { error = "Couldn't save. Try again." } }
                }
            } footer: { Text(account == nil ? "Profile editing is available after sign-in." : "Updates your public LearnCard name and bio.") }
        }.scrollContentBackground(.hidden).background(Palette.paper).foregroundStyle(Palette.ink)
            .navigationTitle(NativeText.literal("Edit profile")).navigationBarTitleDisplayMode(.inline)
            .onAppear { name = account?.state?.profileName ?? "Native Lab"; bio = account?.state?.profileBio ?? "" }
    }
}

private struct AccountSecurityView: View {
    @Environment(\.locale) private var nativeLocale
    let account: AccountController?
    var body: some View {
        List {
            Section("Sign-in") { LabeledContent("Email", value: account?.email ?? "Sample mode") }
            Section("This iPhone") {
                Label(account == nil ? "Samples stay in memory" : "Account access is saved on this device", systemImage: "iphone.gen3")
                Text("Sign out keeps it ready for next time. Forget this device removes its saved access.").font(.subheadline).foregroundStyle(Palette.secondary)
            }
            Section("Recovery methods") {
                Link("Manage recovery in LearnCard web", destination: URL(string: "https://staging.learncard.app/wallet")!)
                Text("Open your profile there for recovery options, account export, and account deletion. Web may ask you to sign in.").font(.subheadline).foregroundStyle(Palette.secondary)
            }
            Section {
                Link("Privacy policy", destination: URL(string: "https://www.learncard.com/learncard-privacy-policy")!)
                Link("Terms of service", destination: URL(string: "https://www.learncard.com/learncard-terms-of-service")!)
            }
        }.scrollContentBackground(.hidden).background(Palette.paper).foregroundStyle(Palette.ink)
            .navigationTitle(NativeText.literal("Recovery & security")).navigationBarTitleDisplayMode(.inline)
    }
}
