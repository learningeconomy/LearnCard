import Foundation

/// Compact, deterministic refresh poses in points; no operation timing policy.
public enum RefreshMotion {
    public struct Tile: Equatable, Sendable {
        public let x: Double, y: Double, rotation: Double, scale: Double
    }

    public static func tile(_ index: Int, pull: Double, elapsed: Double, refreshing: Bool, animated: Bool) -> Tile {
        let index = min(8, max(0, index))
        let column = Double(index % 3 - 1), row = Double(index / 3 - 1)
        let still = Tile(x: column * 12, y: row * 12, rotation: 0, scale: 1)
        guard animated else { return still }
        if !refreshing {
            let progress = pull.isFinite ? min(1, max(0, pull)) : 0
            let stretch = 1 - progress
            return Tile(x: still.x * (1 + 0.25 * stretch),
                        y: still.y * (1 + 0.35 * stretch),
                        rotation: (column - row) * 8 * stretch,
                        scale: 0.7 + 0.3 * progress)
        }
        let time = elapsed.isFinite ? max(0, elapsed) : 0
        // A diagonal wave lifts each tile in turn, then rests. Center L stays legible.
        let phase = (time.truncatingRemainder(dividingBy: 1.35) / 1.35 - Double(index % 3 + index / 3) * 0.075 + 1)
            .truncatingRemainder(dividingBy: 1)
        let wave = phase < 0.42 ? sin(phase / 0.42 * .pi) : 0
        let amount = index == 4 ? 0.4 : 1.0
        return Tile(x: still.x, y: still.y - wave * 3.5 * amount,
                    rotation: sin(wave * .pi) * column * 6 * amount,
                    scale: 1 + wave * 0.12 * amount)
    }
}
