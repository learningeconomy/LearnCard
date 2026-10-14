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
                VStack(spacing: 18) {
                    HStack(spacing: 14) {
                        ProfileArtwork(url: account?.state?.profileImage, size: 64)
                        VStack(alignment: .leading, spacing: 5) {
                            Text(account?.state?.profileName ?? "Native Lab").font(.title3.bold()).foregroundStyle(Palette.ink)
                            Text(account?.state?.profileId.map { "@\($0)" } ?? "Unsigned samples").font(.subheadline).foregroundStyle(Palette.secondary)
                        }
                        Spacer()
                    }.padding(18).frame(maxWidth: .infinity, alignment: .leading)
                        .background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
                    VStack(spacing: 0) {
                        NavigationLink { EditAccountProfileView(account: account) } label: { row("Edit profile", symbol: "person.crop.circle", tint: Palette.blueCard) }
                            .accessibilityIdentifier("account-edit-profile")
                        divider
                        NavigationLink { FamiliesView(appStore: store) } label: { row(NativeText.text("family.title"), symbol: "person.2", tint: Palette.familyCard) }.accessibilityIdentifier("account-families")
                        divider
                        NavigationLink { DataSharingView(consumer: store.consumer) } label: { row("Data Sharing", symbol: "lock", tint: Palette.cyanCard) }.accessibilityIdentifier("account-data-sharing")
                        divider
                        NavigationLink { AccountSecurityView(account: account) } label: { row("Recovery & security", symbol: "shield", tint: Palette.pinkCard) }
                            .accessibilityIdentifier("account-security")
                    }.background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
                    VStack(spacing: 0) {
                        NavigationLink { NativeLanguageView() } label: { row("App language", symbol: "globe", tint: Palette.pinkCard) }.accessibilityIdentifier("account-language")
                        divider
                        Link(destination: URL(string: "https://staging.learncard.app/notifications")!) { row("Notifications", symbol: "bell", tint: Palette.blueCard, web: true) }
                        divider
                        Link(destination: URL(string: "https://docs.learncard.com")!) { row("Help", symbol: "questionmark", tint: Palette.cyanCard, web: true) }
                    }.background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
                    if let account {
                        VStack(spacing: 0) {
                            Button { dismiss(); Task { await account.signOut(forget: false) } } label: { row("Sign out", symbol: "rectangle.portrait.and.arrow.right", tint: Palette.paper) }.accessibilityIdentifier("account-sign-out")
                            divider
                            Button { showForget = true } label: { row("Forget this device", symbol: "trash", tint: Palette.pinkCard, destructive: true) }.accessibilityIdentifier("account-forget-device")
                        }.background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
                    }
                    Text(account == nil ? "Sample mode" : "Staging account · Some settings open on web")
                        .font(.caption).foregroundStyle(Palette.secondary).frame(maxWidth: .infinity, alignment: .leading).padding(.horizontal, 6)
                }.padding(20)
            }.background(Palette.paper).navigationTitle(NativeText.literal("Your account")).navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .confirmationAction) { Button(NativeText.literal("Done")) { dismiss() } } }
                .confirmationDialog("Forget this device?", isPresented: $showForget, titleVisibility: .visible) {
                    Button("Sign Out & Forget Device", role: .destructive) { dismiss(); Task { await account?.signOut(forget: true) } }
                    Button(NativeText.literal("Cancel"), role: .cancel) {}
                } message: { Text("You'll need your recovery method when signing in again on this iPhone.") }
        }.presentationDetents([.large]).presentationDragIndicator(.visible).presentationBackground(Palette.paper)
    }
    private var divider: some View { Divider().padding(.leading, 64) }
    private func row(_ title: String, symbol: String, tint: Color, web: Bool = false, destructive: Bool = false) -> some View {
        HStack(spacing: 12) {
            Image(systemName: symbol).font(.system(size: 16, weight: .medium)).foregroundStyle(Palette.cardInk)
                .frame(width: 34, height: 34).background(tint, in: Circle()).accessibilityHidden(true)
            Text(NativeText.literal(title)).font(.body.weight(.medium)).foregroundStyle(destructive ? .red : Palette.ink)
            Spacer(minLength: 0)
            Image(systemName: web ? "arrow.up.right" : "chevron.right").font(.caption.weight(.medium)).foregroundStyle(Palette.secondary).accessibilityHidden(true)
        }.padding(.horizontal, 16).frame(minHeight: 60).contentShape(Rectangle())
    }
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
