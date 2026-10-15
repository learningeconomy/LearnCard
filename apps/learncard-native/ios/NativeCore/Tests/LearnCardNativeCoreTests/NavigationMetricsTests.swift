import Testing
@testable import LearnCardNativeCore

@Test func navigationScalesByLogicalWidthWithoutShrinkingCompactPhones() {
    // Representative logical widths, not their 2x/3x screenshot resolutions.
    #expect(NavigationMetrics(availableWidth: 320).iconSize == 31)
    #expect(NavigationMetrics(availableWidth: 375).iconSize == 31)
    #expect(NavigationMetrics(availableWidth: 393).iconSize == 36)
    #expect(NavigationMetrics(availableWidth: 414).iconSize == 36)
    #expect(NavigationMetrics(availableWidth: 440).iconSize == 40)
    #expect(NavigationMetrics(availableWidth: 768).iconSize == 40)
    for width in [320.0, 375, 393, 414, 440, 768] {
        let sizing = NavigationMetrics(availableWidth: width)
        #expect(sizing.minimumItemHeight >= 44)
        #expect(sizing.minimumItemHeight >= sizing.iconSize + 28)
    }
}
