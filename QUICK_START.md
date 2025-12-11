# 🚀 Quick Start Guide - AI-Enhanced Testing

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Run Your First AI-Enhanced Test

```bash
# Run the AI-enhanced smoke test
npx playwright test --grep @ai-enhanced
```

## Step 3: View AI Analysis

After tests complete, check:

```bash
# View AI summary
cat test-results/ai-test-summary.md

# View JSON report
cat test-results/ai-test-report.json
```

## Step 4: Try MCP Integration

Create a simple test with MCP:

```typescript
import { test } from '../resources/page_objects/base/pg_page_base';

test('MCP demo', async ({ mcpHelper, page }) => {
  // Initialize MCP
  await mcpHelper.initialize();
  
  // Navigate
  await page.goto('/');
  
  // Get performance metrics
  const metrics = await mcpHelper.getPerformanceMetrics();
  console.log('Performance:', metrics);
  
  // Take screenshot
  const screenshot = await mcpHelper.screenshot();
  console.log('Screenshot captured');
});
```

## Common Commands

```bash
# Run all tests with AI reporting
npm test

# Run only AI-enhanced tests
npm test -- --grep @ai-enhanced

# Run with headed browser to see AI in action
npm test -- --headed --grep @ai-enhanced

# View HTML report
npm run test:report
```

## Troubleshooting

### No AI Analysis?
Check if `ANTHROPIC_API_KEY` is set:
```bash
echo $env:ANTHROPIC_API_KEY  # PowerShell
```

### MCP Not Working?
Ensure MCP server is installed:
```bash
npx -y @modelcontextprotocol/server-playwright --version
```

### Test Failures?
AI automatically analyzes failures! Check console output for:
- 🤖 AI Analysis section
- Root cause identification
- Suggested fixes

## Next Steps

1. ✅ Review [AI_FRAMEWORK_README.md](./AI_FRAMEWORK_README.md) for full documentation
2. ✅ Check existing AI-enhanced test: `tests/e2e_tests/move_in/workflows/move_in_shortcode.spec.ts`
3. ✅ Create your own AI-enhanced tests
4. ✅ Review AI insights after each test run

## Example Test Scenarios

### Scenario 1: Basic AI Failure Analysis
```typescript
test('Test with AI analysis', async ({ page, aiTestUtilities }) => {
  // This will automatically get AI analysis if it fails
  await page.goto('/move-in');
  await page.click('button[type="submit"]'); // If this fails, AI analyzes why
});
```

### Scenario 2: Flow Validation
```typescript
test('Validate user journey', async ({ page, aiTestUtilities }) => {
  await page.goto('/move-in');
  
  const validation = await aiTestUtilities.validateTestFlow(
    page,
    ['Welcome', 'Address Entry', 'Service Selection', 'Payment'],
    0 // Currently at step 0 (Welcome)
  );
  
  if (!validation.isValid) {
    console.warn('Issues found:', validation.issues);
  }
});
```

### Scenario 3: Test Data Generation
```typescript
test('Edge case testing', async ({ aiTestUtilities }) => {
  const variations = await aiTestUtilities.generateTestDataVariations(
    'BGE',
    'Electric service signup with edge cases'
  );
  
  console.log(`Testing ${variations.length} scenarios:`);
  for (const v of variations) {
    console.log(`- ${v.name}: ${v.description}`);
  }
});
```

## 🎯 Success Metrics

After running tests, you should see:
- ✅ AI analysis in console for failed tests
- ✅ `test-results/ai-test-summary.md` generated
- ✅ `test-results/ai-test-report.json` created
- ✅ Detailed insights with confidence scores

## 📊 Understanding AI Output

### Console Output Example:
```
╔════════════════════════════════════════════════════════╗
║          🤖 AI FAILURE ANALYSIS                        ║
╠════════════════════════════════════════════════════════╣
║ Root Cause: Element not found due to timing issue...  ║
║ Flaky Test: YES ⚠️                                     ║
║ Confidence: 85%                                        ║
╚════════════════════════════════════════════════════════╝

💡 Suggested Fix: Add explicit wait before clicking
await page.waitForSelector('button[type="submit"]', { state: 'visible' });

📋 Recommendations:
   1. Increase timeout for slow network conditions
   2. Add retry logic for transient failures
   3. Consider using data-testid attributes
```

---

**Ready to supercharge your testing with AI! 🚀**
