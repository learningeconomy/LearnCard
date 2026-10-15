import Foundation

enum AccountReply {
    static func decode<T: Decodable>(_ text: String, method: String) throws -> T {
        let data = Data(text.utf8)
        let envelope = try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
        guard envelope["ok"] as? Bool == true, let value = envelope["value"] else {
            if let code = envelope["error"] as? String, code.hasPrefix("claims:"),
               let failure = ClaimError(rawValue: String(code.dropFirst("claims:".count))) { throw failure }
            if let code = envelope["error"] as? String, code.hasPrefix("consumer:"),
               let failure = ConsumerAppError(rawValue: String(code.dropFirst("consumer:".count))) { throw failure }
            if let code = envelope["error"] as? String, code.hasPrefix("family:"),
               let failure = FamilyError(rawValue: String(code.dropFirst("family:".count))) { throw failure }
            if let code = envelope["error"] as? String, code.hasPrefix("inbox:"),
               let failure = InboxError(rawValue: String(code.dropFirst("inbox:".count))) { throw failure }
            throw method == "recover" ? AccountError.recovery : AccountError.unavailable
        }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { value in
            let text = try value.singleValueContainer().decode(String.self)
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = formatter.date(from: text) { return date }
            formatter.formatOptions = [.withInternetDateTime]
            guard let date = formatter.date(from: text) else { throw AccountError.unavailable }
            return date
        }
        return try decoder.decode(T.self, from: JSONSerialization.data(withJSONObject: value, options: .fragmentsAllowed))
    }

}
