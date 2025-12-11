# 🤖 AI-Enhanced Playwright Test Framework

## Overview

This project has been enhanced with advanced AI capabilities powered by **Claude 3.5 Sonnet** and **Model Context Protocol (MCP)** integration. The framework provides intelligent test analysis, failure diagnosis, automated test data generation, and comprehensive reporting.

## 🌟 Features

### 1. **AI-Powered Failure Analysis**
- Automatic screenshot analysis when tests fail
- Root cause identification with confidence levels
- Suggested fixes with code examples
- Flakiness detection
- Detailed recommendations for improvements

### 2. **MCP Playwright Integration**
- Advanced browser automation capabilities
- Natural language test execution
- Real-time browser interaction monitoring
- Performance metrics collection
- Network request tracking

### 3. **Intelligent Test Reporting**
- AI-generated test run summaries
- Pattern detection across test failures
- Performance analysis
- Flakiness indicators
- Executive-level insights

### 4. **Test Data Generation**
- AI-generated edge case scenarios
- Realistic test data variations
- Boundary condition testing
- Security testing (SQL injection, XSS)

### 5. **Flow Validation**
- AI-powered UI state verification
- Visual regression detection
- Accessibility analysis
- User journey validation

## 📦 Installation

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `@anthropic-ai/sdk` - Claude AI integration
- `@modelcontextprotocol/sdk` - MCP for advanced automation
- All existing project dependencies

### 2. Environment Setup

Your `.env` file has been configured with the Anthropic API key:

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### 3. Verify Installation

```bash
npm test -- --grep @ai-enhanced
```

## 🚀 Usage

### Basic AI-Enhanced Test

```typescript
import { test, expect } from '../../../resources/page_objects/base/pg_page_base';

test('AI-enhanced test', async ({ page, aiTestUtilities }) => {
  try {
    // Your test logic
    await page.goto('/move-in');
    
    // AI validates flow
    const validation = await aiTestUtilities.validateTestFlow(
      page,
      ['Landing', 'Form Entry', 'Confirmation'],
      0
    );
    
    if (!validation.isValid) {
      console.warn('Flow issues:', validation.issues);
    }
    
    // Continue with test...
  } catch (error) {
    // AI automatically analyzes failures in afterEach
    throw error;
  }
});
```

### Using MCP for Complex Interactions

```typescript
test('MCP-powered test', async ({ page, mcpHelper }) => {
  await mcpHelper.initialize();
  
  // Navigate using MCP
  await mcpHelper.navigate('https://example.com');
  
  // Complex interactions
  await mcpHelper.executeAction('Fill out the contact form with test data');
  
  // Get performance metrics
  const metrics = await mcpHelper.getPerformanceMetrics();
  console.log('Load time:', metrics.loadTime);
  
  // Screenshot for analysis
  const screenshot = await mcpHelper.screenshot();
});
```

### Generate Test Data Variations

```typescript
test.beforeAll(async ({ aiTestUtilities }) => {
  // Generate edge cases for testing
  const variations = await aiTestUtilities.generateTestDataVariations(
    'BGE',
    'New user move-in with electric service'
  );
  
  console.log(`Generated ${variations.length} test scenarios`);
  
  // Use variations in your tests
  for (const variation of variations) {
    console.log(`- ${variation.name}: ${variation.description}`);
  }
});
```

### AI Selector Suggestions

```typescript
test('Find best selector', async ({ page, aiTestUtilities }) => {
  const selectorInfo = await aiTestUtilities.suggestSelector(
    page,
    'Submit button on payment form'
  );
  
  console.log('Recommended selector:', selectorInfo.selector);
  console.log('Alternatives:', selectorInfo.alternativeSelectors);
  console.log('Confidence:', selectorInfo.confidence + '%');
  
  await page.click(selectorInfo.selector);
});
```

## 📊 AI Test Reporter

The framework includes an intelligent test reporter that generates comprehensive analysis:

### Features:
- ✅ Real-time test progress tracking
- 📊 Detailed statistics (pass rate, duration, flakiness)
- 🐌 Slowest test identification
- 🤖 AI-generated insights and recommendations
- 📁 Markdown and JSON reports

### Output Files:
- `test-results/ai-test-summary.md` - Human-readable summary
- `test-results/ai-test-report.json` - Programmatic access
- `test-results/ai-insights/` - Individual test analyses

### Example Report:

```markdown
# 🤖 AI-Enhanced Test Run Report

## 📊 Summary Statistics
- Total Tests: 15
- ✅ Passed: 13 (86.7%)
- ❌ Failed: 2 (13.3%)
- 🔄 Flaky: 1

## 🤖 AI Analysis
The test suite shows good overall health with an 86.7% pass rate. 
However, two concerning patterns emerged:

1. **Timeout Issues**: Tests involving payment processing are timing out
   - Recommendation: Increase timeout or optimize API calls

2. **Flaky Test Detected**: "New User for ShortCode Electric Only"
   - Root Cause: Race condition in form validation
   - Fix: Add explicit wait for validation message

## 🐌 Slowest Tests
1. **Move-in with payment** - 45,320ms
2. **Bill upload flow** - 38,210ms
```

## 🔧 Configuration

### Playwright Config

The `playwright.config.ts` has been updated:

```typescript
reporter: [
  ["line"],
  ["html", { outputFolder: "test-results" }],
  ["./tests/resources/fixtures/aiTestReporter.ts"]  // AI reporter
],
use: {
  trace: 'on-first-retry',
  screenshot: 'only-on-failure',  // For AI analysis
  video: 'retain-on-failure',
}
```

### Base Test Fixture

All tests automatically include AI capabilities:

```typescript
// Available in all tests
aiTestUtilities  // AI analysis functions
mcpHelper        // MCP automation
```

## 📝 Available AI Utilities

### AITestUtilities

| Method | Description |
|--------|-------------|
| `analyzeFailure(page, testInfo, error)` | Analyzes test failures with AI |
| `validateTestFlow(page, steps, index)` | Validates UI flow state |
| `generateTestDataVariations(utility, scenario)` | Generates edge cases |
| `detectFlakiness(testName, history)` | Detects flaky tests |
| `suggestRefactoring(filePath, content)` | Suggests code improvements |
| `suggestSelector(page, description)` | Finds best selectors |
| `generateTestSummary(results)` | Creates AI summary |

### MCPPlaywrightHelper

| Method | Description |
|--------|-------------|
| `initialize()` | Initialize MCP connection |
| `navigate(url)` | Navigate to URL |
| `click(selector)` | Click element |
| `fill(selector, value)` | Fill input |
| `screenshot(selector?, fullPage?)` | Take screenshot |
| `executeAction(description)` | Natural language action |
| `getPerformanceMetrics()` | Get page performance |
| `getNetworkRequests()` | Monitor network |
| `getAccessibilityTree()` | Get a11y tree |

## 🎯 Best Practices

### 1. **Use AI for Failed Tests**
The framework automatically analyzes failures in `afterEach`. No extra code needed!

```typescript
test.afterEach(async ({ page, aiTestUtilities }, testInfo) => {
  if (testInfo.status === 'failed' && process.env.ANTHROPIC_API_KEY) {
    await aiTestUtilities.analyzeFailure(page, testInfo, error);
  }
});
```

### 2. **Tag AI-Enhanced Tests**

```typescript
test('My test', { tag: '@ai-enhanced' }, async ({ ... }) => {
  // AI features enabled
});
```

### 3. **Conditional AI Usage**

AI features only run when `ANTHROPIC_API_KEY` is set:

```typescript
if (process.env.ANTHROPIC_API_KEY) {
  const validation = await aiTestUtilities.validateTestFlow(...);
}
```

### 4. **MCP Initialization**

Only initialize MCP when needed:

```typescript
test('MCP test', async ({ mcpHelper }) => {
  await mcpHelper.initialize();  // Only when using MCP
  // ... test logic
  // Automatically cleaned up after test
});
```

## 📈 Advanced Examples

### Example 1: Data-Driven Testing with AI

```typescript
test('Data-driven move-in tests', async ({ page, aiTestUtilities }) => {
  // Generate test variations
  const scenarios = await aiTestUtilities.generateTestDataVariations(
    'NGMA',
    'Gas service move-in'
  );
  
  for (const scenario of scenarios) {
    console.log(`Testing: ${scenario.name}`);
    
    // Run test with generated data
    await page.goto('/move-in');
    // Use scenario.data for test inputs
  }
});
```

### Example 2: Visual Regression with AI

```typescript
test('Visual regression check', async ({ page, aiTestUtilities }) => {
  await page.goto('/dashboard');
  
  // AI validates visual state
  const validation = await aiTestUtilities.validateTestFlow(
    page,
    ['Dashboard', 'Services Card', 'Billing Card'],
    0
  );
  
  expect(validation.isValid).toBeTruthy();
  expect(validation.issues).toHaveLength(0);
});
```

### Example 3: Performance Testing

```typescript
test('Performance monitoring', async ({ mcpHelper }) => {
  await mcpHelper.initialize();
  await mcpHelper.navigate('/move-in');
  
  const metrics = await mcpHelper.getPerformanceMetrics();
  
  expect(metrics.loadTime).toBeLessThan(3000);
  expect(metrics.firstContentfulPaint).toBeLessThan(1500);
});
```

### Example 4: Flakiness Detection

```typescript
test('Detect flaky test', async ({ aiTestUtilities }) => {
  const history = [
    { status: 'passed', duration: 5000, timestamp: '2024-01-01' },
    { status: 'failed', duration: 5200, timestamp: '2024-01-02' },
    { status: 'passed', duration: 4900, timestamp: '2024-01-03' },
  ];
  
  const analysis = await aiTestUtilities.detectFlakiness(
    'Move-in flow test',
    history
  );
  
  if (analysis.isFlaky) {
    console.warn('⚠️ Flaky test detected!');
    console.warn('Reasons:', analysis.reasons);
    console.warn('Suggestions:', analysis.suggestions);
  }
});
```

## 🐛 Debugging

### View AI Analysis
AI analyses are saved to `test-results/ai-insights/`:

```bash
# View latest analysis
cat test-results/ai-insights/ai-failure-*.json
```

### Enable Verbose Logging

```bash
DEBUG=* npm test
```

### Check MCP Connection

```typescript
const isHealthy = await mcpHelper.healthCheck();
console.log('MCP healthy:', isHealthy);
```

## 🔒 Security Notes

1. **API Key Protection**: Never commit `.env` to version control
2. **Rate Limiting**: AI calls are metered - use conditionally
3. **Data Privacy**: Screenshots may contain sensitive data
4. **Cost Management**: Monitor Anthropic API usage

## 📚 Additional Resources

- [Anthropic AI Documentation](https://docs.anthropic.com/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Playwright Documentation](https://playwright.dev/)

## 🤝 Contributing

When adding new AI features:
1. Update `aiTestUtilities.ts` with new methods
2. Add examples to this README
3. Tag tests with `@ai-enhanced`
4. Update type definitions in `pg_page_base.ts`

## 📞 Support

For AI framework issues:
- Check `test-results/ai-test-summary.md` for insights
- Review console output for AI analysis
- Verify `ANTHROPIC_API_KEY` is set correctly

## 🎉 What's Next?

Potential enhancements:
- [ ] AI-powered test generation from user stories
- [ ] Automated test maintenance (self-healing selectors)
- [ ] Integration with CI/CD for trend analysis
- [ ] Visual diff comparisons with AI explanations
- [ ] Natural language test authoring

---

**Happy Testing with AI! 🚀🤖**
