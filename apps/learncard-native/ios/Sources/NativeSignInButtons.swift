import SwiftUI
import AuthenticationServices
import LearnCardNativeSDK

struct NativeSignInButtons: View {
    @Environment(\.colorScheme) private var colorScheme
    let account: AccountController
    var body: some View {
        VStack(spacing: 12) {
            if account.signInProviders.contains(.apple) {
                AppleSignInButton(dark: colorScheme == .dark) { Task { await account.signIn(with: .apple) } }
                    .frame(maxWidth: .infinity).frame(height: 54).id(colorScheme)
            }
            if account.signInProviders.contains(.google) {
                Button { Task { await account.signIn(with: .google) } } label: {
                    HStack(spacing: 12) {
                        Image("GoogleSignInMark").resizable().scaledToFit().frame(width: 22, height: 22).accessibilityHidden(true)
                        Text(NativeText.text("oauth.google")).font(.body.weight(.semibold))
                    }.foregroundStyle(Color(red: 0.12, green: 0.12, blue: 0.12))
                        .frame(maxWidth: .infinity, minHeight: 54).padding(.horizontal, 16)
                        .background(.white, in: RoundedRectangle(cornerRadius: 16))
                        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Palette.line, lineWidth: 1))
                }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("sign-in-google")
            }
            HStack(spacing: 12) {
                Rectangle().fill(Palette.line).frame(height: 1)
                Text(NativeText.text("oauth.orEmail")).font(.subheadline).foregroundStyle(Palette.secondary).fixedSize()
                Rectangle().fill(Palette.line).frame(height: 1)
            }.padding(.top, 6)
        }.disabled(account.busy)
    }
}

private struct AppleSignInButton: UIViewRepresentable {
    let dark: Bool
    let action: @MainActor () -> Void
    func makeCoordinator() -> Coordinator { Coordinator(action: action) }
    func makeUIView(context: Context) -> ASAuthorizationAppleIDButton {
        let button = ASAuthorizationAppleIDButton(type: .continue, style: dark ? .white : .black)
        button.cornerRadius = 16
        button.setContentHuggingPriority(.defaultLow, for: .horizontal)
        button.accessibilityIdentifier = "sign-in-apple"
        button.addTarget(context.coordinator, action: #selector(Coordinator.signIn), for: .touchUpInside)
        return button
    }
    func updateUIView(_ uiView: ASAuthorizationAppleIDButton, context: Context) { context.coordinator.action = action }
    @MainActor final class Coordinator: NSObject {
        var action: @MainActor () -> Void
        init(action: @escaping @MainActor () -> Void) { self.action = action }
        @objc func signIn() { action() }
    }
}
