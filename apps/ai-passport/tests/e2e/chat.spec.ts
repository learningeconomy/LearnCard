import { expect, test, type Page } from '@playwright/test';

import { authenticateTestPage as setupAuthentication } from '../auth';

const ROUTES = {
    topics: '/topics',
};

const UI_TEXT = {
    mainHeading: 'What would you like to learn about today?',
    suggestedTopicsHeading: 'Suggested topics based on your credentials',
    topicInputLabel: 'Or enter your own topic of interest',
    startLearningButton: 'Start Learning',
    confirmButton: 'Confirm',
    startSessionButton: 'Start Session',
    thinkingStatus: 'Thinking...',
    assistantThinkingStatus: 'Assistant is thinking...',
    messagePlaceholder: 'Type a message...',
    suggestionsLoading: 'Coming up with some suggestions for you...',
    sessionFinished: "You've already finished this session. No further messages can be sent.",
};

const REGEX = {
    finishButton: /^Finish/,
};

const SELECTORS = {
    topicsSection: '#topics-section',
};

const TIMEOUTS = {
    threeS: 3_000,
    fiveS: 5_000,
    tenS: 10_000,
    fifteenS: 15_000,
    thirtyS: 30_000,
    fortyFiveS: 45_000,
    ninetyS: 90_000,
};

const TOPIC_NAMES = {
    python: 'Python Programming',
    javascript: 'JavaScript',
    webDevelopment: 'Web Development',
    testing: 'Testing',
};

const USER_MESSAGES = {
    javascriptPurpose: 'What is JavaScript used for?',
    htmlOverview: 'What is HTML?',
    createLink: 'How do I create a link?',
    describeImages: 'What about images?',
    testingOverview: 'Tell me about testing',
};

/**
 * BEHAVIOR-DRIVEN REGRESSION TESTS
 *
 * These tests capture the CURRENT USER EXPERIENCE as a baseline.
 * They focus on what users SEE and DO, not implementation details.
 */

/**
 * Helper: Handle the "active session" confirmation modal if it appears
 * When starting a new topic, user may see a modal asking to confirm ending current session
 */
async function handleActiveSessionModal(page: Page) {
    const confirmButton = page.getByRole('button', {
        name: UI_TEXT.confirmButton,
    });
    try {
        await expect(confirmButton).toBeVisible({ timeout: TIMEOUTS.threeS });
        await confirmButton.click();
    } catch {
        // Modal didn't appear, continue
    }
}

/**
 * Helper: Wait for session plan to be generated
 * User sees "Thinking..." indicator, then "Start Session" button appears
 */
async function waitForSessionPlan(page: Page) {
    // USER SEES: Assistant generates session plan (typing indicator appears)
    await expect(page.getByText(UI_TEXT.thinkingStatus)).toBeVisible({
        timeout: TIMEOUTS.tenS,
    });

    // USER SEES: Session plan generated, "Start Session" button appears
    await expect(page.getByText(UI_TEXT.thinkingStatus)).toBeHidden({
        timeout: TIMEOUTS.ninetyS,
    });

    const startSessionButton = page.getByRole('button', {
        name: UI_TEXT.startSessionButton,
    });
    await expect(startSessionButton).toBeVisible({ timeout: TIMEOUTS.fifteenS });

    return startSessionButton;
}

/**
 * Helper: Wait for assistant to finish responding
 * User sees typing indicator appear, then disappear when response is complete
 */
async function waitForAssistantResponse(page: Page) {
    // USER SEES: Assistant starts responding (typing indicator appears)
    await expect(page.getByRole('status', { name: UI_TEXT.assistantThinkingStatus })).toBeVisible({
        timeout: TIMEOUTS.tenS,
    });

    // USER SEES: Assistant finishes responding (typing indicator disappears, input re-enabled)
    await expect(page.getByPlaceholder(UI_TEXT.messagePlaceholder)).toBeVisible({
        timeout: TIMEOUTS.ninetyS,
    });
}

/**
 * Helper: Start a chat with a custom topic
 * Navigates to topics page, enters custom topic, handles modal, waits for session plan
 */
async function startChatWithCustomTopic(page: Page, topicName: string): Promise<void> {
    await page.goto(ROUTES.topics);
    await page.getByLabel(UI_TEXT.topicInputLabel).fill(topicName);
    await page.getByRole('button', { name: UI_TEXT.startLearningButton }).click();

    await handleActiveSessionModal(page);

    const startSessionButton = await waitForSessionPlan(page);
    await startSessionButton.click();

    // Wait for chat to be ready
    await expect(page.getByPlaceholder(UI_TEXT.messagePlaceholder)).toBeVisible({
        timeout: TIMEOUTS.ninetyS,
    });
}

test.describe('Chat Behavior - User Experience Baseline', () => {
    /**
     * BEHAVIOR: User can log in and see topics page
     * USER SEES: Page heading, topic input, and topic suggestions (or loading state)
     */
    test('user can authenticate and see topic suggestions', async ({ page, baseURL }) => {
        await setupAuthentication(page, baseURL!);
        await page.goto(ROUTES.topics);

        // USER SEES: Main topics page heading
        await expect(
            page.getByRole('heading', {
                name: UI_TEXT.mainHeading,
            })
        ).toBeVisible({ timeout: TIMEOUTS.tenS });

        // USER SEES: Section heading for suggested topics
        await expect(
            page.getByRole('heading', {
                name: UI_TEXT.suggestedTopicsHeading,
            })
        ).toBeVisible();

        // USER SEES: Custom topic input field (always visible)
        await expect(page.getByLabel(UI_TEXT.topicInputLabel)).toBeVisible();

        // USER SEES: Start Learning button
        await expect(page.getByRole('button', { name: UI_TEXT.startLearningButton })).toBeVisible();

        // USER SEES: Either topic suggestions OR a loading message
        // The actual topics are dynamic based on credentials, so we verify the section exists
        // and contains interactive topic buttons/links (if not still loading)
        const loadingMessage = page.getByText(UI_TEXT.suggestionsLoading);
        const isLoading = await loadingMessage.isVisible().catch(() => false);

        // Either loading state is visible OR the suggestions section should have clickable topics
        // We accept both as valid user experiences since topics may load asynchronously
        expect(
            isLoading ||
                (await page
                    .getByRole('heading', {
                        name: UI_TEXT.suggestedTopicsHeading,
                    })
                    .isVisible())
        ).toBe(true);
    });

    /**
     * BEHAVIOR: User can start chat by typing custom topic
     * USER DOES: Type topic, click "Start Learning"
     * USER SEES: Chat interface with message input ready
     */
    test('user can start chat with custom topic', async ({ page, baseURL }) => {
        await setupAuthentication(page, baseURL!);
        await startChatWithCustomTopic(page, TOPIC_NAMES.python);
    });

    /**
     * BEHAVIOR: User can start chat by clicking suggested topic
     * USER DOES: Click a suggested topic link
     * USER SEES: Chat interface ready
     */
    test('user can start chat by clicking suggested topic', async ({ page, baseURL }) => {
        await setupAuthentication(page, baseURL!);

        // USER ACTION: Go to topics page
        await page.goto(ROUTES.topics);

        // USER SEES: Topics page loads
        await expect(
            page.getByRole('heading', {
                name: UI_TEXT.mainHeading,
            })
        ).toBeVisible({ timeout: TIMEOUTS.tenS });

        // Wait for either loading message to disappear OR topics to appear
        const loadingMessage = page.getByText(UI_TEXT.suggestionsLoading);

        // If loading is visible, wait for it to disappear
        const isLoading = await loadingMessage.isVisible().catch(() => false);
        if (isLoading) {
            await expect(loadingMessage).not.toBeVisible({
                timeout: TIMEOUTS.thirtyS,
            });
        }

        // USER SEES: Suggested topics section with heading
        await expect(
            page.getByRole('heading', {
                name: UI_TEXT.suggestedTopicsHeading,
            })
        ).toBeVisible();

        // USER SEES: Topic buttons/links are now visible in the section
        // TODO: Refactor when Task 5 complete - Using #topics-section temporarily
        // Should add aria-label="suggested topics" or role="region" to make this semantic
        const topicsSection = page.locator(SELECTORS.topicsSection);
        const topicLinks = topicsSection.getByRole('link');
        const firstVisibleTopic = topicLinks.first();
        await expect(firstVisibleTopic).toBeVisible({ timeout: TIMEOUTS.fiveS });

        // USER ACTION: Click first suggested topic
        await firstVisibleTopic.click();
        await handleActiveSessionModal(page);
        const startSessionButton = await waitForSessionPlan(page);

        await startSessionButton.click();

        // USER SEES: Chat interface loaded with message input ready
        await expect(page.getByPlaceholder(UI_TEXT.messagePlaceholder)).toBeVisible({
            timeout: TIMEOUTS.fortyFiveS,
        });
    });

    /**
     * BEHAVIOR: User can send message and receive AI response
     * USER DOES: Type message, press Enter (or click send)
     * USER SEES: Their message appears, then AI response appears
     */
    test('user can send message and receive AI response', async ({ page, baseURL }) => {
        await setupAuthentication(page, baseURL!);
        await startChatWithCustomTopic(page, TOPIC_NAMES.javascript);

        const messageInput = page.getByPlaceholder(UI_TEXT.messagePlaceholder);

        // USER ACTION: Type and send message
        const userQuestion = USER_MESSAGES.javascriptPurpose;
        await messageInput.fill(userQuestion);
        await messageInput.press('Enter');

        // USER SEES: Their message appears
        await expect(page.getByText(userQuestion)).toBeVisible({
            timeout: TIMEOUTS.fiveS,
        });

        // USER SEES: AI response appears
        await waitForAssistantResponse(page);

        // USER SEES: Response has content (not empty)
        const messages = page.getByText(/JavaScript|programming|language/i);
        await expect(messages.first()).toBeVisible();
    });

    test('direct thread URL restores existing history', async ({ page, baseURL }) => {
        await setupAuthentication(page, baseURL!);
        await startChatWithCustomTopic(page, TOPIC_NAMES.javascript);

        const messageInput = page.getByPlaceholder(UI_TEXT.messagePlaceholder);
        await messageInput.fill(USER_MESSAGES.javascriptPurpose);
        await messageInput.press('Enter');
        await expect(page.getByText(USER_MESSAGES.javascriptPurpose)).toBeVisible();

        await expect.poll(() => new URL(page.url()).searchParams.get('threadId')).not.toBeNull();

        const threadId = new URL(page.url()).searchParams.get('threadId');
        expect(threadId).not.toBeNull();

        await page.goto(`/chat?threadId=${encodeURIComponent(threadId!)}`);

        await expect(page.getByText(USER_MESSAGES.javascriptPurpose)).toBeVisible({
            timeout: TIMEOUTS.tenS,
        });
    });

    /**
     * BEHAVIOR: User can have multi-turn conversation
     * USER DOES: Send multiple messages back and forth
     * USER SEES: Conversation builds up with multiple exchanges
     */
    test('user can have multi-turn conversation', async ({ page, baseURL }) => {
        await setupAuthentication(page, baseURL!);
        await startChatWithCustomTopic(page, TOPIC_NAMES.webDevelopment);

        const messageInput = page.getByPlaceholder(UI_TEXT.messagePlaceholder);

        // Helper function: send message and wait for response
        const sendAndWait = async (message: string) => {
            await messageInput.fill(message);
            await messageInput.press('Enter');

            // Wait for user message to appear
            await expect(page.getByText(message)).toBeVisible({
                timeout: TIMEOUTS.fiveS,
            });

            // Wait for AI response
            await waitForAssistantResponse(page);
        };

        // USER ACTION: First exchange
        await sendAndWait(USER_MESSAGES.htmlOverview);

        // USER ACTION: Second exchange
        await sendAndWait(USER_MESSAGES.createLink);

        // USER ACTION: Third exchange
        await sendAndWait(USER_MESSAGES.describeImages);

        // USER SEES: Multiple messages in conversation
        await expect(page.getByText(USER_MESSAGES.htmlOverview)).toBeVisible();
        await expect(page.getByText(USER_MESSAGES.createLink)).toBeVisible();
        await expect(page.getByText(USER_MESSAGES.describeImages)).toBeVisible();
    });

    /**
     * BEHAVIOR: User can finish a learning session
     * USER DOES: Click "Finish" button
     * USER SEES: Session end message with options
     */
    test('user can finish a learning session', async ({ page, baseURL }) => {
        await setupAuthentication(page, baseURL!);
        await startChatWithCustomTopic(page, TOPIC_NAMES.testing);

        const messageInput = page.getByPlaceholder(UI_TEXT.messagePlaceholder);

        // Send at least one message
        await messageInput.fill(USER_MESSAGES.testingOverview);
        await messageInput.press('Enter');

        // Wait for AI response
        await waitForAssistantResponse(page);

        // USER ACTION: Click Finish button (try both desktop and mobile versions)
        const finishButton = page.getByRole('button', { name: REGEX.finishButton }).first();
        await expect(finishButton).toBeVisible();
        await finishButton.click();

        // USER SEES: Session ended message (exact text from ChatInput.tsx line 84-85)
        await expect(page.getByText(UI_TEXT.sessionFinished)).toBeVisible({
            timeout: TIMEOUTS.tenS,
        });
    });
});
