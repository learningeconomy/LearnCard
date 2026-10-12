import XCTest
import LearnCardNativeSDK

final class StagingAccountTests: XCTestCase {
    @MainActor
    func testExistingProfileClaimCollectionAndSend() async throws {
        try XCTSkipUnless(ProcessInfo.processInfo.environment["LC_NATIVE_LIVE_TEST"] == "1",
                          "Run scripts/test-staging.sh to enable disposable staging accounts.")
        let runtime = SDKSpikeRuntime(stagingTest: true)
        defer {
            let trace = XCTAttachment(string: runtime.stagingDiagnostics)
            trace.name = "staging-route-diagnostics"
            trace.lifetime = .keepAlways
            add(trace)
        }
        let initialized = try dictionary(await runtime.initialize())
        for field in ["existingProfileMatches", "signingDidMatches", "profileDidMatches"] {
            XCTAssertEqual(initialized[field] as? Bool, true, field)
        }
        let result = try dictionary(await runtime.run(.exchange))
        for field in ["pendingFound", "payloadMatches", "proofVerified", "accepted", "indexed",
                      "collectionFound", "receivedFound", "pendingCleared", "resumedCollection", "resumedPayload"] {
            XCTAssertEqual(result[field] as? Bool, true, field)
        }
        let report: [String: Any] = ["initialization": initialized, "exchange": result]
        let attachment = XCTAttachment(data: try JSONSerialization.data(withJSONObject: report),
                                       uniformTypeIdentifier: "public.json")
        attachment.name = "native-staging-output"
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    private func dictionary(_ json: String) throws -> [String: Any] {
        try XCTUnwrap(JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any])
    }
}
