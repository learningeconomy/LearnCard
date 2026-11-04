# E2E Testing Guidelines - Behavior-Driven Tests

## Core Philosophy

**Tests describe what USERS see and do, NOT how it's implemented.**

---

## ✅ DO: Use Semantic/Accessible Selectors

### Preferred Selectors (in priority order):

1. **Roles** - `page.getByRole("button", { name: "Submit" })`
2. **Labels** - `page.getByLabel("Email address")`
3. **Placeholders** - `page.getByPlaceholder("Type a message...")`
4. **Text Content** - `page.getByText("Welcome back")`
5. **Alt Text** - `page.getByAltText("Profile picture")`

### Examples:

```typescript
// ✅ GOOD - User sees a button labeled "Start Learning"
await page.getByRole('button', { name: 'Start Learning' }).click();

// ✅ GOOD - User sees a heading with this text
await expect(
    page.getByRole('heading', {
        name: 'What would you like to learn about today?',
    })
).toBeVisible();

// ✅ GOOD - User types in an input labeled this way
await page.getByLabel('Or enter your own topic of interest').fill('Python');

// ✅ GOOD - User sees placeholder text change
await expect(page.getByPlaceholder('Assistant is typing...')).toBeVisible();
```

---

## ❌ DON'T: Use Implementation Details

### Forbidden Selectors:

1. **CSS IDs** - `#topics-grid`, `#topics-loading`
2. **CSS Classes** - `.prose`, `.animate-bounce`, `.bg-gray-100`
3. **Data attributes** - `[data-testid="..."]` (unless absolutely necessary)
4. **HTML structure** - `div > ul > li:first-child`
5. **href attributes** - `a[href^="/chats?topic="]`
6. **Implementation details** - Any selector that references HOW it's built

### Examples:

```typescript
// ❌ BAD - Uses CSS ID (implementation detail)
await page.locator('#topics-grid').click();

// ❌ BAD - Uses CSS class (implementation detail)
await expect(page.locator('.prose')).toBeVisible();

// ❌ BAD - Uses href attribute (implementation detail)
const link = page.locator('a[href^="/chats?topic="]');

// ❌ BAD - Uses HTML structure (implementation detail)
await page.locator('div.container > button').click();
```

---

## 🎯 Behavior-Driven Test Structure

### Test Comment Format:

```typescript
/**
 * BEHAVIOR: <What the user is trying to accomplish>
 * USER DOES: <Actions the user takes>
 * USER SEES: <What appears on screen as a result>
 */
test('description matches user behavior', async ({ page }) => {
    // USER ACTION: <describe what user does>
    await page.getByRole('button', { name: 'Login' }).click();

    // USER SEES: <describe what user observes>
    await expect(page.getByText('Welcome back')).toBeVisible();
});
```

---

## 🚫 Common Mistakes to Avoid

### Mistake #1: Using CSS Selectors for Dynamic Content

```typescript
// ❌ BAD - Topics are dynamic, hardcoding them is brittle
const hasTopicLinks = await page
    .getByRole('link', { name: /Machine Learning|Web Development/i })
    .isVisible();

// ✅ GOOD - Verify the section exists, let topics be dynamic
await expect(
    page.getByRole('heading', {
        name: 'Suggested topics based on your credentials',
    })
).toBeVisible();
```

### Mistake #2: Using href or URL Patterns

```typescript
// ❌ BAD - href is an implementation detail
const topicLink = page.locator('a[href^="/chats?topic="]');

// ✅ GOOD - Find links by their role
const topicLink = page.getByRole('link').first();

// ❌ BAD - Checking URL is implementation detail (users don't see URLs)
await expect(page).toHaveURL(/\/chats\?topic=/);

// ✅ GOOD - Verify user sees the expected page content
await expect(page.getByPlaceholder('Type a message...')).toBeVisible();
```

### Mistake #3: Using CSS Classes for State

```typescript
// ❌ BAD - .animate-bounce is implementation detail
await expect(page.locator('.animate-bounce')).toBeVisible();

// ✅ GOOD - Use text content or accessible placeholders
await expect(page.getByPlaceholder('Assistant is typing...')).toBeVisible();
```

### Mistake #4: Using IDs for Loading States

```typescript
// ❌ BAD - #topics-loading is implementation detail
const isLoading = await page.locator('#topics-loading').isVisible();

// ✅ GOOD - Use the loading message text users see
const loadingMessage = page.getByText('Coming up with some suggestions for you...');
const isLoading = await loadingMessage.isVisible().catch(() => false);
```

---

## 📋 Checklist Before Committing Tests

- [ ] No CSS IDs (`#...`)
- [ ] No CSS classes (`....`)
- [ ] No href/src attributes in selectors
- [ ] No data-testid (unless absolutely necessary and documented why)
- [ ] All selectors use semantic queries (role, label, text, placeholder)
- [ ] Test comments describe USER behavior, not implementation
- [ ] Tests work with dynamic content (don't hardcode AI-generated text)
- [ ] Each assertion tests something the USER can observe

---

## 🔄 Handling Dynamic Content

### AI-Generated Topics Example:

```typescript
// ❌ BAD - Hardcoded topic names
await page.getByRole('link', { name: 'Machine Learning' }).click();

// ✅ GOOD - Accept any topic exists, verify behavior
// Test that user CAN click a topic, not WHICH topic
const firstTopic = page.getByRole('link').first();
await expect(firstTopic).toBeVisible();
await firstTopic.click();

// Verify navigation worked by checking user sees chat interface
await expect(page.getByPlaceholder('Type a message...')).toBeVisible();
```

---

## 🚨 No Semantic Selector? Fix the UI, Don't Compromise the Test

**If you can't find an element semantically, the UI needs better structure.**

### Process:

1. **DON'T** add `data-testid` or use CSS selectors
2. **DO** fix the UI to be properly structured:
    - Add `aria-label` for icons/buttons without text
    - Add `role` attributes for custom components
    - Use semantic HTML (`<button>`, `<nav>`, `<main>`)
    - Add visible text labels

### Example:

```typescript
// ❌ WRONG - Don't work around poorly structured UI
const spinner = page.locator('[data-testid="topics-spinner"]');

// ✅ RIGHT - Fix the UI first, then test semantically
// In the component:
<div role="status" aria-label="Loading topics">
  <div className="spinner" />
</div>

// In the test:
const loadingIndicator = page.getByRole("status", { name: "Loading topics" });
```

### Why This Matters:

- **Maintainability** - Semantic selectors survive UI refactors
- **Clean Code** - No brittle CSS selectors cluttering tests
- **Testability** - Forces proper UI structure that's easy to test
- **Living Documentation** - Tests describe UI structure, not implementation

**No exceptions. Fix the UI, not the test.**

---

## 📚 Resources

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library Guiding Principles](https://testing-library.com/docs/guiding-principles/)
- Story Document: `docs/stories/1.1.regression-tests-for-chat.md`
- UI Text Constants (Task 5): `apps/ai-passport/src/constants/ui-text.ts` (to be created)

---

## ⚡ Quick Reference Card

| ❌ DON'T USE       | ✅ USE INSTEAD                                          |
| ------------------ | ------------------------------------------------------- |
| `#topic-input`     | `getByLabel("Or enter your own topic")`                 |
| `.animate-bounce`  | `getByPlaceholder("Assistant is typing...")`            |
| `a[href="/chats"]` | `getByRole("link", { name: "Start Chat" })`             |
| `#topics-grid`     | `getByRole("heading", { name: "Suggested topics..." })` |
| `.prose`           | `getByText("specific content user sees")`               |

---

**Remember: If you can't find it the way a user would, either:**

1. You're using the wrong selector (find the semantic one)
2. The UI needs better accessibility (add ARIA labels/roles)
