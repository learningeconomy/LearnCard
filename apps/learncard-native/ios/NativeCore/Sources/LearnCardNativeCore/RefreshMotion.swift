import Foundation

/// Compact, deterministic refresh poses in points; no operation timing policy.
public enum RefreshMotion {
    public static let tileCount = 8
    public static let period = 3.2

    public struct Tile: Equatable, Sendable {
        public let x: Double, y: Double, rotation: Double, scale: Double, depth: Double
    }

    public static func tile(_ index: Int, pull: Double, elapsed: Double, refreshing: Bool, animated: Bool) -> Tile {
        let index = min(tileCount - 1, max(0, index))
        let time = elapsed.isFinite ? max(0, elapsed) : 0
        let travel = refreshing && animated ? time.truncatingRemainder(dividingBy: period) / period : 0
        let phase = .pi / 10 + (Double(index) / Double(tileCount) + travel) * 2 * .pi
        let depth = (cos(phase) + 1) / 2
        let progress = pull.isFinite ? min(1, max(0, pull)) : 0
        let looseness = animated && !refreshing ? 1 - progress : 0

        // An open figure-eight: opposite tiles cross at different depths. Pulling
        // gathers a loose curve into this same pose, without a release-time jump.
        return Tile(x: sin(phase) * (23 + 3 * looseness),
                    y: sin(2 * phase) * (8.5 + 3 * looseness),
                    rotation: sin(phase) * 22 + cos(2 * phase) * 6
                        + (index.isMultiple(of: 2) ? 10 : -10) * looseness,
                    scale: (0.68 + depth * 0.36) * (1 - 0.28 * looseness), depth: depth)
    }
}
