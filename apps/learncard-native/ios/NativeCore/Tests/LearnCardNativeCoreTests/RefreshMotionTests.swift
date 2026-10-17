import XCTest
@testable import LearnCardNativeCore

final class RefreshMotionTests: XCTestCase {
    func testPullGathersCurveWithoutAReleaseJumpAndInvalidInputsStayFinite() {
        for index in 0..<RefreshMotion.tileCount {
            let released = RefreshMotion.tile(index, pull: 1, elapsed: 0, refreshing: false, animated: true)
            XCTAssertEqual(released, RefreshMotion.tile(index, pull: 0, elapsed: 0, refreshing: true, animated: true))
            for pull in [-10.0, 0, 0.3, 1, 900, .infinity, .nan] {
                let pose = RefreshMotion.tile(index, pull: pull, elapsed: .nan, refreshing: false, animated: true)
                XCTAssertTrue(pose.x.isFinite && pose.y.isFinite && pose.rotation.isFinite && pose.depth.isFinite)
                XCTAssertTrue((0.48...1.04).contains(pose.scale))
                XCTAssertLessThanOrEqual(abs(pose.x), 26)
                XCTAssertLessThanOrEqual(abs(pose.y), 11.5)
            }
        }
        XCTAssertEqual(RefreshMotion.tile(-1, pull: 1, elapsed: 0, refreshing: false, animated: true),
                       RefreshMotion.tile(0, pull: 1, elapsed: 0, refreshing: false, animated: true))
    }

    func testReducedMotionKeepsTheSameFullSizeCurveThroughoutPullAndRefresh() {
        for index in 0..<RefreshMotion.tileCount {
            let still = RefreshMotion.tile(index, pull: 0, elapsed: 0, refreshing: false, animated: false)
            XCTAssertTrue((0.68...1.04).contains(still.scale))
            for time in [0.0, 0.3, RefreshMotion.period, 900, .infinity, .nan] {
                XCTAssertEqual(still, RefreshMotion.tile(index, pull: 0.8, elapsed: time, refreshing: true, animated: false))
            }
        }
    }

    func testWeaveHasOverUnderDepthAndLoopsContinuouslyWithinTheNativeControl() {
        for index in 0..<RefreshMotion.tileCount {
            let first = RefreshMotion.tile(index, pull: 1, elapsed: 0, refreshing: true, animated: true)
            XCTAssertEqual(first, RefreshMotion.tile(index, pull: 1, elapsed: RefreshMotion.period, refreshing: true, animated: true))
            let before = RefreshMotion.tile(index, pull: 1, elapsed: RefreshMotion.period - 0.000001, refreshing: true, animated: true)
            let after = RefreshMotion.tile(index, pull: 1, elapsed: 0.000001, refreshing: true, animated: true)
            XCTAssertEqual(before.x, after.x, accuracy: 0.001)
            XCTAssertEqual(before.y, after.y, accuracy: 0.001)
            XCTAssertEqual(before.rotation, after.rotation, accuracy: 0.001)
            for tick in 0..<200 {
                let pose = RefreshMotion.tile(index, pull: 1, elapsed: Double(tick) / 30, refreshing: true, animated: true)
                XCTAssertLessThanOrEqual(abs(pose.x), 23)
                XCTAssertLessThanOrEqual(abs(pose.y), 8.5)
                XCTAssertTrue((0.68...1.04).contains(pose.scale))
                XCTAssertTrue((0...1).contains(pose.depth))
            }
        }
        let crossing = RefreshMotion.period * 0.95
        let front = RefreshMotion.tile(0, pull: 1, elapsed: crossing, refreshing: true, animated: true)
        let back = RefreshMotion.tile(4, pull: 1, elapsed: crossing, refreshing: true, animated: true)
        XCTAssertEqual(front.x, back.x, accuracy: 0.001)
        XCTAssertEqual(front.y, back.y, accuracy: 0.001)
        XCTAssertGreaterThan(front.depth - back.depth, 0.9)
        XCTAssertGreaterThan(front.scale - back.scale, 0.3)
    }
}
