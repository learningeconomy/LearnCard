import XCTest
import LearnCardNativeSDK

final class SDKCompatibilityTests: XCTestCase {
    @MainActor
    func testJavaScriptCoreActualWasmAndSDK() throws {
        let result = try SDKSpikeRuntime.javascriptCoreProbe()
        let attachment = XCTAttachment(string: result)
        attachment.name = "javascriptcore-sdk-probe"
        attachment.lifetime = .keepAlways
        add(attachment)
        print("Native SDK JSContext probe: \(result)")
    }

    @MainActor
    func testSDKCredentialEncryptionRecoveryAndPresentationInteroperability() async throws {
        let runtime = SDKSpikeRuntime()
        let start = Date()
        let initialization = try dictionary(await runtime.initialize())
        let initializationMilliseconds = Int(Date().timeIntervalSince(start) * 1000)
        XCTAssertNotEqual(initialization["issuerDid"] as? String, initialization["holderDid"] as? String)
        XCTAssertEqual(initialization["issuerMatches"] as? Bool, true)
        XCTAssertEqual(initialization["holderMatches"] as? Bool, true)
        let credentialOutput = try dictionary(await runtime.run(.credentials))
        let results = try XCTUnwrap(credentialOutput["results"] as? [[String: Any]])
        XCTAssertEqual(results.count, 10)
        for result in results {
            let id = result["id"] as? String ?? "Unknown"
            XCTAssertNil(result["error"], "\(id): \(result["error"] ?? "")")
            XCTAssertEqual(result["webVerified"] as? Bool, true, "Web → iOS: \(id)")
            XCTAssertEqual(result["nativeVerified"] as? Bool, true, "Native signature: \(id)")
            XCTAssertEqual(result["tamperRejected"] as? Bool, true, "Tamper rejection: \(id)")
            XCTAssertEqual(result["fullWebVerified"] as? Bool, result["webBaselineVerified"] as? Bool, "Full verification baseline: \(id)")
            XCTAssertEqual(result["fullNativeVerified"] as? Bool, result["webBaselineVerified"] as? Bool, "Full native verification baseline: \(id)")
        }
        let encrypted = try dictionary(await runtime.run(.encryption))
        XCTAssertEqual(encrypted["wrongRecipientRejected"] as? Bool, true, "Unrelated identity must not decrypt")
        XCTAssertEqual(encrypted["indexFieldsMatch"] as? Bool, true, "LearnCloud index field hash set must match")
        XCTAssertEqual((encrypted["decrypted"] as? [String: Any])?["count"] as? Int, 7)
        let recovery = try dictionary(await runtime.run(.recovery))
        for field in ["deviceMatches", "passwordMatches", "phraseMatches", "wrongPasswordRejected"] {
            XCTAssertEqual(recovery[field] as? Bool, true, field)
        }
        let presentation = try dictionary(await runtime.run(.presentation))
        XCTAssertEqual(presentation["verified"] as? Bool, true)
        XCTAssertEqual(presentation["wrongChallengeRejected"] as? Bool, true)
        let transfer = try dictionary(await runtime.run(.transfer))
        XCTAssertEqual(transfer["shareMatches"] as? Bool, true)
        XCTAssertEqual(transfer["wrongRecipientRejected"] as? Bool, true)
        let report: [String: Any] = ["initialization": initialization, "credentials": credentialOutput,
            "encryption": encrypted, "recovery": recovery, "presentation": presentation,
            "transfer": transfer,
            "initializationMilliseconds": initializationMilliseconds]
        let json = try JSONSerialization.data(withJSONObject: report, options: [.sortedKeys])
        let attachment = XCTAttachment(data: json, uniformTypeIdentifier: "public.json")
        attachment.name = "native-sdk-interop-output"
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    private func dictionary(_ json: String) throws -> [String: Any] {
        try XCTUnwrap(JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any])
    }
}
