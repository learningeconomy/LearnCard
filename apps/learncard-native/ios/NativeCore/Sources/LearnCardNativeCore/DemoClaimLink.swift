import Foundation

/// Dedicated demo scheme. Real LearnCard links must never silently resolve to sample credentials.
public struct DemoClaimLink: Equatable, Sendable {
    public let offerID: String

    public init(url: URL) throws {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              components.scheme == "learncard-native-demo", components.host == "claim",
              components.user == nil, components.password == nil, components.port == nil,
              components.query == nil, components.fragment == nil else {
            throw ClientError.unsupportedLink
        }
        let path = components.path.split(separator: "/", omittingEmptySubsequences: false)
        guard path.count == 2, path[0].isEmpty,
              ["first-aid", "mentor"].contains(String(path[1])) else {
            throw ClientError.unsupportedLink
        }
        offerID = String(path[1])
    }
}
