import Foundation
import CoreGraphics

/// Artwork can occupy only the visible space above the scroll content. The
/// control and viewport come from UIKit; no refresh height or inset is assumed.
public struct RefreshReveal: Equatable, Sendable {
    public let frame: CGRect
    public let opacity: Double

    public init(control: CGRect, viewport: CGRect, contentTop: Double) {
        guard !control.isEmpty, !viewport.isEmpty, contentTop.isFinite,
              [control.minX, control.minY, control.width, control.height,
               viewport.minX, viewport.minY, viewport.width, viewport.height].allSatisfy(\.isFinite) else {
            frame = .zero; opacity = 0; return
        }
        let aboveContent = CGRect(x: control.minX, y: control.minY, width: control.width,
                                  height: max(0, contentTop - control.minY))
        let exposed = control.intersection(viewport).intersection(aboveContent)
        guard !exposed.isNull, !exposed.isEmpty else { frame = .zero; opacity = 0; return }
        frame = exposed
        let progress = min(1, max(0, exposed.height / control.height))
        opacity = progress * progress * (3 - 2 * progress)
    }
}

/// A small looping paper-tile wave, never a percentage or completion claim.
public enum InlineLoadingMotion {
    public struct Pose: Equatable, Sendable { public let lift: Double; public let tilt: Double }
    public static func pose(index: Int, elapsed: Double, animated: Bool) -> Pose {
        guard animated, elapsed.isFinite else { return Pose(lift: 0, tilt: Double(index - 1) * 7) }
        let phase = max(0, elapsed) * .pi * 2 / 1.4 - Double(index) * 0.9
        return Pose(lift: sin(phase) * 2.4, tilt: cos(phase) * 12)
    }
}
