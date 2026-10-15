import Foundation

private final class RejectArtworkRedirects: NSObject, URLSessionTaskDelegate, @unchecked Sendable {
    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse,
                    newRequest request: URLRequest, completionHandler: @escaping @Sendable (URLRequest?) -> Void) { completionHandler(nil) }
}

/// Uses the same Filestack tenant provider as the web builder. Never forwards account auth.
public enum ArtworkUploader {
    public static func upload(jpeg: Data, filename: String = "credential-artwork.jpg") async throws -> URL {
        guard !jpeg.isEmpty, jpeg.count <= 1_000_000 else { throw AccountError.unavailable }
        let configData = try Data(contentsOf: Bundle.module.url(forResource: "account-config", withExtension: "json")!)
        let config = try JSONSerialization.jsonObject(with: configData) as? [String: String]
        guard let key = config?["imageUploadAPIKey"], !key.isEmpty else { throw AccountError.unavailable }
        var address = URLComponents(string: "https://www.filestackapi.com/api/store/S3")!
        address.queryItems = [URLQueryItem(name: "key", value: key), URLQueryItem(name: "filename", value: filename)]
        var request = URLRequest(url: address.url!)
        request.httpMethod = "POST"; request.httpBody = jpeg
        request.setValue("image/jpeg", forHTTPHeaderField: "Content-Type")
        let settings = URLSessionConfiguration.ephemeral
        settings.httpCookieStorage = nil; settings.httpShouldSetCookies = false; settings.urlCredentialStorage = nil
        settings.timeoutIntervalForRequest = 30; settings.timeoutIntervalForResource = 45
        let session = URLSession(configuration: settings, delegate: RejectArtworkRedirects(), delegateQueue: nil)
        defer { session.invalidateAndCancel() }
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode), data.count <= 65_536,
              let reply = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let text = reply["url"] as? String, let url = URL(string: text), url.scheme == "https",
              url.host == "cdn.filestackcontent.com", url.user == nil, url.password == nil else { throw AccountError.connection }
        return url
    }
}
