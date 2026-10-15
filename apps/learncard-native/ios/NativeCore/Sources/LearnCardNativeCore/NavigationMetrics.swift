import Foundation

/// Navigation uses available logical points, independent of display pixel density.
public struct NavigationMetrics: Equatable, Sendable {
    public let iconSize: Double
    public let minimumItemHeight: Double

    public init(availableWidth: Double) {
        switch availableWidth {
        case ...375: iconSize = 31; minimumItemHeight = 68
        case ...414: iconSize = 36; minimumItemHeight = 74
        default: iconSize = 40; minimumItemHeight = 78
        }
    }
}
