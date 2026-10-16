// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "LearnCardNativeCore",
    defaultLocalization: "en",
    platforms: [.iOS(.v18), .macOS(.v14)],
    products: [
        .library(name: "LearnCardNativeCore", targets: ["LearnCardNativeCore"]),
        .library(name: "LearnCardNativeSDK", targets: ["LearnCardNativeSDK"]),
    ],
    targets: [
        .target(name: "LearnCardNativeCore", resources: [.process("Resources")]),
        .target(name: "LearnCardNativeSDK", dependencies: ["LearnCardNativeCore"], resources: [.process("Resources")]),
        .testTarget(name: "LearnCardNativeCoreTests", dependencies: ["LearnCardNativeCore"]),
        .testTarget(name: "LearnCardNativeAccountTests", dependencies: ["LearnCardNativeSDK"]),
    ]
)
