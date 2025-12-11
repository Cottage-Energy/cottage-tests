import Anthropic from '@anthropic-ai/sdk';
import { Page, TestInfo } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * AI-Powered Test Utilities using Claude
 * Provides intelligent test analysis, failure diagnosis, and test data generation
 */
export class AITestUtilities {
  private static client: Anthropic | null = null;
  private static readonly MAX_RETRIES = 3;
  private static readonly TIMEOUT = 30000;

  /**
   * Get or initialize Anthropic client
   */
  private static getClient(): Anthropic {
    if (!this.client) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY environment variable is not set');
      }
      this.client = new Anthropic({
        apiKey: apiKey,
      });
    }
    return this.client;
  }

  /**
   * AI-powered test failure analysis with screenshot and page context
   * Provides root cause, suggested fixes, and flakiness detection
   */
  static async analyzeFailure(
    page: Page,
    testInfo: TestInfo,
    error: Error
  ): Promise<{
    rootCause: string;
    suggestedFix: string;
    isFlaky: boolean;
    confidence: number;
    recommendations: string[];
  }> {
    try {
      console.log('🤖 AI analyzing test failure...');
      
      // Capture comprehensive failure context
      const screenshot = await page.screenshot({ fullPage: true }).catch(() => null);
      const pageUrl = page.url();
      const pageTitle = await page.title().catch(() => 'Unknown');
      
      // Build context-rich prompt
      const prompt = `Analyze this Playwright test failure and provide detailed insights:

**Test Information:**
- Test Name: ${testInfo.title}
- Test File: ${testInfo.file}
- Project: ${testInfo.project.name}
- Duration: ${testInfo.duration}ms

**Error Details:**
- Message: ${error.message}
- Stack Trace: ${error.stack}

**Page Context:**
- URL: ${pageUrl}
- Title: ${pageTitle}

**Analysis Required:**
1. Root cause analysis - What specifically caused this failure?
2. Suggested fix - Concrete code changes or test improvements
3. Flakiness assessment - Is this likely a flaky test? Why?
4. Confidence level - How confident are you in this analysis (0-100)?
5. Recommendations - Additional steps to prevent similar failures

Provide response in JSON format:
{
  "rootCause": "detailed explanation",
  "suggestedFix": "specific code or configuration changes",
  "isFlaky": boolean,
  "confidence": number,
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}`;

      const messages: Anthropic.MessageCreateParams['messages'] = [
        {
          role: 'user',
          content: screenshot
            ? [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/png',
                    data: screenshot.toString('base64'),
                  },
                },
                {
                  type: 'text',
                  text: prompt,
                },
              ]
            : [{ type: 'text', text: prompt }],
        },
      ];

      const message = await this.getClient().messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: messages,
      });

      const analysis = this.parseAIResponse(message.content);

      // Attach AI analysis to test report
      await testInfo.attach('ai-failure-analysis', {
        body: JSON.stringify(analysis, null, 2),
        contentType: 'application/json',
      });

      // Log analysis to console
      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║          🤖 AI FAILURE ANALYSIS                            ║');
      console.log('╠════════════════════════════════════════════════════════════╣');
      console.log(`║ Root Cause: ${analysis.rootCause.substring(0, 50)}...`);
      console.log(`║ Flaky Test: ${analysis.isFlaky ? 'YES ⚠️' : 'NO ✓'}`);
      console.log(`║ Confidence: ${analysis.confidence}%`);
      console.log('╚════════════════════════════════════════════════════════════╝\n');
      console.log('💡 Suggested Fix:', analysis.suggestedFix);
      console.log('\n📋 Recommendations:');
      analysis.recommendations.forEach((rec: string, i: number) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
      console.log('\n');

      return analysis;
    } catch (aiError) {
      console.error('❌ AI analysis failed:', aiError);
      return {
        rootCause: 'AI analysis unavailable',
        suggestedFix: 'Review error manually',
        isFlaky: false,
        confidence: 0,
        recommendations: ['Check AI service configuration', 'Review error logs manually'],
      };
    }
  }

  /**
   * Generate test data variations using AI for edge case testing
   */
  static async generateTestDataVariations(
    utilityType: string,
    baseScenario: string,
    variationCount: number = 5
  ): Promise<Array<{
    name: string;
    description: string;
    data: any;
    expectedOutcome: string;
    testPriority: 'high' | 'medium' | 'low';
  }>> {
    try {
      console.log(`🤖 AI generating ${variationCount} test data variations for ${utilityType}...`);

      const message = await this.getClient().messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3072,
        messages: [
          {
            role: 'user',
            content: `Generate ${variationCount} edge case test data variations for utility testing:

**Utility Type:** ${utilityType}
**Base Scenario:** ${baseScenario}

Generate realistic test scenarios including:
- Invalid input validation (special characters, SQL injection, XSS)
- Boundary conditions (min/max values, empty fields)
- Data format variations (different phone/SSN/date formats)
- Duplicate data scenarios
- Missing required field combinations
- Rate limiting and concurrent operations

Return as JSON array:
[
  {
    "name": "scenario name",
    "description": "what it tests",
    "data": { test data object with realistic values },
    "expectedOutcome": "expected behavior",
    "testPriority": "high|medium|low"
  }
]

Make data realistic and specific to ${utilityType} utility services.`,
          },
        ],
      });

      const variations = this.parseAIResponse(message.content);
      console.log(`✅ Generated ${variations.length} test variations`);
      return variations;
    } catch (error) {
      console.error('❌ Test data generation failed:', error);
      return [];
    }
  }

  /**
   * Validate test flow using AI vision capabilities
   */
  static async validateTestFlow(
    page: Page,
    expectedFlow: string[],
    currentStepIndex: number
  ): Promise<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
    currentStep: string;
  }> {
    try {
      const screenshot = await page.screenshot({ fullPage: true });
      const pageUrl = page.url();
      const expectedStep = expectedFlow[currentStepIndex];

      const message = await this.getClient().messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: screenshot.toString('base64'),
                },
              },
              {
                type: 'text',
                text: `Validate this test flow step:

**Expected Flow:** ${expectedFlow.join(' → ')}
**Current Step (Expected):** ${expectedStep} (step ${currentStepIndex + 1} of ${expectedFlow.length})
**Page URL:** ${pageUrl}

**Validation Required:**
1. Is the user at the correct step in the flow?
2. Are there any UI issues, errors, or warnings visible?
3. Are required elements present and functional?
4. Any accessibility concerns?

Return JSON:
{
  "isValid": boolean,
  "issues": ["issue 1", "issue 2", ...],
  "suggestions": ["suggestion 1", "suggestion 2", ...],
  "currentStep": "identified current step"
}`,
              },
            ],
          },
        ],
      });

      const validation = this.parseAIResponse(message.content);

      if (!validation.isValid) {
        console.log('⚠️ Flow validation issues detected:');
        validation.issues.forEach((issue: string) => console.log(`   - ${issue}`));
      }

      return validation;
    } catch (error) {
      console.error('❌ Flow validation failed:', error);
      return {
        isValid: true,
        issues: [],
        suggestions: [],
        currentStep: expectedFlow[currentStepIndex],
      };
    }
  }

  /**
   * Generate comprehensive test run summary
   */
  static async generateTestSummary(
    testResults: Array<{
      test: string;
      status: string;
      duration: number;
      error?: string;
      retries?: number;
    }>
  ): Promise<string> {
    try {
      console.log('🤖 Generating AI test summary...');

      const totalTests = testResults.length;
      const passed = testResults.filter((t) => t.status === 'passed').length;
      const failed = testResults.filter((t) => t.status === 'failed').length;
      const skipped = testResults.filter((t) => t.status === 'skipped').length;
      const avgDuration = testResults.reduce((acc, t) => acc + t.duration, 0) / totalTests;

      const message = await this.getClient().messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `Analyze these test results and provide an executive summary:

**Test Statistics:**
- Total Tests: ${totalTests}
- Passed: ${passed} (${((passed / totalTests) * 100).toFixed(1)}%)
- Failed: ${failed} (${((failed / totalTests) * 100).toFixed(1)}%)
- Skipped: ${skipped}
- Average Duration: ${avgDuration.toFixed(0)}ms

**Detailed Results:**
${JSON.stringify(testResults, null, 2)}

**Analysis Required:**
1. Overall test health assessment
2. Common failure patterns and root causes
3. Flakiness indicators (tests with retries or intermittent failures)
4. Performance concerns (slow tests)
5. Recommendations for test suite improvements
6. Priority issues to address

Provide a comprehensive markdown report.`,
          },
        ],
      });

      const summary =
        message.content[0].type === 'text' ? message.content[0].text : 'Summary unavailable';

      return summary;
    } catch (error) {
      console.error('❌ Summary generation failed:', error);
      return '# Test Summary\n\nAI summary generation failed. Please review results manually.';
    }
  }

  /**
   * Detect test flakiness using historical data
   */
  static async detectFlakiness(
    testName: string,
    executionHistory: Array<{
      status: string;
      duration: number;
      timestamp: string;
      error?: string;
    }>
  ): Promise<{
    isFlaky: boolean;
    confidence: number;
    reasons: string[];
    suggestions: string[];
  }> {
    try {
      const message = await this.getClient().messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Analyze this test execution history for flakiness:

**Test:** ${testName}
**Execution History (last ${executionHistory.length} runs):**
${JSON.stringify(executionHistory, null, 2)}

**Analysis:**
1. Is this test flaky? (inconsistent pass/fail pattern)
2. What's your confidence level? (0-100%)
3. What are the likely causes?
4. What fixes would you recommend?

Return JSON:
{
  "isFlaky": boolean,
  "confidence": number,
  "reasons": ["reason 1", "reason 2", ...],
  "suggestions": ["fix 1", "fix 2", ...]
}`,
          },
        ],
      });

      return this.parseAIResponse(message.content);
    } catch (error) {
      console.error('❌ Flakiness detection failed:', error);
      return {
        isFlaky: false,
        confidence: 0,
        reasons: [],
        suggestions: [],
      };
    }
  }

  /**
   * Suggest test refactoring opportunities
   */
  static async suggestRefactoring(
    testFilePath: string,
    testFileContent: string
  ): Promise<{
    suggestions: Array<{
      type: string;
      description: string;
      codeExample: string;
      priority: 'high' | 'medium' | 'low';
    }>;
  }> {
    try {
      console.log(`🤖 Analyzing test file for refactoring opportunities: ${testFilePath}`);

      const message = await this.getClient().messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `Review this Playwright test file and suggest refactoring improvements:

**File:** ${testFilePath}

**Code:**
\`\`\`typescript
${testFileContent}
\`\`\`

**Focus Areas:**
1. Code duplication (extract to utilities/fixtures)
2. Hard-coded values (move to test data files)
3. Missing error handling
4. Poor test isolation
5. Inefficient waits or selectors
6. Missing assertions
7. Test maintainability

Return JSON array:
{
  "suggestions": [
    {
      "type": "duplication|hardcoded|error-handling|isolation|performance|assertions|maintainability",
      "description": "what to improve",
      "codeExample": "suggested code",
      "priority": "high|medium|low"
    }
  ]
}`,
          },
        ],
      });

      return this.parseAIResponse(message.content);
    } catch (error) {
      console.error('❌ Refactoring analysis failed:', error);
      return { suggestions: [] };
    }
  }

  /**
   * Intelligent test selector suggestion
   */
  static async suggestSelector(
    page: Page,
    elementDescription: string
  ): Promise<{
    selector: string;
    alternativeSelectors: string[];
    confidence: number;
    reasoning: string;
  }> {
    try {
      const screenshot = await page.screenshot({ fullPage: true });
      const pageContent = await page.content();

      const message = await this.getClient().messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: screenshot.toString('base64'),
                },
              },
              {
                type: 'text',
                text: `Find the best Playwright selector for this element:

**Element Description:** ${elementDescription}
**Page URL:** ${page.url()}

**Requirements:**
1. Suggest the most reliable selector (prefer data-testid, role, text)
2. Provide 2-3 alternative selectors as fallbacks
3. Explain why this selector is reliable
4. Rate confidence (0-100%)

Return JSON:
{
  "selector": "recommended selector",
  "alternativeSelectors": ["selector 1", "selector 2"],
  "confidence": number,
  "reasoning": "why this selector is best"
}`,
              },
            ],
          },
        ],
      });

      return this.parseAIResponse(message.content);
    } catch (error) {
      console.error('❌ Selector suggestion failed:', error);
      return {
        selector: '',
        alternativeSelectors: [],
        confidence: 0,
        reasoning: 'AI analysis unavailable',
      };
    }
  }

  /**
   * Parse AI response and extract JSON
   */
  private static parseAIResponse(content: Anthropic.ContentBlock[]): any {
    const textContent = content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return {};
    }

    const text = textContent.text;

    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.error('Failed to parse JSON from code block:', e);
      }
    }

    // Try to parse as direct JSON
    try {
      return JSON.parse(text);
    } catch (e) {
      // If not valid JSON, return structured response
      return { raw: text };
    }
  }

  /**
   * Save AI insights to file for later analysis
   */
  static async saveInsights(
    testInfo: TestInfo,
    insights: any,
    type: 'failure' | 'refactoring' | 'summary'
  ): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `ai-${type}-${testInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}-${timestamp}.json`;
      const insightsDir = path.join(testInfo.project.outputDir, 'ai-insights');

      if (!fs.existsSync(insightsDir)) {
        fs.mkdirSync(insightsDir, { recursive: true });
      }

      const filePath = path.join(insightsDir, fileName);
      fs.writeFileSync(
        filePath,
        JSON.stringify(
          {
            test: testInfo.title,
            file: testInfo.file,
            timestamp: new Date().toISOString(),
            type,
            insights,
          },
          null,
          2
        )
      );

      console.log(`💾 AI insights saved to: ${filePath}`);
    } catch (error) {
      console.error('Failed to save AI insights:', error);
    }
  }
}
