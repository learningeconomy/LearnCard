import Foundation

/// Device-local day periods. Greetings match the web dashboard; the illustration
/// distinguishes dusk from night without claiming to know actual sunset/weather.
public struct LocalDaytime: Equatable, Sendable {
    public enum Sky: String, CaseIterable, Sendable { case morning, afternoon, dusk, night }
    public enum Greeting: String, CaseIterable, Sendable { case morning, afternoon, evening, hello }
    public let sky: Sky
    public let greeting: Greeting

    public init(date: Date, calendar: Calendar = .current) {
        let hour = calendar.component(.hour, from: date)
        switch hour {
        case 6..<12: sky = .morning; greeting = .morning
        case 12..<18: sky = .afternoon; greeting = .afternoon
        case 18..<21: sky = .dusk; greeting = .evening
        default: sky = .night; greeting = hour < 6 ? .hello : .evening
        }
    }
}

/// The rare cameo is chosen once, not by an animation tick. The UI retains one
/// policy across its tabs for this process; it stores no account information.
public struct SkyCameoPolicy: Sendable {
    public enum Cameo: Int, Sendable { case none, cow, twoCows }
    public private(set) var lastAppearance: Date?
    public static let cooldown: TimeInterval = 600
    public init() {}

    /// Uniform roll 0..<1000: 1.8% one cow, 0.2% two, with a ten-minute cooldown.
    public mutating func choose(roll: Int, at date: Date) -> Cameo {
        guard (0..<20).contains(roll),
              lastAppearance.map({ date.timeIntervalSince($0) >= Self.cooldown }) ?? true else { return .none }
        lastAppearance = date
        return roll < 2 ? .twoCows : .cow
    }
}

/// Latches the day period/cameo for the entire pull and actual refresh lifetime.
public struct RefreshSkyCycle: Sendable {
    public struct Scene: Equatable, Sendable {
        public let sky: LocalDaytime.Sky
        public let cameo: SkyCameoPolicy.Cameo
    }
    public private(set) var scene: Scene?
    public init() {}
    public mutating func begin(sky: LocalDaytime.Sky, cameo: SkyCameoPolicy.Cameo) {
        guard scene == nil else { return }
        scene = Scene(sky: sky, cameo: cameo)
    }
    public mutating func end() { scene = nil }
}

/// Normalized decorative motion, independent of scroll geometry or operation
/// duration. The first frame is complete; wrap points are outside the viewport.
public enum SkyMotion {
    public struct Pose: Equatable, Sendable {
        public let x: Double, y: Double, tilt: Double, wing: Double
    }
    /// A shared 3.6-second left-to-right pulse. Objects sample their horizontal
    /// position so the whole scene moves in a wave rather than bouncing in sync.
    public static func wave(elapsed: Double, position: Double, animated: Bool) -> Double {
        let t = animated && elapsed.isFinite ? max(0, elapsed) : 0
        let x = position.isFinite ? position : 0
        return sin(t * (2 * .pi / 3.6) - x * .pi * 1.6)
    }
    public static func pose(elapsed: Double, animated: Bool, secondCow: Bool = false) -> Pose {
        let t = animated && elapsed.isFinite ? max(0, elapsed) : 0
        let travel = (0.57 + t / 52).truncatingRemainder(dividingBy: 1)
        let x = secondCow ? 0.19 + sin(t / 13) * 0.06 : travel * 1.3 - 0.15
        let pulse = wave(elapsed: t, position: x, animated: animated)
        return Pose(x: x, y: (secondCow ? 0.38 : 0.52) + pulse * (secondCow ? 0.045 : 0.065),
                    tilt: pulse * 4, wing: sin(t * 3.4) * 0.18)
    }
}
