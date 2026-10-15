import XCTest
@testable import LearnCardNativeSDK

final class AccountMotionLocalizationTests: XCTestCase {
    func testTransitionsHaveContextualCopyInEveryLanguage() {
        for language in [NativeLanguage.en, .es, .fr, .ar] {
            for key in ["motion.launch.title", "motion.welcome", "motion.sending.title", "motion.verifying.title", "motion.recovery.title", "motion.opening", "motion.connecting", "motion.locked", "motion.sending", "motion.verifying", "motion.recovering", "motion.longer", "motion.retry", "motion.signin", "motion.restore"] {
                XCTAssertNotEqual(NativeText.text(key, language: language), key)
            }
        }
    }
}
