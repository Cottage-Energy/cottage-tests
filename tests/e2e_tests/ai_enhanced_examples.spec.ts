import { test, expect } from '../resources/page_objects/base/pg_page_base';

/**
 * AI-Enhanced Test Examples
 * 
 * This file demonstrates various AI capabilities:
 * - Automatic failure analysis
 * - Flow validation
 * - Test data generation
 * - Selector suggestions
 * - MCP integration
 */

test.describe('AI-Enhanced Test Examples', () => {
  
  /**
   * Example 1: Basic AI Failure Analysis
   * If this test fails, AI automatically analyzes the failure
   */
  test('Example 1: Automatic AI failure analysis', {
    tag: '@ai-enhanced',
  }, async ({ page, aiTestUtilities }) => {
    await page.goto('/');
    
    // If any assertion fails, AI will analyze it in afterEach
    await expect(page).toHaveTitle(/Cottage/);
  });

  /**
   * Example 2: Flow Validation
   * AI validates that the user is at the correct step in the flow
   */
  test('Example 2: AI flow validation', {
    tag: '@ai-enhanced',
  }, async ({ page, aiTestUtilities }) => {
    await page.goto('/move-in');
    
    // AI validates we're at the correct flow step
    if (process.env.ANTHROPIC_API_KEY) {
      const validation = await aiTestUtilities.validateTestFlow(
        page,
        ['Landing Page', 'Move In Form', 'Address Entry', 'Service Selection'],
        0 // We expect to be at step 0 (Landing Page)
      );
      
      expect(validation.isValid, 
        `Flow validation failed: ${validation.issues.join(', ')}`
      ).toBeTruthy();
      
      console.log('✅ Flow validated:', validation.currentStep);
      
      if (validation.suggestions.length > 0) {
        console.log('💡 Suggestions:', validation.suggestions);
      }
    }
  });

  /**
   * Example 3: Test Data Generation
   * AI generates edge case test scenarios
   */
  test('Example 3: AI test data generation', {
    tag: '@ai-enhanced',
  }, async ({ aiTestUtilities }) => {
    if (!process.env.ANTHROPIC_API_KEY) {
      test.skip();
    }
    
    const variations = await aiTestUtilities.generateTestDataVariations(
      'BGE',
      'New user electric service signup',
      3 // Generate 3 variations
    );
    
    console.log('\n🤖 AI Generated Test Scenarios:');
    variations.forEach((v, i) => {
      console.log(`\n${i + 1}. ${v.name}`);
      console.log(`   Description: ${v.description}`);
      console.log(`   Priority: ${v.testPriority}`);
      console.log(`   Expected: ${v.expectedOutcome}`);
      console.log(`   Data:`, JSON.stringify(v.data, null, 2));
    });
    
    expect(variations.length).toBeGreaterThan(0);
  });

  /**
   * Example 4: Selector Suggestion
   * AI suggests the best selector for an element
   */
  test('Example 4: AI selector suggestion', {
    tag: '@ai-enhanced',
  }, async ({ page, aiTestUtilities }) => {
    if (!process.env.ANTHROPIC_API_KEY) {
      test.skip();
    }
    
    await page.goto('/');
    
    const selectorInfo = await aiTestUtilities.suggestSelector(
      page,
      'Main navigation menu'
    );
    
    console.log('\n🤖 AI Selector Recommendation:');
    console.log('Recommended:', selectorInfo.selector);
    console.log('Alternatives:', selectorInfo.alternativeSelectors);
    console.log('Confidence:', selectorInfo.confidence + '%');
    console.log('Reasoning:', selectorInfo.reasoning);
    
    // Use the AI-suggested selector
    if (selectorInfo.selector) {
      const element = await page.locator(selectorInfo.selector);
      await expect(element).toBeVisible();
    }
  });

  /**
   * Example 5: MCP Integration
   * Use Model Context Protocol for advanced automation
   */
  test('Example 5: MCP browser automation', {
    tag: '@ai-enhanced',
  }, async ({ page, mcpHelper }) => {
    // Initialize MCP
    await mcpHelper.initialize();
    
    // Check health
    const isHealthy = await mcpHelper.healthCheck();
    console.log('MCP Health:', isHealthy ? '✅ Healthy' : '❌ Unhealthy');
    
    // Get capabilities
    const capabilities = await mcpHelper.getCapabilities();
    console.log('MCP Capabilities:', capabilities);
    
    await page.goto('/');
    
    // Get performance metrics
    const metrics = await mcpHelper.getPerformanceMetrics();
    console.log('\n📊 Performance Metrics:');
    console.log('Load Time:', metrics.loadTime, 'ms');
    console.log('DOM Content Loaded:', metrics.domContentLoaded, 'ms');
    console.log('First Paint:', metrics.firstPaint, 'ms');
    console.log('First Contentful Paint:', metrics.firstContentfulPaint, 'ms');
    
    // Performance assertions
    expect(metrics.loadTime).toBeLessThan(5000);
  });

  /**
   * Example 6: Combined AI Features
   * Demonstrates using multiple AI features together
   */
  test('Example 6: Combined AI features', {
    tag: '@ai-enhanced',
  }, async ({ page, aiTestUtilities, mcpHelper }) => {
    if (!process.env.ANTHROPIC_API_KEY) {
      test.skip();
    }
    
    await mcpHelper.initialize();
    await page.goto('/move-in');
    
    // Step 1: Validate flow
    console.log('\n📍 Step 1: Validating flow...');
    const flowValidation = await aiTestUtilities.validateTestFlow(
      page,
      ['Welcome', 'Form Entry'],
      0
    );
    expect(flowValidation.isValid).toBeTruthy();
    
    // Step 2: Get performance metrics
    console.log('\n📊 Step 2: Collecting performance metrics...');
    const metrics = await mcpHelper.getPerformanceMetrics();
    console.log('Page loaded in', metrics.loadTime, 'ms');
    
    // Step 3: Take screenshot for visual validation
    console.log('\n📸 Step 3: Capturing screenshot...');
    const screenshot = await mcpHelper.screenshot(undefined, true);
    expect(screenshot).toBeDefined();
    
    // Step 4: Check accessibility
    console.log('\n♿ Step 4: Checking accessibility...');
    const a11yTree = await mcpHelper.getAccessibilityTree();
    console.log('Accessibility tree retrieved');
    
    console.log('\n✅ All AI validations passed!');
  });

  /**
   * Example 7: Flakiness Detection
   * Analyze test execution history for flakiness
   */
  test('Example 7: Flakiness detection', {
    tag: '@ai-enhanced',
  }, async ({ aiTestUtilities }) => {
    if (!process.env.ANTHROPIC_API_KEY) {
      test.skip();
    }
    
    // Simulate test execution history
    const history = [
      { status: 'passed', duration: 5000, timestamp: '2024-12-01T10:00:00Z' },
      { status: 'failed', duration: 5200, timestamp: '2024-12-02T10:00:00Z', error: 'Timeout' },
      { status: 'passed', duration: 4900, timestamp: '2024-12-03T10:00:00Z' },
      { status: 'failed', duration: 5100, timestamp: '2024-12-04T10:00:00Z', error: 'Element not found' },
      { status: 'passed', duration: 5050, timestamp: '2024-12-05T10:00:00Z' },
    ];
    
    const analysis = await aiTestUtilities.detectFlakiness(
      'Move-in form submission',
      history
    );
    
    console.log('\n🔍 Flakiness Analysis:');
    console.log('Is Flaky:', analysis.isFlaky ? '⚠️ YES' : '✅ NO');
    console.log('Confidence:', analysis.confidence + '%');
    
    if (analysis.isFlaky) {
      console.log('\n❗ Reasons:');
      analysis.reasons.forEach((r, i) => console.log(`   ${i + 1}. ${r}`));
      
      console.log('\n💡 Suggestions:');
      analysis.suggestions.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));
    }
  });

  /**
   * Example 8: Test Refactoring Suggestions
   * AI analyzes test code and suggests improvements
   */
  test('Example 8: Refactoring suggestions', {
    tag: '@ai-enhanced',
  }, async ({ aiTestUtilities }) => {
    if (!process.env.ANTHROPIC_API_KEY) {
      test.skip();
    }
    
    const testCode = `
test('Sample test', async ({ page }) => {
  await page.goto('http://localhost:3000/move-in');
  await page.waitForTimeout(5000);
  await page.click('.submit-button');
  await page.waitForTimeout(3000);
  const text = await page.locator('.message').textContent();
  console.log(text);
});
    `;
    
    const suggestions = await aiTestUtilities.suggestRefactoring(
      'sample.spec.ts',
      testCode
    );
    
    console.log('\n🔧 Refactoring Suggestions:');
    suggestions.suggestions.forEach((s, i) => {
      console.log(`\n${i + 1}. [${s.priority.toUpperCase()}] ${s.type}`);
      console.log(`   ${s.description}`);
      console.log(`   Example:\n${s.codeExample}`);
    });
    
    expect(suggestions.suggestions.length).toBeGreaterThan(0);
  });
});

/**
 * Utility test to demonstrate AI failure analysis
 * This test is designed to fail and trigger AI analysis
 */
test('Example 9: Intentional failure for AI demo', {
  tag: ['@ai-enhanced', '@demo-failure'],
}, async ({ page, aiTestUtilities }) => {
  test.skip(); // Skip by default, uncomment to test AI failure analysis
  
  await page.goto('/non-existent-page');
  
  // This will fail and trigger AI analysis
  await expect(page.locator('.non-existent-element')).toBeVisible();
});
