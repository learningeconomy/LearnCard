require 'xcodeproj'
require 'fileutils'
require 'pathname'

# This is a disposable test host, never the LearnCard application or its entitlements.
directory, package, test_source = ARGV
raise 'Expected output directory, local package, test source' unless test_source
FileUtils.mkdir_p(directory)
File.write(File.join(directory, 'ProbeApp.swift'), <<~SWIFT)
  import UIKit
  @main final class ProbeApp: UIResponder, UIApplicationDelegate {
      var window: UIWindow?
      func application(_ application: UIApplication, didFinishLaunchingWithOptions options: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
          let view = UIWindow(frame: UIScreen.main.bounds)
          view.rootViewController = UIViewController()
          view.makeKeyAndVisible()
          window = view
          return true
      }
  }
SWIFT
FileUtils.cp(test_source, File.join(directory, 'NativeKeychainTests.swift'))
entitlements = {
  'application-identifier' => 'SQLITETESTS.com.learncard.sqlite.encryption.probe',
  'keychain-access-groups' => ['SQLITETESTS.com.learncard.sqlite.encryption.probe']
}
Xcodeproj::Plist.write_to_path(entitlements, File.join(directory, 'Probe.entitlements'))
project = Xcodeproj::Project.new(File.join(directory, 'Probe.xcodeproj'))
app = project.new_target(:application, 'Probe', :ios, '15.0')
tests = project.new_target(:unit_test_bundle, 'ProbeTests', :ios, '15.0')
tests.add_dependency(app)
app.add_file_references([project.main_group.new_file('ProbeApp.swift')])
tests.add_file_references([project.main_group.new_file('NativeKeychainTests.swift')])
reference = project.new(Xcodeproj::Project::Object::XCLocalSwiftPackageReference)
reference.relative_path = Pathname.new(package).relative_path_from(Pathname.new(directory)).to_s
project.root_object.package_references << reference
product = project.new(Xcodeproj::Project::Object::XCSwiftPackageProductDependency)
product.package = reference
product.product_name = 'CapacitorCommunitySqlite'
tests.package_product_dependencies << product
build_file = project.new(Xcodeproj::Project::Object::PBXBuildFile)
build_file.product_ref = product
tests.frameworks_build_phase.files << build_file
[app, tests].each do |target|
  target.build_configurations.each do |configuration|
    settings = configuration.build_settings
    settings['SWIFT_VERSION'] = '5.0'
    settings['GENERATE_INFOPLIST_FILE'] = 'YES'
    settings['CODE_SIGN_IDENTITY'] = '-'
    settings['CODE_SIGN_STYLE'] = 'Manual'
    settings['PRODUCT_BUNDLE_IDENTIFIER'] = target == app ? 'com.learncard.sqlite.encryption.probe' : 'com.learncard.sqlite.encryption.probe.tests'
    settings['TARGETED_DEVICE_FAMILY'] = '1'
    settings['ENABLE_TESTABILITY'] = 'YES'
  end
end
app.build_configurations.each do |configuration|
  configuration.build_settings['CODE_SIGN_ENTITLEMENTS'] = 'Probe.entitlements'
end
tests.build_configurations.each do |configuration|
  configuration.build_settings['TEST_HOST'] = '$(BUILT_PRODUCTS_DIR)/Probe.app/Probe'
  configuration.build_settings['BUNDLE_LOADER'] = '$(TEST_HOST)'
end
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(app)
scheme.add_build_target(tests)
scheme.add_test_target(tests)
scheme.set_launch_target(app)
scheme.save_as(project.path, 'Probe')
