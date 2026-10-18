import XCTest
@testable import LearnCardNativeCore

final class RefreshSkyTests: XCTestCase {
    private var utc: Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 0)!
        return calendar
    }
    private func date(_ hour: Int, minute: Int = 0) -> Date {
        utc.date(from: DateComponents(year: 2026, month: 10, day: 18, hour: hour, minute: minute))!
    }
    func testLocalBoundariesKeepDashboardGreetingAndSeparateNightSky() {
        let expected: [(Int, LocalDaytime.Sky, LocalDaytime.Greeting)] = [
            (0, .night, .hello), (5, .night, .hello), (6, .morning, .morning), (11, .morning, .morning),
            (12, .afternoon, .afternoon), (17, .afternoon, .afternoon), (18, .dusk, .evening),
            (20, .dusk, .evening), (21, .night, .evening), (23, .night, .evening)
        ]
        for (hour, sky, greeting) in expected {
            for minute in [0, 59] {
                let value = LocalDaytime(date: date(hour, minute: minute), calendar: utc)
                XCTAssertEqual(value.sky, sky); XCTAssertEqual(value.greeting, greeting)
            }
        }
    }
    func testCalendarUsesDeviceTimezoneRatherThanUTCHourOrDisplayLocale() {
        var calendar = utc
        calendar.timeZone = TimeZone(identifier: "America/New_York")!
        XCTAssertEqual(LocalDaytime(date: date(8), calendar: calendar).sky, .night)
        calendar.timeZone = TimeZone(identifier: "Asia/Tokyo")!
        XCTAssertEqual(LocalDaytime(date: date(8), calendar: calendar).sky, .afternoon)
    }
    func testCycleLatchesSceneThroughDayBoundaryAndRetryUntilCollapse() {
        var cycle = RefreshSkyCycle()
        cycle.begin(sky: .dusk, cameo: .cow)
        let first = cycle.scene
        cycle.begin(sky: .night, cameo: .twoCows)
        XCTAssertEqual(cycle.scene, first)
        cycle.end()
        XCTAssertNil(cycle.scene)
        cycle.begin(sky: .night, cameo: .none)
        XCTAssertEqual(cycle.scene?.sky, .night)
        XCTAssertEqual(cycle.scene?.cameo, SkyCameoPolicy.Cameo.none)
    }
    func testRareCameosHaveBoundedFrequencyAndSharedCooldownIncludingClockRollback() {
        let now = date(14)
        var appearances = 0, pairs = 0
        for roll in 0..<1000 {
            var policy = SkyCameoPolicy()
            let result = policy.choose(roll: roll, at: now)
            if result != .none { appearances += 1 }
            if result == .twoCows { pairs += 1 }
        }
        XCTAssertEqual(appearances, 20); XCTAssertEqual(pairs, 2)
        var policy = SkyCameoPolicy()
        XCTAssertEqual(policy.choose(roll: -1, at: now), .none)
        XCTAssertEqual(policy.choose(roll: 1000, at: now), .none)
        XCTAssertNil(policy.lastAppearance)
        XCTAssertEqual(policy.choose(roll: 0, at: now), .twoCows)
        XCTAssertEqual(policy.choose(roll: 0, at: now.addingTimeInterval(-1)), .none)
        XCTAssertEqual(policy.choose(roll: 2, at: now.addingTimeInterval(599)), .none)
        XCTAssertEqual(policy.choose(roll: 2, at: now.addingTimeInterval(600)), .cow)
    }
    func testReducedMotionAndInvalidTimeKeepACompleteStillPose() {
        let still = SkyMotion.pose(elapsed: 0, animated: false)
        XCTAssertTrue((0.2...0.8).contains(still.x))
        for t in [0.0, 0.3, 45, 900, -.infinity, .infinity, .nan] {
            XCTAssertEqual(still, SkyMotion.pose(elapsed: t, animated: false))
        }
        XCTAssertEqual(still, SkyMotion.pose(elapsed: .nan, animated: true))
    }
    func testMovingPosesAreBoundedAndAlreadyVisibleOnFirstFrame() {
        let first = SkyMotion.pose(elapsed: 0, animated: true)
        XCTAssertEqual(first, SkyMotion.pose(elapsed: 0, animated: false))
        XCTAssertNotEqual(first, SkyMotion.pose(elapsed: 2, animated: true))
        for second in [false, true] {
            for tick in 0..<4000 {
                let pose = SkyMotion.pose(elapsed: Double(tick) / 30, animated: true, secondCow: second)
                XCTAssertTrue(pose.x.isFinite && pose.y.isFinite && pose.tilt.isFinite && pose.wing.isFinite)
                XCTAssertTrue((-0.15...1.15).contains(pose.x))
                XCTAssertTrue((0.3...0.6).contains(pose.y))
                XCTAssertLessThanOrEqual(abs(pose.tilt), 4)
            }
        }
    }
    func testSceneWaveTravelsAcrossElementsAndStaysStillForReducedMotion() {
        let first = SkyMotion.wave(elapsed: 0, position: 0.1, animated: true)
        XCTAssertNotEqual(first, SkyMotion.wave(elapsed: 0, position: 0.84, animated: true))
        XCTAssertNotEqual(first, SkyMotion.wave(elapsed: 0.9, position: 0.1, animated: true))
        XCTAssertEqual(first, SkyMotion.wave(elapsed: 3.6, position: 0.1, animated: true), accuracy: 0.000001)
        // The same wave crest reaches an element farther right at a later time.
        XCTAssertEqual(SkyMotion.wave(elapsed: 0.9, position: 0, animated: true),
                       SkyMotion.wave(elapsed: 1.8, position: 0.3125, animated: true), accuracy: 0.000001)
        for x in [0.1, 0.4, 0.84] {
            let still = SkyMotion.wave(elapsed: 0, position: x, animated: false)
            for t in [0.0, 0.3, 45, 900, -.infinity, .infinity, .nan] {
                XCTAssertEqual(still, SkyMotion.wave(elapsed: t, position: x, animated: false))
                let moving = SkyMotion.wave(elapsed: t, position: x, animated: true)
                XCTAssertTrue(moving.isFinite && (-1...1).contains(moving))
            }
        }
        XCTAssertTrue(SkyMotion.wave(elapsed: 1, position: .nan, animated: true).isFinite)
    }
}
