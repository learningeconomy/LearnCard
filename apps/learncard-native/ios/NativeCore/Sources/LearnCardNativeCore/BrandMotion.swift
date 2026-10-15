import Foundation

/// Normalized transforms for the nine original logo pieces. No timers or account state.
public enum BrandMotion {
    public struct Tile: Equatable, Sendable {
        public let x: Double, y: Double, rotation: Double, scale: Double, opacity: Double
    }
    public static func isAnimated(visible: Bool, active: Bool, reduced: Bool, voiceOver: Bool) -> Bool {
        visible && active && !reduced && !voiceOver
    }
    public static func tile(_ index: Int, elapsed: Double, animated: Bool) -> Tile {
        let index = min(8, max(0, index))
        let targetX = Double(index % 3 - 1) * 0.327
        let targetY = Double(index / 3 - 1) * 0.327
        guard animated else { return Tile(x: targetX, y: targetY, rotation: 0, scale: 1, opacity: 1) }
        let time = elapsed.isFinite ? max(0, elapsed) : 2.2
        let local = min(1, max(0, (time - Double(index) * 0.045) / 1.55))
        let progress = 1 - pow(1 - local, 3)
        let angle = Double(index) * 2.39996 + time * 0.7 * (1 - progress)
        let radius = index == 4 ? 0 : 0.8 + Double(index % 3) * 0.12
        let life = min(1, max(0, (time - 2.2) / 0.4)) * (index == 4 ? 0.4 : 1)
        let frame = floor(max(0, time - 2.2) * 5)
        let jitterX = noise(frame, seed: index * 3) * 0.007 * life
        let jitterY = noise(frame, seed: index * 3 + 1) * 0.006 * life
        let jitterAngle = noise(frame, seed: index * 3 + 2) * 1.15 * life
        return Tile(x: cos(angle) * radius * (1 - progress) + targetX * progress + jitterX,
                    y: sin(angle) * radius * (1 - progress) + targetY * progress + jitterY,
                    rotation: (1 - progress) * (index.isMultiple(of: 2) ? 44 : -42) + jitterAngle,
                    scale: 0.78 + progress * 0.22,
                    opacity: min(1, max(0, local * 5)))
    }

    /// Stable held poses, rather than smooth shaking or random values on every render.
    private static func noise(_ frame: Double, seed: Int) -> Double {
        let value = sin(frame * 12.9898 + Double(seed + 1) * 78.233) * 43758.5453
        return (value - floor(value)) * 2 - 1
    }

    /// Smooth independent paths in the outer corridors; never sweep across the status copy.
    public static func background(_ index: Int, elapsed: Double, animated: Bool) -> Tile {
        let anchors: [(Double, Double)] = [(-0.01,0.1),(0.83,0.1),(1.02,0.4),(-0.015,0.52),(0.99,0.78),(0.14,0.97),(0.78,0.95),(0.015,0.82)]
        let index = min(7, max(0, index)), anchor = anchors[index]
        guard animated else { return Tile(x: anchor.0, y: anchor.1, rotation: Double(index * 17), scale: 1, opacity: 1) }
        let time = elapsed.isFinite ? max(0, elapsed) : 0
        let phase = Double(index) * 1.8, angle = time * (2 * .pi / (18 + Double(index) * 1.7)) + phase
        let side = [0,2,3,4,7].contains(index)
        let dx = side ? 0.04 : 0.1
        return Tile(x: anchor.0 + sin(angle) * dx,
                    y: anchor.1 + cos(angle * 0.83 + phase) * (side ? 0.095 : 0.07),
                    rotation: Double(index * 17) + sin(angle * 0.73) * 18,
                    scale: 1, opacity: 1)
    }
}
