import SwiftUI
import LearnCardNativeCore

/// Small flat environmental details, independent of the foreground visitor.
/// Stars keep fixed anchors; only their brightness changes. Streaks are linear.
enum SkyAtmosphere {
    static func night(context: inout GraphicsContext, size: CGSize, elapsed: Double) {
        let anchors: [(CGFloat, CGFloat)] = [(0.05, 0.22), (0.13, 0.65), (0.21, 0.35), (0.31, 0.77),
            (0.37, 0.16), (0.46, 0.5), (0.55, 0.81), (0.62, 0.2), (0.7, 0.55),
            (0.77, 0.8), (0.89, 0.1), (0.94, 0.7), (0.98, 0.36)]
        stars(context: &context, size: size, elapsed: elapsed, anchors: anchors)
        for second in [false, true] {
            guard let streak = SkyMotion.shootingStar(elapsed: elapsed, animated: true, second: second) else { continue }
            let head = CGPoint(x: size.width * CGFloat(streak.x), y: size.height * CGFloat(streak.y))
            let tail = CGSize(width: size.width * 0.1, height: size.height * 0.124)
            for i in 0..<3 {
                let near = CGFloat(i) / 3, far = CGFloat(i + 1) / 3
                var line = Path()
                line.move(to: CGPoint(x: head.x - tail.width * near, y: head.y - tail.height * near))
                line.addLine(to: CGPoint(x: head.x - tail.width * far, y: head.y - tail.height * far))
                var c = context; c.opacity = streak.opacity * (0.8 - Double(i) * 0.24)
                c.stroke(line, with: .color(.white), style: StrokeStyle(lineWidth: 1.3, lineCap: .round))
            }
            var c = context; c.opacity = streak.opacity
            c.fill(Path(ellipseIn: CGRect(x: head.x - 1.2, y: head.y - 1.2, width: 2.4, height: 2.4)), with: .color(Palette.skyCloud))
        }
    }

    static func dusk(context: inout GraphicsContext, size: CGSize, elapsed: Double) {
        stars(context: &context, size: size, elapsed: elapsed,
              anchors: [(0.08, 0.18), (0.29, 0.26), (0.47, 0.12), (0.73, 0.16), (0.9, 0.44)])
        for second in [false, true] {
            guard let p = SkyMotion.fireworkProgress(elapsed: elapsed, animated: true, second: second) else { continue }
            let center = CGPoint(x: size.width * (second ? 0.66 : 0.22), y: size.height * 0.34)
            let radius = min(size.height * 0.24, 18) * CGFloat(1 - pow(1 - p, 3)) * (second ? 0.75 : 1)
            let colors = [Palette.skyCloud, Palette.portfolioCard, Palette.cyanCard]
            var c = context; c.opacity = min(1, p / 0.12) * pow(1 - p, 0.7)
            for i in 0..<8 {
                let angle = Double(i) * .pi / 4 - .pi / 2
                var ray = Path()
                ray.move(to: CGPoint(x: center.x + CGFloat(cos(angle)) * radius * 0.58, y: center.y + CGFloat(sin(angle)) * radius * 0.58))
                ray.addLine(to: CGPoint(x: center.x + CGFloat(cos(angle)) * radius, y: center.y + CGFloat(sin(angle)) * radius))
                c.stroke(ray, with: .color(colors[i % colors.count]), style: StrokeStyle(lineWidth: 1.5, lineCap: .round))
            }
        }
    }

    static func distantBirds(context: inout GraphicsContext, size: CGSize, elapsed: Double) {
        for (i, x) in [0.17, 0.24].enumerated() {
            let wave = CGFloat(SkyMotion.wave(elapsed: elapsed, position: x, animated: true))
            let center = CGPoint(x: size.width * CGFloat(x), y: size.height * (i == 0 ? 0.2 : 0.31) + wave * 1.5)
            let wing = 2 + wave * 0.7
            var bird = Path()
            bird.move(to: CGPoint(x: center.x - 4, y: center.y - wing))
            bird.addQuadCurve(to: center, control: CGPoint(x: center.x - 1.5, y: center.y - wing))
            bird.addQuadCurve(to: CGPoint(x: center.x + 4, y: center.y - wing), control: CGPoint(x: center.x + 1.5, y: center.y - wing))
            var c = context; c.opacity = 0.38
            c.stroke(bird, with: .color(Palette.cardInk), style: StrokeStyle(lineWidth: 1.2, lineCap: .round))
        }
    }

    private static func stars(context: inout GraphicsContext, size: CGSize, elapsed: Double, anchors: [(CGFloat, CGFloat)]) {
        for (i, anchor) in anchors.enumerated() {
            var c = context; c.opacity = SkyMotion.twinkle(elapsed: elapsed, index: i, animated: true)
            let point = CGPoint(x: anchor.0 * size.width, y: anchor.1 * size.height)
            if i.isMultiple(of: 3) { sparkle(context: &c, at: point, radius: min(3.2, size.height * 0.05)) }
            else { c.fill(Path(ellipseIn: CGRect(x: point.x - 0.9, y: point.y - 0.9, width: 1.8, height: 1.8)), with: .color(.white)) }
        }
    }
    private static func sparkle(context: inout GraphicsContext, at p: CGPoint, radius r: CGFloat) {
        var path = Path()
        path.move(to: CGPoint(x: p.x, y: p.y - r))
        path.addQuadCurve(to: CGPoint(x: p.x + r, y: p.y), control: p)
        path.addQuadCurve(to: CGPoint(x: p.x, y: p.y + r), control: p)
        path.addQuadCurve(to: CGPoint(x: p.x - r, y: p.y), control: p)
        path.addQuadCurve(to: CGPoint(x: p.x, y: p.y - r), control: p)
        context.fill(path, with: .color(Palette.portfolioCard))
    }
}
