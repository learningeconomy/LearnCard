import SwiftUI
import PhotosUI
import LearnCardNativeSDK

struct EditAccountProfileView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.dynamicTypeSize) private var textSize
    let account: AccountController?
    @State private var name = ""
    @State private var bio = ""
    @State private var loaded = false
    @State private var photo: PhotosPickerItem?
    @State private var edit: ProfilePhotoEdit = .unchanged
    @State private var preparing = false
    @State private var error: String?

    private var hasPhoto: Bool {
        switch edit {
        case .unchanged: account?.state?.profileImage != nil
        case .remove: false
        case .jpeg: true
        }
    }
    private var photoStatus: String {
        NativeText.text(edit == .unchanged && hasPhoto ? "profile.photo.current" : hasPhoto ? "profile.photo.new" : "profile.photo.default")
    }
    private var busy: Bool { account?.busy == true }

    var body: some View {
        Form {
            Section {
                Group {
                    if textSize.isAccessibilitySize { VStack(alignment: .leading, spacing: 16) { preview; photoActions } }
                    else { HStack(spacing: 20) { preview; photoActions } }
                }.padding(.vertical, 8)
            } header: { Text(NativeText.text("profile.photo.title")) }
              footer: { Text(NativeText.text("profile.photo.caption")) }
            Section {
                TextField(NativeText.text("profile.name"), text: $name).disabled(busy).accessibilityIdentifier("profile-name")
                TextField(NativeText.text("profile.bio"), text: $bio, axis: .vertical).lineLimit(3...6).disabled(busy).accessibilityIdentifier("profile-bio")
            } header: { Text(NativeText.text("profile.details")) }
            if let error {
                Section { Label(error, systemImage: "exclamationmark.circle").foregroundStyle(Palette.ink).accessibilityIdentifier("profile-error") }
            }
            Section {
                PrimaryButton(title: NativeText.text(account?.uploadingPhoto == true ? "profile.uploading" : busy ? "profile.saving" : "profile.save"), loading: busy,
                              disabled: account == nil || preparing || name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || name.count > 100 || bio.count > 500) {
                    error = nil
                    Task { @MainActor in
                        if await account?.updateProfile(name: name, bio: bio, photo: edit) == true { dismiss() }
                        else if account?.phase == "ready" { error = NativeText.text("profile.save.error") }
                    }
                }.accessibilityIdentifier("profile-save")
            } footer: { Text(NativeText.text(account == nil ? "profile.signin.caption" : "profile.save.caption")) }
        }.scrollContentBackground(.hidden).background(Palette.paper).foregroundStyle(Palette.ink)
            .navigationTitle(NativeText.literal("Edit profile")).navigationBarTitleDisplayMode(.inline)
            .navigationBarBackButtonHidden(busy)
            .scrollDismissesKeyboard(.interactively)
            .interactiveDismissDisabled(busy)
            .onAppear {
                guard !loaded else { return }; loaded = true
                name = account?.state?.profileName ?? "Native Lab"; bio = account?.state?.profileBio ?? ""
            }
            .task(id: photo) {
                guard let item = photo else { preparing = false; return }
                preparing = true; error = nil
                do {
                    guard let data = try await item.loadTransferable(type: Data.self) else { throw AccountError.unavailable }
                    try await prepare(data)
                } catch {
                    if !Task.isCancelled { self.error = NativeText.text("profile.photo.error"); photo = nil }
                }
                if !Task.isCancelled { preparing = false }
            }
    }

    private var preview: some View {
        Group {
            if case .jpeg(let data) = edit, let image = UIImage(data: data) { Image(uiImage: image).resizable().scaledToFill() }
            else { ProfileArtwork(url: edit == .remove ? nil : account?.state?.profileImage, size: 96) }
        }.frame(width: 96, height: 96).clipShape(RoundedRectangle(cornerRadius: 25))
            .padding(8).background(Palette.portfolioCard, in: RoundedRectangle(cornerRadius: 30))
            .accessibilityElement(children: .ignore).accessibilityLabel(NativeText.text("profile.photo.title"))
            .accessibilityValue(photoStatus).accessibilityIdentifier("profile-photo-preview")
    }
    private var photoActions: some View {
        let chooseTitle = NativeText.text(hasPhoto ? "profile.photo.change" : "profile.photo.choose")
        return VStack(alignment: .leading, spacing: 3) {
            PhotosPicker(selection: $photo, matching: .images, photoLibrary: .shared()) {
                Label(chooseTitle, systemImage: "photo.badge.plus")
                    .font(.headline).frame(minHeight: 44, alignment: .leading)
            }.disabled(busy || preparing).accessibilityIdentifier("profile-photo-choose")
            if preparing { ProgressView(NativeText.text("profile.photo.preparing")).font(.subheadline).accessibilityIdentifier("profile-photo-preparing") }
            if hasPhoto {
                Button(role: .destructive) { photo = nil; edit = .remove; error = nil } label: {
                    Text(NativeText.text("profile.photo.remove")).font(.subheadline.weight(.medium)).frame(minHeight: 44)
                }.disabled(busy || preparing).accessibilityIdentifier("profile-photo-remove")
            }
            #if DEBUG
            if ProcessInfo.processInfo.arguments.contains("--profile-photo-fixture") {
                Button("Choose sample photo") {
                    Task { @MainActor in
                        preparing = true; error = nil
                        defer { preparing = false }
                        do {
                            let data = UIGraphicsImageRenderer(size: CGSize(width: 96, height: 96)).pngData { context in
                                UIColor.systemTeal.setFill(); context.fill(CGRect(x: 0, y: 0, width: 96, height: 96))
                            }
                            try await prepare(data)
                        } catch { self.error = NativeText.text("profile.photo.error") }
                    }
                }.accessibilityIdentifier("profile-photo-test-select").disabled(busy || preparing)
            }
            #endif
        }.buttonStyle(.borderless).frame(maxWidth: .infinity, alignment: .leading)
    }
    @MainActor private func prepare(_ data: Data) async throws {
        let result = try await Task.detached(priority: .userInitiated) { try ProfilePhoto.prepare(data) }.value
        try Task.checkCancellation()
        edit = .jpeg(result)
    }
}
