import SwiftUI

/// Small, flat native silhouettes in a 100-point drawing space. Deliberately no
/// textures, generated UI pixels, shading, repeated logos or particle confetti.
enum SkyVisitors {
    private static let ink = Palette.cardInk
    private static let cream = Palette.skyCloud
    private static let pigments = [Palette.tealCard, Palette.portfolioCard, Palette.pinkCard, Palette.cyanCard, Palette.lilacCard]
    private static func fill(_ c: inout GraphicsContext, _ path: Path, _ color: Color, outlined: Bool = false) {
        c.fill(path, with: .color(color))
        if outlined { c.stroke(path, with: .color(ink), style: StrokeStyle(lineWidth: 2.2, lineJoin: .round)) }
    }
    private static func polygon(_ points: [CGPoint]) -> Path {
        Path { p in p.addLines(points); p.closeSubpath() }
    }
    private static func line(_ c: inout GraphicsContext, _ points: [CGPoint], color: Color = ink, width: CGFloat = 2) {
        var path = Path(); path.addLines(points)
        c.stroke(path, with: .color(color), style: StrokeStyle(lineWidth: width, lineCap: .round, lineJoin: .round))
    }

    static func bird(context c: inout GraphicsContext, wing: Double) {
        fill(&c, polygon([CGPoint(x: 18, y: 56), CGPoint(x: 3, y: 47), CGPoint(x: 5, y: 66), CGPoint(x: 27, y: 61)]), Palette.tealCard)
        fill(&c, Path(ellipseIn: CGRect(x: 20, y: 40, width: 53, height: 32)), Palette.studiesCard)
        fill(&c, Path(ellipseIn: CGRect(x: 60, y: 32, width: 27, height: 27)), Palette.tealCard)
        fill(&c, polygon([CGPoint(x: 85, y: 41), CGPoint(x: 97, y: 47), CGPoint(x: 84, y: 49)]), Palette.portfolioCard)
        var feather = Path()
        feather.move(to: CGPoint(x: 53, y: 53))
        feather.addQuadCurve(to: CGPoint(x: 32, y: 12 + CGFloat(wing) * 30), control: CGPoint(x: 26, y: 47))
        feather.addQuadCurve(to: CGPoint(x: 66, y: 48), control: CGPoint(x: 67, y: 20))
        feather.closeSubpath(); fill(&c, feather, ink)
        fill(&c, Path(ellipseIn: CGRect(x: 77, y: 40, width: 2.4, height: 2.4)), ink)
    }
    static func balloon(context c: inout GraphicsContext) {
        var canopy = Path()
        canopy.move(to: CGPoint(x: 41, y: 70))
        canopy.addCurve(to: CGPoint(x: 10, y: 31), control1: CGPoint(x: 34, y: 54), control2: CGPoint(x: 9, y: 56))
        canopy.addCurve(to: CGPoint(x: 90, y: 31), control1: CGPoint(x: 10, y: -7), control2: CGPoint(x: 90, y: -7))
        canopy.addCurve(to: CGPoint(x: 59, y: 70), control1: CGPoint(x: 91, y: 56), control2: CGPoint(x: 66, y: 54))
        canopy.closeSubpath()
        var colored = c; colored.clip(to: canopy)
        for i in 0..<5 {
            fill(&colored, Path(CGRect(x: 9 + CGFloat(i) * 16.5, y: 0, width: 18, height: 72)), pigments[i])
        }
        c.stroke(canopy, with: .color(ink), style: StrokeStyle(lineWidth: 2))
        line(&c, [CGPoint(x: 40, y: 67), CGPoint(x: 43, y: 83), CGPoint(x: 57, y: 83), CGPoint(x: 60, y: 67)])
        fill(&c, Path(roundedRect: CGRect(x: 40, y: 82, width: 20, height: 12), cornerRadius: 2), ink)
    }
    static func plane(context c: inout GraphicsContext) {
        line(&c, [CGPoint(x: -26, y: 68), CGPoint(x: 1, y: 58)], color: cream, width: 2)
        let body = polygon([CGPoint(x: 9, y: 50), CGPoint(x: 35, y: 48), CGPoint(x: 53, y: 21), CGPoint(x: 66, y: 20),
                            CGPoint(x: 58, y: 45), CGPoint(x: 87, y: 35), CGPoint(x: 97, y: 40), CGPoint(x: 87, y: 49),
                            CGPoint(x: 55, y: 59), CGPoint(x: 42, y: 83), CGPoint(x: 32, y: 83), CGPoint(x: 37, y: 63),
                            CGPoint(x: 16, y: 64)])
        fill(&c, body, cream)
        fill(&c, polygon([CGPoint(x: 17, y: 54), CGPoint(x: 8, y: 33), CGPoint(x: 17, y: 31), CGPoint(x: 34, y: 51)]), Palette.flairBlue)
        line(&c, [CGPoint(x: 18, y: 56), CGPoint(x: 34, y: 52)], color: Palette.flairPink, width: 4)
        for i in 0..<3 { fill(&c, Path(ellipseIn: CGRect(x: CGFloat(67 + i * 6), y: CGFloat(43 - i * 2), width: 2.5, height: 2.5)), ink) }
    }
    static func ufo(context c: inout GraphicsContext) {
        fill(&c, Path(ellipseIn: CGRect(x: 31, y: 16, width: 42, height: 46)), Palette.tealCard, outlined: true)
        var saucer = Path()
        saucer.move(to: CGPoint(x: 8, y: 59))
        saucer.addQuadCurve(to: CGPoint(x: 90, y: 51), control: CGPoint(x: 40, y: 23))
        saucer.addQuadCurve(to: CGPoint(x: 8, y: 59), control: CGPoint(x: 93, y: 89))
        saucer.closeSubpath(); fill(&c, saucer, cream, outlined: true)
        for (i, color) in [Palette.portfolioCard, Palette.pinkCard, Palette.cyanCard].enumerated() {
            fill(&c, Path(ellipseIn: CGRect(x: CGFloat(26 + i * 20), y: CGFloat(52 - i * 3), width: 11, height: 11)), color, outlined: true)
        }
    }
    static func cow(context c: inout GraphicsContext) {
        var canopy = Path()
        canopy.move(to: CGPoint(x: 9, y: 31))
        canopy.addCurve(to: CGPoint(x: 91, y: 31), control1: CGPoint(x: 14, y: -4), control2: CGPoint(x: 86, y: -4))
        canopy.addQuadCurve(to: CGPoint(x: 9, y: 31), control: CGPoint(x: 50, y: 23))
        canopy.closeSubpath()
        var colored = c; colored.clip(to: canopy)
        for i in 0..<5 { fill(&colored, Path(CGRect(x: 9 + CGFloat(i) * 16.5, y: 0, width: 18, height: 33)), pigments[i]) }
        c.stroke(canopy, with: .color(ink), lineWidth: 1.8)
        for x in [17.0, 35, 65, 83] { line(&c, [CGPoint(x: x, y: 30), CGPoint(x: 51, y: 64)], width: 1.6) }
        for x in [32.0, 44, 57, 67] { line(&c, [CGPoint(x: x, y: 79), CGPoint(x: x - 1, y: 92)], width: 4) }
        fill(&c, Path(roundedRect: CGRect(x: 24, y: 63, width: 49, height: 22), cornerRadius: 9), cream, outlined: true)
        for rect in [CGRect(x: 28, y: 63, width: 13, height: 10), CGRect(x: 44, y: 73, width: 11, height: 9), CGRect(x: 57, y: 65, width: 10, height: 9)] {
            fill(&c, Path(ellipseIn: rect), ink)
        }
        fill(&c, Path(ellipseIn: CGRect(x: 65, y: 55, width: 18, height: 22)), cream, outlined: true)
        fill(&c, Path(ellipseIn: CGRect(x: 63, y: 69, width: 22, height: 10)), Palette.pinkCard)
        line(&c, [CGPoint(x: 65, y: 56), CGPoint(x: 60, y: 52)], width: 3)
        line(&c, [CGPoint(x: 79, y: 55), CGPoint(x: 83, y: 51)], width: 3)
        fill(&c, Path(ellipseIn: CGRect(x: 75, y: 61, width: 2.2, height: 2.2)), ink)
        line(&c, [CGPoint(x: 24, y: 70), CGPoint(x: 18, y: 65), CGPoint(x: 15, y: 69)], width: 2)
    }
}
