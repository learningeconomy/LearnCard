import Foundation

enum AccountStorageScope {
    static func key(userID: String, id: String?, field: String) throws -> String {
        guard !userID.isEmpty, ["share", "version"].contains(field) else { throw AccountError.identity }
        let base = "sss-device-share:\(userID)"
        let value = id ?? base
        guard value == base || value == "sss-pending-share:\(base)" else { throw AccountError.identity }
        return "sss:learncard:staging:\(userID):\(value):\(field)"
    }
}
