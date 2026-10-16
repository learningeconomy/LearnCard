#!/usr/bin/env python3
"""Generate a dependency-free Xcode project. Run after changing project settings.

Source folders use Xcode's synchronized groups; adding Swift files needs no regeneration.
No global XcodeGen, CocoaPods, npm install, or Apple signing team is required for simulator builds.
"""
from hashlib import sha1
from pathlib import Path


def key(name):
    return sha1(name.encode()).hexdigest()[:24].upper()


objects = []


def add(name, content):
    objects.append(f"\t\t{key(name)} /* {name} */ = {{ {content} }};")
    return key(name)


def configs(name, settings, base=None):
    entries = []
    for mode in ("Debug", "Release"):
        optimization = "-Onone" if mode == "Debug" else "-O"
        fields = dict(settings)
        fields.update({"SWIFT_OPTIMIZATION_LEVEL": f'"{optimization}"'})
        if mode == "Debug":
            fields["SWIFT_ACTIVE_COMPILATION_CONDITIONS"] = '"DEBUG $(inherited)"'
            fields["ONLY_ACTIVE_ARCH"] = "YES"
        contents = " ".join(f"{field} = {value};" for field, value in fields.items())
        reference = f"baseConfigurationReference = {base}; " if base else ""
        entries.append(add(f"{name} {mode}", f"isa = XCBuildConfiguration; {reference}buildSettings = {{ {contents} }}; name = {mode};"))
    return add(f"{name} configurations", f"isa = XCConfigurationList; buildConfigurations = ({', '.join(entries)},); defaultConfigurationIsVisible = 0; defaultConfigurationName = Release;")


root = Path(__file__).resolve().parents[1] / "ios"
project = root / "LearnCardNative.xcodeproj"
project.mkdir(parents=True, exist_ok=True)
app_name = "LearnCardNative"
test_name = "LearnCardNativeUITests"
app_product = add("App product", 'isa = PBXFileReference; explicitFileType = wrapper.application; path = LearnCardNative.app; sourceTree = BUILT_PRODUCTS_DIR;')
test_product = add("Test product", 'isa = PBXFileReference; explicitFileType = wrapper.cfbundle; path = LearnCardNativeUITests.xctest; sourceTree = BUILT_PRODUCTS_DIR;')
sources = add("App sources", 'isa = PBXFileSystemSynchronizedRootGroup; path = Sources; sourceTree = "<group>";')
tests = add("UI test sources", 'isa = PBXFileSystemSynchronizedRootGroup; path = UITests; sourceTree = "<group>";')
plist = add("Info plist", 'isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = "<group>";')
oauth_config = add("OAuth build configuration", 'isa = PBXFileReference; lastKnownFileType = text.xcconfig; path = GeneratedOAuth.xcconfig; sourceTree = "<group>";')
package_folder = add("Core folder", 'isa = PBXFileReference; lastKnownFileType = folder; path = NativeCore; sourceTree = "<group>";')
products = add("Products", f'isa = PBXGroup; children = ({app_product}, {test_product},); name = Products; sourceTree = "<group>";')
main = add("Main group", f'isa = PBXGroup; children = ({sources}, {tests}, {package_folder}, {plist}, {oauth_config}, {products},); sourceTree = "<group>";')
package = add("Local core package", 'isa = XCLocalSwiftPackageReference; relativePath = NativeCore;')
core = add("Core product", f"isa = XCSwiftPackageProductDependency; package = {package}; productName = LearnCardNativeCore;")
core_build = add("Core framework build", f"isa = PBXBuildFile; productRef = {core};")
sdk = add("SDK product", f"isa = XCSwiftPackageProductDependency; package = {package}; productName = LearnCardNativeSDK;")
sdk_app_build = add("SDK app framework build", f"isa = PBXBuildFile; productRef = {sdk};")
sdk_build = add("SDK test framework build", f"isa = PBXBuildFile; productRef = {sdk};")

project_configs = configs("Project", {
    "IPHONEOS_DEPLOYMENT_TARGET": "18.0", "SDKROOT": "iphoneos", "SWIFT_VERSION": "6.0",
    "CLANG_ENABLE_MODULES": "YES", "SWIFT_STRICT_CONCURRENCY": "complete",
    "ENABLE_TESTABILITY": "YES", "DEBUG_INFORMATION_FORMAT": '"dwarf-with-dsym"',
})
app_configs = configs("App", {
    "PRODUCT_NAME": '"$(TARGET_NAME)"',
    "PRODUCT_BUNDLE_IDENTIFIER": "org.learningeconomy.learncard.native.experiment",
    "INFOPLIST_FILE": "Info.plist", "GENERATE_INFOPLIST_FILE": "NO",
    "ASSETCATALOG_COMPILER_APPICON_NAME": "AppIcon",
    "TARGETED_DEVICE_FAMILY": "1", "CODE_SIGN_STYLE": "Automatic",
    "LD_RUNPATH_SEARCH_PATHS": '"$(inherited) @executable_path/Frameworks"',
    "SUPPORTED_PLATFORMS": '"iphoneos iphonesimulator"', "SUPPORTS_MACCATALYST": "NO",
}, base=oauth_config)
test_configs = configs("UI tests", {
    "PRODUCT_NAME": '"$(TARGET_NAME)"',
    "PRODUCT_BUNDLE_IDENTIFIER": "org.learningeconomy.learncard.native.experiment.uitests",
    "GENERATE_INFOPLIST_FILE": "YES", "TARGETED_DEVICE_FAMILY": "1",
    "TEST_TARGET_NAME": app_name, "CODE_SIGN_STYLE": "Automatic",
    "LD_RUNPATH_SEARCH_PATHS": '"$(inherited) @executable_path/Frameworks @loader_path/Frameworks"',
    "SUPPORTED_PLATFORMS": '"iphoneos iphonesimulator"',
})

phases = {}
for target, frameworks in (("App", f"{core_build}, {sdk_app_build}"), ("UI tests", sdk_build)):
    phases[target] = []
    for phase, kind in (("Sources", "PBXSourcesBuildPhase"), ("Frameworks", "PBXFrameworksBuildPhase"), ("Resources", "PBXResourcesBuildPhase")):
        files = f"{frameworks}," if phase == "Frameworks" and frameworks else ""
        phases[target].append(add(f"{target} {phase}", f"isa = {kind}; buildActionMask = 2147483647; files = ({files}); runOnlyForDeploymentPostprocessing = 0;"))

proxy = add("App dependency proxy", f"isa = PBXContainerItemProxy; containerPortal = {key('Project')}; proxyType = 1; remoteGlobalIDString = {key('App target')}; remoteInfo = {app_name};")
dependency = add("App dependency", f"isa = PBXTargetDependency; target = {key('App target')}; targetProxy = {proxy};")
app_target = add("App target", f'isa = PBXNativeTarget; buildConfigurationList = {app_configs}; buildPhases = ({", ".join(phases["App"])},); buildRules = (); dependencies = (); fileSystemSynchronizedGroups = ({sources},); name = {app_name}; packageProductDependencies = ({core}, {sdk},); productName = {app_name}; productReference = {app_product}; productType = "com.apple.product-type.application";')
test_target = add("UI test target", f'isa = PBXNativeTarget; buildConfigurationList = {test_configs}; buildPhases = ({", ".join(phases["UI tests"])},); buildRules = (); dependencies = ({dependency},); fileSystemSynchronizedGroups = ({tests},); name = {test_name}; packageProductDependencies = ({sdk},); productName = {test_name}; productReference = {test_product}; productType = "com.apple.product-type.bundle.ui-testing";')
project_id = add("Project", f'isa = PBXProject; attributes = {{ BuildIndependentTargetsInParallel = YES; LastUpgradeCheck = 2600; TargetAttributes = {{ {app_target} = {{ CreatedOnToolsVersion = 26.0; }}; {test_target} = {{ CreatedOnToolsVersion = 26.0; TestTargetID = {app_target}; }}; }}; }}; buildConfigurationList = {project_configs}; compatibilityVersion = "Xcode 16.0"; developmentRegion = en; hasScannedForEncodings = 0; knownRegions = (en, es, fr, ar, Base,); mainGroup = {main}; packageReferences = ({package},); preferredProjectObjectVersion = 77; productRefGroup = {products}; projectDirPath = ""; projectRoot = ""; targets = ({app_target}, {test_target},);')
(project / "project.pbxproj").write_text("// !$*UTF8*$!\n{\n\tarchiveVersion = 1;\n\tclasses = {};\n\tobjectVersion = 77;\n\tobjects = {\n" + "\n".join(objects) + f"\n\t}};\n\trootObject = {project_id};\n}}\n")

schemes = project / "xcshareddata" / "xcschemes"
schemes.mkdir(parents=True, exist_ok=True)


def reference(target, name, extension):
    return f'<BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{target}" BuildableName="{name}.{extension}" BlueprintName="{name}" ReferencedContainer="container:LearnCardNative.xcodeproj"/>'


app_ref = reference(app_target, app_name, "app")
test_ref = reference(test_target, test_name, "xctest")
(schemes / "LearnCardNative.xcscheme").write_text(f'''<?xml version="1.0" encoding="UTF-8"?>
<Scheme LastUpgradeVersion="2600" version="1.3">
  <BuildAction parallelizeBuildables="YES" buildImplicitDependencies="YES">
    <BuildActionEntries>
      <BuildActionEntry buildForTesting="YES" buildForRunning="YES" buildForProfiling="YES" buildForArchiving="YES" buildForAnalyzing="YES">{app_ref}</BuildActionEntry>
      <BuildActionEntry buildForTesting="YES" buildForRunning="NO" buildForProfiling="NO" buildForArchiving="NO" buildForAnalyzing="NO">{test_ref}</BuildActionEntry>
    </BuildActionEntries>
  </BuildAction>
  <TestAction buildConfiguration="Debug" selectedDebuggerIdentifier="" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.PosixSpawn" shouldUseLaunchSchemeArgsEnv="NO">
    <Testables><TestableReference skipped="NO">{test_ref}</TestableReference></Testables>
    <EnvironmentVariables><EnvironmentVariable key="LC_NATIVE_LIVE_TEST" value="0" isEnabled="YES"/></EnvironmentVariables>
  </TestAction>
  <LaunchAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" launchStyle="0" useCustomWorkingDirectory="NO" ignoresPersistentStateOnLaunch="NO" debugDocumentVersioning="YES" debugServiceExtension="internal" allowLocationSimulation="YES">
    <BuildableProductRunnable runnableDebuggingMode="0">{app_ref}</BuildableProductRunnable>
  </LaunchAction>
  <ProfileAction buildConfiguration="Release" shouldUseLaunchSchemeArgsEnv="YES" savedToolIdentifier="" useCustomWorkingDirectory="NO" debugDocumentVersioning="YES"><BuildableProductRunnable runnableDebuggingMode="0">{app_ref}</BuildableProductRunnable></ProfileAction>
  <AnalyzeAction buildConfiguration="Debug"/>
  <ArchiveAction buildConfiguration="Release" revealArchiveInOrganizer="YES"/>
</Scheme>
''')
default_scheme = (schemes / "LearnCardNative.xcscheme").read_text()
staging_scheme = default_scheme.replace('key="LC_NATIVE_LIVE_TEST" value="0"', 'key="LC_NATIVE_LIVE_TEST" value="1"')
staging_scheme = staging_scheme.replace('</TestableReference>', '<SelectedTests><Test Identifier="StagingAccountTests"/></SelectedTests></TestableReference>')
(schemes / "LearnCardNativeStaging.xcscheme").write_text(staging_scheme)
print(project)
