import XCTest
@testable import LearnCardNativeCore

final class RefreshMotionTests: XCTestCase {
    func testPullAssemblesWithoutOvershootAndInvalidInputsStayFinite() {
        for index in 0..<9 {
            let released = RefreshMotion.tile(index, pull: 1, elapsed: 0, refreshing: false, animated: true)
            XCTAssertEqual(released, RefreshMotion.tile(index, pull: 0, elapsed: 0, refreshing: true, animated: true))
            for pull in [-10.0, 0, 0.3, 1, 900, .infinity, .nan] {
                let pose = RefreshMotion.tile(index, pull: pull, elapsed: .nan, refreshing: false, animated: true)
                XCTAssertTrue(pose.x.isFinite && pose.y.isFinite && pose.rotation.isFinite)
                XCTAssertTrue((0.7...1).contains(pose.scale))
                XCTAssertLessThanOrEqual(abs(pose.y), 16.2 + 0.000001)
            }
        }
    }
    func testReducedMotionKeepsFullReadableMosaicThroughoutPullAndRefresh() {
        for index in 0..<9 {
            let still = RefreshMotion.tile(index, pull: 0, elapsed: 0, refreshing: false, animated: false)
            XCTAssertEqual(still.scale, 1)
            for time in [0.0, 0.3, 1.35, 900, .infinity, .nan] {
                XCTAssertEqual(still, RefreshMotion.tile(index, pull: 0.8, elapsed: time, refreshing: true, animated: false))
            }
        }
    }
    func testRippleIsBoundedDistinctAndLoopsWithoutAJump() {
        XCTAssertNotEqual(RefreshMotion.tile(0, pull: 1, elapsed: 0.2, refreshing: true, animated: true),
                          RefreshMotion.tile(8, pull: 1, elapsed: 0.2, refreshing: true, animated: true))
        for index in 0..<9 {
            let first = RefreshMotion.tile(index, pull: 1, elapsed: 0, refreshing: true, animated: true)
            XCTAssertEqual(first, RefreshMotion.tile(index, pull: 1, elapsed: 1.35, refreshing: true, animated: true))
            for tick in 0..<200 {
                let pose = RefreshMotion.tile(index, pull: 1, elapsed: Double(tick) / 30, refreshing: true, animated: true)
                XCTAssertTrue(pose.x.isFinite && pose.y.isFinite && pose.rotation.isFinite)
                XCTAssertLessThanOrEqual(abs(pose.y - first.y), 3.5)
                XCTAssertTrue((1...1.12).contains(pose.scale))
            }
        }
    }
}
