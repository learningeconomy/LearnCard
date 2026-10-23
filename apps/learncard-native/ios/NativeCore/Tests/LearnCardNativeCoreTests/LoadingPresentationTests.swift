import XCTest
import CoreGraphics
@testable import LearnCardNativeCore

final class LoadingPresentationTests: XCTestCase {
    func testArtworkCannotExtendIntoTheHeadingOrOutsideTheViewport() {
        let value = RefreshReveal(control: CGRect(x: 0, y: 0, width: 402, height: 64),
                                  viewport: CGRect(x: 0, y: 20, width: 402, height: 800), contentTop: 52)
        XCTAssertEqual(value.frame, CGRect(x: 0, y: 20, width: 402, height: 32))
        XCTAssertEqual(value.opacity, 0.5, accuracy: 0.0001)
        XCTAssertLessThanOrEqual(value.frame.maxY, 52)
    }
    func testRevealAndCollapseHaveContinuousOpacityAtArbitrarySystemHeights() {
        for height in [43.0, 64, 97] {
            let control = CGRect(x: 0, y: 0, width: 375, height: height)
            var previous = 0.0
            for step in 0...100 {
                let exposed = height * Double(step) / 100
                let value = RefreshReveal(control: control,
                    viewport: CGRect(x: 0, y: height - exposed, width: 375, height: 600), contentTop: height)
                XCTAssertEqual(value.frame.height, exposed, accuracy: 0.0001)
                XCTAssertGreaterThanOrEqual(value.opacity, previous)
                XCTAssertLessThanOrEqual(value.opacity - previous, 0.016)
                previous = value.opacity
            }
            XCTAssertEqual(previous, 1)
        }
    }
    func testOffscreenZeroAndInvalidGeometryNeverShowsArtwork() {
        let control = CGRect(x: 0, y: 0, width: 375, height: 64)
        for value in [RefreshReveal(control: control, viewport: control, contentTop: 0),
                      RefreshReveal(control: control, viewport: CGRect(x: 0, y: 64, width: 375, height: 600), contentTop: 64),
                      RefreshReveal(control: .zero, viewport: control, contentTop: 64),
                      RefreshReveal(control: control, viewport: control, contentTop: .nan)] {
            XCTAssertEqual(value.opacity, 0); XCTAssertEqual(value.frame, .zero)
        }
    }
    func testGeometryUsesActualControlOriginsAndPartialWidths() {
        let value = RefreshReveal(control: CGRect(x: 5, y: 12, width: 320, height: 93),
                                  viewport: CGRect(x: 15, y: 30, width: 200, height: 500), contentTop: 40)
        XCTAssertEqual(value.frame, CGRect(x: 15, y: 30, width: 200, height: 10))
    }
    func testDeepPullFillsAllExposedSpaceBeyondTheNativeControl() {
        let control = CGRect(x: 0, y: -60, width: 402, height: 60)
        let value = RefreshReveal(control: control,
            viewport: CGRect(x: 0, y: -240, width: 402, height: 800), contentTop: 0)
        XCTAssertEqual(value.frame, CGRect(x: 0, y: -240, width: 402, height: 240))
        XCTAssertEqual(value.opacity, 1)
        XCTAssertEqual(value.frame.maxY, 0)
    }
    func testElasticReleaseTracksContentBackToTheNativeStripWithoutAHeightJump() {
        let control = CGRect(x: 8, y: -60, width: 375, height: 60)
        for height in stride(from: 240.0, through: 0, by: -1) {
            let value = RefreshReveal(control: control,
                viewport: CGRect(x: 0, y: -height, width: 390, height: 700), contentTop: 0)
            XCTAssertEqual(value.frame.height, height, accuracy: 0.0001)
            XCTAssertLessThanOrEqual(value.frame.maxY, 0)
            if height >= 60 { XCTAssertEqual(value.opacity, 1) }
        }
    }
    func testTileWaveStaysSmallAndHasStaggeredMotion() {
        for index in 0..<3 {
            for tick in 0..<200 {
                let pose = InlineLoadingMotion.pose(index: index, elapsed: Double(tick) / 20, animated: true)
                XCTAssertLessThanOrEqual(abs(pose.lift), 2.4); XCTAssertLessThanOrEqual(abs(pose.tilt), 12)
            }
        }
        XCTAssertNotEqual(InlineLoadingMotion.pose(index: 0, elapsed: 0.2, animated: true),
                          InlineLoadingMotion.pose(index: 1, elapsed: 0.2, animated: true))
    }
    func testReducedMotionIsStillAndNonFiniteTimeIsSafe() {
        for index in 0..<3 {
            let still = InlineLoadingMotion.pose(index: index, elapsed: 0, animated: false)
            XCTAssertEqual(still, InlineLoadingMotion.pose(index: index, elapsed: 90, animated: false))
            XCTAssertEqual(still, InlineLoadingMotion.pose(index: index, elapsed: .infinity, animated: true))
            XCTAssertEqual(still.lift, 0)
        }
    }
}
