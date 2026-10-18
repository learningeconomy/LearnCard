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
            SkyAtmosphere.night(context: &context, size: size, elapsed: elapsed)
            let moon = skyPoint(x: 0.84, y: 0.35, size: size, elapsed: elapsed, strength: 0.75)
            let r = min(14, h * 0.19), x = moon.x, y = moon.y
            context.fill(Path(ellipseIn: CGRect(x: x - r, y: y - r, width: r * 2, height: r * 2)), with: .color(Palette.portfolioCard))
            context.fill(Path(ellipseIn: CGRect(x: x - r * 0.28, y: y - r * 1.24, width: r * 2, height: r * 2)), with: .color(fill))
            return
        }
        // Smaller translucent clouds sit behind the main visitor/cloud layer.
        let far = skyPoint(x: sky == .afternoon ? 0.32 : 0.6, y: sky == .afternoon ? 0.4 : 0.2,
                           size: size, elapsed: elapsed, strength: 0.45)
        let low = skyPoint(x: 0.36, y: 0.83, size: size, elapsed: elapsed, strength: 0.6)
        var distant = context; distant.opacity = 0.55
        if sky == .afternoon {
            let sun = skyPoint(x: 0.3, y: 0.26, size: size, elapsed: elapsed, strength: 0.6)
            let r = h * 0.12
            context.fill(Path(ellipseIn: CGRect(x: sun.x - r, y: sun.y - r, width: r * 2, height: r * 2)), with: .color(Palette.portfolioCard))
        }
        cloud(context: &distant, x: far.x, y: far.y, unit: h * 0.3)
        if sky != .dusk {
            cloud(context: &distant, x: low.x, y: low.y, unit: h * 0.26)
            SkyAtmosphere.distantBirds(context: &context, size: size, elapsed: elapsed)
        }
        if sky == .morning {
            let r = min(11, h * 0.15), point = skyPoint(x: 0.4, y: 0.4, size: size, elapsed: elapsed, strength: 0.75)
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
            let sun = skyPoint(x: 0.42, y: 0.87, size: size, elapsed: elapsed, strength: 0.75)
            context.fill(Path(ellipseIn: CGRect(x: sun.x - r, y: sun.y - r, width: r * 2, height: r * 2)), with: .color(Palette.portfolioCard))
            var horizon = Path()
            func edge(_ x: CGFloat, _ y: CGFloat) -> CGPoint {
                CGPoint(x: x * w, y: y * h + CGFloat(SkyMotion.wave(elapsed: elapsed, position: Double(x), animated: true)) * h * 0.025)
            }
            horizon.move(to: edge(0, 0.74))
            horizon.addCurve(to: edge(0.52, 0.99), control1: edge(0.2, 0.58), control2: edge(0.3, 1.1))
            horizon.addCurve(to: edge(1, 0.78), control1: edge(0.72, 0.75), control2: edge(0.84, 0.68))
            horizon.addLine(to: CGPoint(x: w, y: h)); horizon.addLine(to: CGPoint(x: 0, y: h)); horizon.closeSubpath()
            context.fill(horizon, with: .color(Palette.lilacCard))
            SkyAtmosphere.dusk(context: &context, size: size, elapsed: elapsed)
        }
        let left = skyPoint(x: 0.1, y: 0.73, size: size, elapsed: elapsed)
        let right = skyPoint(x: 0.84, y: sky == .dusk ? 0.27 : 0.75, size: size, elapsed: elapsed, strength: 0.85)
        cloud(context: &context, x: left.x, y: left.y, unit: h * 0.6)
        cloud(context: &context, x: right.x, y: right.y, unit: h * 0.44)
    }

    private func skyPoint(x: CGFloat, y: CGFloat, size: CGSize, elapsed: Double, strength: CGFloat = 1) -> CGPoint {
        let pulse = CGFloat(SkyMotion.wave(elapsed: elapsed, position: Double(x), animated: true)) * strength
        return CGPoint(x: x * size.width + pulse * size.width * 0.008,
                       y: y * size.height + pulse * size.height * 0.065)
    }

    private func cloud(context: inout GraphicsContext, x: CGFloat, y: CGFloat, unit: CGFloat) {
        var shape = Path(roundedRect: CGRect(x: x - unit * 0.9, y: y - unit * 0.2, width: unit * 1.8, height: unit * 0.45), cornerRadius: unit * 0.22)
        shape.addEllipse(in: CGRect(x: x - unit * 0.38, y: y - unit * 0.52, width: unit * 0.78, height: unit * 0.78))
        shape.addEllipse(in: CGRect(x: x + unit * 0.15, y: y - unit * 0.34, width: unit * 0.6, height: unit * 0.6))
        context.fill(shape, with: .color(Palette.skyCloud))
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
