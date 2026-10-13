import Foundation

public enum NativeLanguage: String, CaseIterable, Identifiable, Sendable {
    case system, en, es, fr, ar
    public static let preferenceKey = "learncard.native.language"
    public var id: String { rawValue }
    public var name: String {
        switch self {
        case .system: NativeText.text("language.system")
        case .en: "English"
        case .es: "Español"
        case .fr: "Français"
        case .ar: "العربية"
        }
    }
    public var resolvedCode: String {
        if self != .system { return rawValue }
        let preferred = Locale.preferredLanguages.first ?? "en"
        let code = Locale(identifier: preferred).language.languageCode?.identifier ?? "en"
        return ["en", "es", "fr", "ar"].contains(code) ? code : "en"
    }
    public var locale: Locale { Locale(identifier: resolvedCode) }
    public var isRightToLeft: Bool { resolvedCode == "ar" }
    public static var selected: NativeLanguage {
        NativeLanguage(rawValue: UserDefaults.standard.string(forKey: preferenceKey) ?? "system") ?? .system
    }
}

/// Native String Catalog output, generated for SwiftPM as localized .strings/.stringsdict.
/// Keys stay stable and publisher/credential content is never passed through this lookup.
public enum NativeText {
    public static func text(_ key: String, language: NativeLanguage? = nil) -> String {
        let code = (language ?? .selected).resolvedCode
        let path = Bundle.module.path(forResource: code, ofType: "lproj")
        let bundle = path.flatMap(Bundle.init(path:)) ?? Bundle.module
        return bundle.localizedString(forKey: key, value: english[key] ?? key, table: "Localizable")
    }
    public static func literal(_ source: String, language: NativeLanguage? = nil) -> String {
        guard let key = english.first(where: { $0.value == source })?.key else { return source }
        return text(key, language: language)
    }
    public static func format(_ key: String, _ values: String..., language: NativeLanguage? = nil) -> String {
        String(format: text(key, language: language), locale: (language ?? .selected).locale,
               arguments: values.map { $0 as NSString })
    }
    public static func count(_ key: String, _ count: Int, language: NativeLanguage? = nil) -> String {
        String(format: text(key, language: language), locale: (language ?? .selected).locale, arguments: [Int64(count)])
    }
    private static let english: [String: String] = {
        guard let url = Bundle.module.url(forResource: "native-english", withExtension: "json"),
              let data = try? Data(contentsOf: url), let values = try? JSONDecoder().decode([String: String].self, from: data) else { return [:] }
        return values
    }()
}
