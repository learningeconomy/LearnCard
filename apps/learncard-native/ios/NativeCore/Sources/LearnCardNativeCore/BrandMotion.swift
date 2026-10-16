import Foundation

/// Normalized transforms for the nine original logo pieces. No timers or account state.
public enum BrandMotion {
    // The launch storyboard generator reads these values for the same first frame.
    public static let markMaxWidth = 224.0
    public static let markWidthFraction = 0.57
    public static let markCenterFraction = 0.365
    public static let wordmarkSize = 32.0
    public static let wordmarkGap = 18.0
    public static let backdropOpacity = 0.8
    public struct BackdropBlock: Equatable, Sendable {
        public let color: Int
        public let x: Double, y: Double, size: Double, rotation: Double
    }
    // The generator bakes these same still poses into launch-safe image assets.
    public static let backdrop: [BackdropBlock] = [
        BackdropBlock(color: 0, x: 0.0, y: 0.1, size: 100, rotation: 0),
        BackdropBlock(color: 2, x: 0.83, y: 0.1, size: 65, rotation: 17),
        BackdropBlock(color: 7, x: 1.02, y: 0.4, size: 65, rotation: 34),
        BackdropBlock(color: 3, x: 0.0, y: 0.52, size: 100, rotation: 51),
        BackdropBlock(color: 8, x: 0.99, y: 0.78, size: 65, rotation: 68),
        BackdropBlock(color: 1, x: 0.14, y: 0.97, size: 65, rotation: 85),
        BackdropBlock(color: 6, x: 0.78, y: 0.95, size: 100, rotation: 102),
        BackdropBlock(color: 5, x: 0.015, y: 0.82, size: 65, rotation: 119),
    ]
    public struct Tile: Equatable, Sendable {
        public let x: Double, y: Double, rotation: Double, scale: Double, opacity: Double
    }
    public static func isAnimated(visible: Bool, active: Bool, reduced: Bool, voiceOver: Bool) -> Bool {
        visible && active && !reduced && !voiceOver
    }
    /// The complete, full-size mark is present from the system launch frame.
    public static func launchTile(_ index: Int) -> Tile {
        let index = min(8, max(0, index))
        return Tile(x: Double(index % 3 - 1) * (21.0 / 65.0),
                    y: Double(index / 3 - 1) * (21.0 / 65.0),
                    rotation: 0, scale: 1, opacity: 1)
    }
    public static func tile(_ index: Int, elapsed: Double, animated: Bool) -> Tile {
        let index = min(8, max(0, index))
        let initial = launchTile(index)
        guard animated else { return initial }
        let time = elapsed.isFinite ? max(0, elapsed) : 0
        // Only the tiny held-pose jiggle eases in; tiles never shrink or gather.
        let life = min(1, time / 0.4) * (index == 4 ? 0.4 : 1)
        let frame = floor(time * 5)
        let jitterX = noise(frame, seed: index * 3) * 0.007 * life
        let jitterY = noise(frame, seed: index * 3 + 1) * 0.006 * life
        let jitterAngle = noise(frame, seed: index * 3 + 2) * 1.15 * life
        return Tile(x: initial.x + jitterX,
                    y: initial.y + jitterY,
                    rotation: jitterAngle,
                    scale: 1,
                    opacity: 1)
    }

    /// Stable held poses, rather than smooth shaking or random values on every render.
    private static func noise(_ frame: Double, seed: Int) -> Double {
        let value = sin(frame * 12.9898 + Double(seed + 1) * 78.233) * 43758.5453
        return (value - floor(value)) * 2 - 1
    }

    /// Smooth independent paths in the outer corridors; never sweep across the status copy.
    public static func background(_ index: Int, elapsed: Double, animated: Bool) -> Tile {
        let index = min(backdrop.count - 1, max(0, index)), anchor = backdrop[index]
        guard animated else { return Tile(x: anchor.x, y: anchor.y, rotation: anchor.rotation, scale: 1, opacity: 1) }
        let time = elapsed.isFinite ? max(0, elapsed) : 0
        let entrance = min(1, time / 1.2)
        let drift = entrance * entrance * (3 - 2 * entrance)
        let phase = Double(index) * 1.8, angle = time * (2 * .pi / (18 + Double(index) * 1.7)) + phase
        let side = [0,2,3,4,7].contains(index)
        let dx = side ? 0.04 : 0.1
        return Tile(x: anchor.x + sin(angle) * dx * drift,
                    y: anchor.y + cos(angle * 0.83 + phase) * (side ? 0.095 : 0.07) * drift,
                    rotation: anchor.rotation + sin(angle * 0.73) * 18 * drift,
                    scale: 1, opacity: 1)
    }
}
