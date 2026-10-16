import XCTest
@testable import LearnCardNativeCore

final class BrandMotionTests: XCTestCase {
    func testFirstAnimatedFrameMatchesTheFullyVisibleStaticLaunchComposition() {
        for index in 0..<9 {
            XCTAssertEqual(BrandMotion.tile(index, elapsed: 0, animated: true), BrandMotion.launchTile(index))
        }
        for index in BrandMotion.backdrop.indices {
            XCTAssertEqual(BrandMotion.background(index, elapsed: 0, animated: true), BrandMotion.background(index, elapsed: 0, animated: false))
        }
    }
    func testLogoStartsFullSizeAndNeverNeedsAssemblyTime() {
        for index in 0..<9 {
            let still = BrandMotion.tile(index, elapsed: 0, animated: false)
            XCTAssertEqual(still.x, Double(index % 3 - 1) * 21 / 65)
            XCTAssertEqual(still.y, Double(index / 3 - 1) * 21 / 65)
            for tick in 0...100 {
                let pose = BrandMotion.tile(index, elapsed: Double(tick) * 0.021, animated: true)
                XCTAssertEqual(pose.scale, 1, "Even a very short launch must show full-size tiles")
                XCTAssertEqual(pose.opacity, 1)
                XCTAssertLessThan(abs(pose.x - still.x), 0.008)
                XCTAssertLessThan(abs(pose.y - still.y), 0.007)
            }
        }
        XCTAssertNotEqual(BrandMotion.tile(0, elapsed: 0.41, animated: true), BrandMotion.tile(0, elapsed: 0.61, animated: true),
                          "The gentle jiggle starts without waiting for an assembly sequence")
    }
    func testReducedMotionIsAlwaysFullyAssembledAndTimeIndependent() {
        for index in 0..<9 {
            XCTAssertEqual(BrandMotion.tile(index, elapsed: 0, animated: false), BrandMotion.tile(index, elapsed: 900, animated: false))
            XCTAssertEqual(BrandMotion.tile(index, elapsed: 0, animated: false).opacity, 1)
        }
        for index in 0..<8 { XCTAssertEqual(BrandMotion.background(index, elapsed: 0, animated: false), BrandMotion.background(index, elapsed: 900, animated: false)) }
    }
    func testSettledLogoUsesSmallDistinctHeldStopMotionPoses() {
        for index in 0..<9 {
            let pose = BrandMotion.tile(index, elapsed: 4.01, animated: true)
            XCTAssertEqual(pose, BrandMotion.tile(index, elapsed: 4.03, animated: true))
            XCTAssertNotEqual(pose, BrandMotion.tile(index, elapsed: 4.21, animated: true))
            let still = BrandMotion.tile(index, elapsed: 4, animated: false)
            XCTAssertLessThan(abs(pose.x - still.x), 0.008); XCTAssertLessThan(abs(pose.y - still.y), 0.007)
            XCTAssertLessThan(abs(pose.rotation), 1.2)
        }
    }
    func testBackdropFloatsVisiblyWhileStayingOutsideTheCentralCopy() {
        for index in 0..<8 {
            let start = BrandMotion.background(index, elapsed: 4, animated: true)
            let later = BrandMotion.background(index, elapsed: 8, animated: true)
            XCTAssertGreaterThan(hypot(start.x - later.x, start.y - later.y), 0.015)
            for tick in 0..<120 {
                let pose = BrandMotion.background(index, elapsed: Double(tick), animated: true)
                XCTAssertTrue((-0.12...1.12).contains(pose.x)); XCTAssertTrue((-0.05...1.1).contains(pose.y))
                if [0,3,7].contains(index) { XCTAssertLessThan(pose.x, 0.06) }
                if [2,4].contains(index) { XCTAssertGreaterThan(pose.x, 0.94) }
            }
        }
    }
    func testBackgroundOffscreenAndVoiceOverDisableMotion() {
        XCTAssertTrue(BrandMotion.isAnimated(visible: true, active: true, reduced: false, voiceOver: false))
        XCTAssertFalse(BrandMotion.isAnimated(visible: false, active: true, reduced: false, voiceOver: false))
        XCTAssertFalse(BrandMotion.isAnimated(visible: true, active: false, reduced: false, voiceOver: false))
        XCTAssertFalse(BrandMotion.isAnimated(visible: true, active: true, reduced: true, voiceOver: false))
        XCTAssertFalse(BrandMotion.isAnimated(visible: true, active: true, reduced: false, voiceOver: true))
    }
    func testUnusualTimeAndLongRunningConnectionsKeepTransformsFiniteAndBounded() {
        for elapsed in [-1.0, 0, 0.3, 1, 2, 10, 10_000, .infinity, .nan] {
            for index in 0..<9 {
                let frame = BrandMotion.tile(index, elapsed: elapsed, animated: true)
                for value in [frame.x, frame.y, frame.rotation, frame.scale, frame.opacity] { XCTAssertTrue(value.isFinite) }
                XCTAssertTrue((0...1).contains(frame.opacity)); XCTAssertLessThan(abs(frame.x), 1.5); XCTAssertLessThan(abs(frame.y), 1.5)
            }
        }
    }
}
