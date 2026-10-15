import XCTest
@testable import LearnCardNativeCore

final class BrandMotionTests: XCTestCase {
    func testPiecesGatherIntoRecognizableMosaicWithoutWaitingOnAccountReadiness() {
        for index in 0..<9 {
            let final = BrandMotion.tile(index, elapsed: 2.1, animated: true)
            let still = BrandMotion.tile(index, elapsed: 0, animated: false)
            XCTAssertEqual(final.x, still.x, accuracy: 0.001)
            XCTAssertEqual(final.y, still.y, accuracy: 0.001)
            XCTAssertEqual(final.rotation, 0, accuracy: 0.001)
            XCTAssertEqual(final.opacity, 1)
        }
        XCTAssertNotEqual(BrandMotion.tile(0, elapsed: 0.1, animated: true), BrandMotion.tile(0, elapsed: 1, animated: true))
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
