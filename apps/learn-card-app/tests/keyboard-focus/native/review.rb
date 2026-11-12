# Run against an installed Debug app loading ../animation.html. Requires the
# xcodeproj gem (provided by CocoaPods). Outputs are private until inspected.
require 'xcodeproj'
require 'tmpdir'
require 'fileutils'

device = ARGV.fetch(0) { abort 'Usage: ruby review.rb <Simulator UDID> [output parent]' }
root = Dir.mktmpdir('lc-keyboard-review-', ARGV[1])
project = Xcodeproj::Project.new(File.join(root, 'KeyboardReview.xcodeproj'))
target = project.new_target(:ui_test_bundle, 'KeyboardReview', :ios, '16.4')
target.build_configurations.each do |config|
  config.build_settings.merge!(
    'PRODUCT_BUNDLE_IDENTIFIER' => 'com.learncard.keyboardreview.tests',
    'GENERATE_INFOPLIST_FILE' => 'YES',
    'SWIFT_VERSION' => '5.0',
    'CODE_SIGNING_ALLOWED' => 'NO',
    'TARGETED_DEVICE_FAMILY' => '1,2'
  )
end
source = project.main_group.new_file(File.join(__dir__, 'KeyboardAnimationTests.swift'))
target.source_build_phase.add_file_reference(source)
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_test_target(target)
scheme.save_as(project.path, 'KeyboardReview')

puts "Private native review output: #{root}"
recorder = Process.spawn('xcrun', 'simctl', 'io', device, 'recordVideo', '--codec=h264', File.join(root, 'keyboard.mp4'))
status = false
begin
  status = system('xcodebuild', 'test', '-project', project.path.to_s,
    '-scheme', 'KeyboardReview', '-destination', "platform=iOS Simulator,id=#{device}",
    '-derivedDataPath', File.join(root, 'DerivedData'), '-parallel-testing-enabled', 'NO',
    'CODE_SIGNING_ALLOWED=NO')
ensure
  begin
    Process.kill('INT', recorder)
    Process.wait(recorder)
  rescue Errno::ESRCH, Errno::ECHILD
    # The recorder may already have stopped when a Simulator is closed.
  end
end
exit(status ? 0 : 1)
