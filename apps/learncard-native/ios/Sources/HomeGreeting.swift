import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

/// Only the greeting observes the clock, keeping time updates out of the native
/// refresh action's owner. Foreground/significant-time changes restart the clock.
struct HomeGreeting: View {
    @Environment(\.scenePhase) private var scenePhase
    @State private var clockRevision = 0
    let name: String?

    var body: some View {
        TimelineView(.periodic(from: .now, by: 30)) { tick in
            let day = LocalDaytime(date: SkyReviewClock.date(tick.date))
            let name = name?.trimmingCharacters(in: .whitespacesAndNewlines)
            let key = "home.time.\(day.greeting.rawValue)"
            Text(name.flatMap { $0.isEmpty ? nil : NativeText.format(key + ".name", "\u{2068}\($0)\u{2069}") } ?? NativeText.text(key))
                .font(.title3).foregroundStyle(Palette.secondary)
                .accessibilityIdentifier("home-greeting")
        }.id(clockRevision)
            .onChange(of: scenePhase) { _, phase in if phase == .active { clockRevision += 1 } }
            .onReceive(NotificationCenter.default.publisher(for: UIApplication.significantTimeChangeNotification)) { _ in clockRevision += 1 }
            .onReceive(NotificationCenter.default.publisher(for: .NSSystemTimeZoneDidChange)) { _ in clockRevision += 1 }
    }
}

/// Deterministic scene review is available only in Debug demo launches.
enum SkyReviewClock {
    static func date(_ now: Date) -> Date {
        #if DEBUG
        let args = ProcessInfo.processInfo.arguments
        if args.contains("--demo"), let i = args.firstIndex(of: "--sky-phase"), args.indices.contains(i + 1),
           let sky = LocalDaytime.Sky(rawValue: args[i + 1]) {
            let hour: Int = switch sky { case .morning: 8; case .afternoon: 14; case .dusk: 19; case .night: 23 }
            return Calendar.current.date(bySettingHour: hour, minute: 0, second: 0, of: now) ?? now
        }
        #endif
        return now
    }
    static var cameo: SkyCameoPolicy.Cameo? {
        #if DEBUG
        let args = ProcessInfo.processInfo.arguments
        if args.contains("--demo"), let i = args.firstIndex(of: "--sky-cow"), args.indices.contains(i + 1) {
            switch args[i + 1] { case "one": return .cow; case "two": return .twoCows; case "none": return SkyCameoPolicy.Cameo.none; default: break }
        }
        #endif
        return nil
    }
}
