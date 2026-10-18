import SwiftUI
import LearnCardNativeCore

/// Flat native artwork only. UIKit owns the reveal's size and clipping; no
/// lettering, repeated brand mark, layout spacer or fabricated progress.
struct RefreshSkyView: View {
    let sky: LocalDaytime.Sky
    let cameo: SkyCameoPolicy.Cameo
    let began: Date
    let moving: Bool
    var pausedElapsed: TimeInterval = 0

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 30, paused: !moving)) { tick in
            let elapsed = moving ? max(0, tick.date.timeIntervalSince(began)) : pausedElapsed
            Canvas { context, size in
                guard size.width > 0, size.height > 0 else { return }
                drawSky(context: &context, size: size, elapsed: elapsed)
                let pose = SkyMotion.pose(elapsed: elapsed, animated: true)
                let scale = min(size.height * 0.88, 76)
                drawVisitor(context: context, size: size, pose: pose, scale: scale)
                if cameo == .twoCows {
                    drawVisitor(context: context, size: size,
                                pose: SkyMotion.pose(elapsed: elapsed, animated: true, secondCow: true), scale: scale * 0.62)
                }
            }
        }.frame(maxWidth: .infinity, maxHeight: .infinity)
            .clipped().environment(\.layoutDirection, .leftToRight)
            .accessibilityHidden(true)
    }

    private func drawSky(context: inout GraphicsContext, size: CGSize, elapsed: Double) {
        let w = size.width, h = size.height
        let fill: Color = switch sky {
        case .morning: Palette.skyMorning
        case .afternoon: Palette.blueCard
        case .dusk: Palette.pinkCard
        case .night: Palette.cardInk
        }
        context.fill(Path(CGRect(origin: .zero, size: size)), with: .color(fill))
        if sky == .night {
            let stars: [(CGFloat, CGFloat)] = [(0.07, 0.26), (0.22, 0.72), (0.41, 0.2), (0.53, 0.79), (0.71, 0.58), (0.95, 0.3)]
            for (i, star) in stars.enumerated() {
                var c = context
                c.opacity = 0.72 + 0.28 * sin(elapsed / 2 + Double(i) * 1.8)
                let point = CGPoint(x: star.0 * w, y: star.1 * h)
                if i.isMultiple(of: 3) { sparkle(context: &c, at: point, radius: min(4, h * 0.06)) }
                else { c.fill(Path(ellipseIn: CGRect(x: point.x, y: point.y, width: 2.4, height: 2.4)), with: .color(.white)) }
            }
            let r = min(14, h * 0.19), x = w * 0.84, y = h * 0.32
            context.fill(Path(ellipseIn: CGRect(x: x - r, y: y - r, width: r * 2, height: r * 2)), with: .color(Palette.portfolioCard))
            context.fill(Path(ellipseIn: CGRect(x: x - r * 0.28, y: y - r * 1.24, width: r * 2, height: r * 2)), with: .color(fill))
            return
        }
        if sky == .morning {
            let r = min(11, h * 0.15), point = CGPoint(x: w * 0.4, y: h * 0.34)
            context.fill(Path(ellipseIn: CGRect(x: point.x - r, y: point.y - r, width: r * 2, height: r * 2)), with: .color(Palette.portfolioCard))
            for angle in [-2.5, -1.6, -0.65, 0.12] {
                var ray = Path()
                ray.move(to: CGPoint(x: point.x + cos(angle) * (r + 5), y: point.y + sin(angle) * (r + 5)))
                ray.addLine(to: CGPoint(x: point.x + cos(angle) * (r + 10), y: point.y + sin(angle) * (r + 10)))
                context.stroke(ray, with: .color(Palette.cardInk), style: StrokeStyle(lineWidth: 1.7, lineCap: .round))
            }
        }
        if sky == .dusk {
            let r = min(19, h * 0.27)
            context.fill(Path(ellipseIn: CGRect(x: w * 0.42 - r, y: h * 0.87 - r, width: r * 2, height: r * 2)), with: .color(Palette.portfolioCard))
            var horizon = Path()
            horizon.move(to: CGPoint(x: 0, y: h * 0.74))
            horizon.addCurve(to: CGPoint(x: w * 0.52, y: h * 0.99), control1: CGPoint(x: w * 0.2, y: h * 0.58), control2: CGPoint(x: w * 0.3, y: h * 1.1))
            horizon.addCurve(to: CGPoint(x: w, y: h * 0.78), control1: CGPoint(x: w * 0.72, y: h * 0.75), control2: CGPoint(x: w * 0.84, y: h * 0.68))
            horizon.addLine(to: CGPoint(x: w, y: h)); horizon.addLine(to: CGPoint(x: 0, y: h)); horizon.closeSubpath()
            context.fill(horizon, with: .color(Palette.lilacCard))
            sparkle(context: &context, at: CGPoint(x: w * 0.29, y: h * 0.26), radius: min(4, h * 0.07))
            sparkle(context: &context, at: CGPoint(x: w * 0.9, y: h * 0.44), radius: min(3, h * 0.05))
        }
        let drift = sin(elapsed / 12) * w * 0.035
        cloud(context: &context, x: w * 0.1 + drift, y: h * 0.73, unit: h * 0.6)
        cloud(context: &context, x: w * 0.84 - drift * 0.65, y: sky == .dusk ? h * 0.27 : h * 0.75, unit: h * 0.44)
    }

    private func cloud(context: inout GraphicsContext, x: CGFloat, y: CGFloat, unit: CGFloat) {
        var shape = Path(roundedRect: CGRect(x: x - unit * 0.9, y: y - unit * 0.2, width: unit * 1.8, height: unit * 0.45), cornerRadius: unit * 0.22)
        shape.addEllipse(in: CGRect(x: x - unit * 0.38, y: y - unit * 0.52, width: unit * 0.78, height: unit * 0.78))
        shape.addEllipse(in: CGRect(x: x + unit * 0.15, y: y - unit * 0.34, width: unit * 0.6, height: unit * 0.6))
        context.fill(shape, with: .color(Palette.skyCloud))
    }
    private func sparkle(context: inout GraphicsContext, at p: CGPoint, radius r: CGFloat) {
        var path = Path()
        path.move(to: CGPoint(x: p.x, y: p.y - r))
        path.addQuadCurve(to: CGPoint(x: p.x + r, y: p.y), control: p)
        path.addQuadCurve(to: CGPoint(x: p.x, y: p.y + r), control: p)
        path.addQuadCurve(to: CGPoint(x: p.x - r, y: p.y), control: p)
        path.addQuadCurve(to: CGPoint(x: p.x, y: p.y - r), control: p)
        context.fill(path, with: .color(Palette.portfolioCard))
    }
    private func drawVisitor(context: GraphicsContext, size: CGSize, pose: SkyMotion.Pose, scale: CGFloat) {
        var c = context
        c.translateBy(x: size.width * CGFloat(pose.x), y: size.height * CGFloat(pose.y))
        c.rotate(by: .degrees(pose.tilt))
        c.scaleBy(x: scale / 100, y: scale / 100)
        c.translateBy(x: -50, y: -50)
        if cameo != .none { SkyVisitors.cow(context: &c) }
        else {
            switch sky {
            case .morning: SkyVisitors.bird(context: &c, wing: pose.wing)
            case .afternoon: SkyVisitors.balloon(context: &c)
            case .dusk: SkyVisitors.plane(context: &c)
            case .night: SkyVisitors.ufo(context: &c)
            }
        }
    }
}
