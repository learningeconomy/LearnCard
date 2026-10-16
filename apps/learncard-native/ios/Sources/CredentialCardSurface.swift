import SwiftUI

/// Light and pressed contours belong to the card, so they tilt with its surface.
/// Category colors stay opaque and the title area stays clear of decoration.
struct CredentialCardSurface: View {
    let tint: Color
    var reflectionPosition: Double? = nil

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                tint
                LinearGradient(stops: [
                    .init(color: .white.opacity(0.25), location: 0),
                    .init(color: .white.opacity(0.04), location: 0.42),
                    .init(color: .clear, location: 0.64),
                    .init(color: Palette.cardInk.opacity(0.11), location: 1)
                ], startPoint: .topLeading, endPoint: .bottomTrailing)
                RadialGradient(colors: [.white.opacity(0.22), .clear],
                               center: .topLeading, startRadius: 0,
                               endRadius: geometry.size.width * 0.85)
                CardCornerContours()
                    .stroke(Palette.cardInk.opacity(0.09), lineWidth: 1.4)
                    .offset(y: 1)
                CardCornerContours().stroke(.white.opacity(0.42), lineWidth: 1.2)
            }
            .overlay {
                // Keep the reflection behind artwork and labels, preserving their contrast.
                if let reflectionPosition {
                    Rectangle()
                        .fill(LinearGradient(stops: [
                            .init(color: .clear, location: 0),
                            .init(color: .white.opacity(0.12), location: 0.27),
                            .init(color: .white.opacity(0.44), location: 0.48),
                            .init(color: .white.opacity(0.30), location: 0.55),
                            .init(color: .white.opacity(0.06), location: 0.75),
                            .init(color: .clear, location: 1)
                        ], startPoint: .leading, endPoint: .trailing))
                        .frame(width: geometry.size.width * 0.42, height: geometry.size.height * 2)
                        .rotationEffect(.degrees(-24))
                        .position(x: geometry.size.width * (-0.29 + reflectionPosition * 1.75),
                                  y: geometry.size.height * 0.5)
                }
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

private struct CardCornerContours: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        // Cropped concentric rings read as shallow embossing, not extra card content.
        for radius in [0.20, 0.29] {
            let size = rect.height * radius
            path.move(to: CGPoint(x: rect.maxX, y: rect.minY + size))
            path.addArc(center: CGPoint(x: rect.maxX, y: rect.minY), radius: size,
                        startAngle: .degrees(90), endAngle: .degrees(180), clockwise: false)
            path.move(to: CGPoint(x: rect.minX, y: rect.maxY - size))
            path.addArc(center: CGPoint(x: rect.minX, y: rect.maxY), radius: size,
                        startAngle: .degrees(270), endAngle: .degrees(360), clockwise: false)
        }
        return path
    }
}
