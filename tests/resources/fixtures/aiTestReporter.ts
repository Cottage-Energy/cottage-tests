import { Reporter, TestCase, TestResult, FullConfig, Suite, FullResult } from '@playwright/test/reporter';
import { AITestUtilities } from './aiTestUtilities';
import * as fs from 'fs';
import * as path from 'path';

/**
 * AI-Powered Test Reporter
 * Generates intelligent test run summaries and insights using AI
 */
class AITestReporter implements Reporter {
  private testResults: Array<{
    test: string;
    file: string;
    status: string;
    duration: number;
    error?: string;
    retries: number;
    startTime: Date;
    endTime: Date;
  }> = [];

  private config: FullConfig | null = null;
  private startTime: Date = new Date();
  private suite: Suite | null = null;

  /**
   * Called once before running tests
   */
  onBegin(config: FullConfig, suite: Suite): void {
    this.config = config;
    this.suite = suite;
    this.startTime = new Date();
    
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║        🤖 AI-ENHANCED TEST RUN STARTED                       ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║  Workers: ${config.workers}`);
    console.log(`║  Projects: ${config.projects.length}`);
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
  }

  /**
   * Called for each test
   */
  onTestBegin(test: TestCase, result: TestResult): void {
    console.log(`\n▶️  ${test.title}`);
  }

  /**
   * Called after each test completes
   */
  onTestEnd(test: TestCase, result: TestResult): void {
    const status = result.status;
    const emoji = this.getStatusEmoji(status);
    
    this.testResults.push({
      test: test.title,
      file: test.location.file,
      status: status,
      duration: result.duration,
      error: result.error?.message,
      retries: result.retry,
      startTime: new Date(result.startTime),
      endTime: new Date(result.startTime.getTime() + result.duration),
    });

    console.log(`${emoji}  ${test.title} - ${status} (${result.duration}ms)`);
    
    if (result.error) {
      console.log(`   ❌ ${result.error.message}`);
    }

    if (result.retry > 0) {
      console.log(`   🔄 Retried ${result.retry} time(s)`);
    }
  }

  /**
   * Called after all tests complete
   */
  async onEnd(result: FullResult): Promise<void> {
    const endTime = new Date();
    const duration = endTime.getTime() - this.startTime.getTime();

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║        🤖 AI-ENHANCED TEST RUN COMPLETED                     ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // Generate statistics
    const stats = this.generateStatistics();
    this.printStatistics(stats);

    // Generate AI summary if API key is available
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        console.log('\n🤖 Generating AI analysis of test run...\n');
        const summary = await AITestUtilities.generateTestSummary(this.testResults);
        
        // Save summary to file
        const outputDir = this.config?.metadata?.outputDir || 'test-results';
        const summaryPath = path.join(outputDir as string, 'ai-test-summary.md');
        
        const fullSummary = this.buildFullSummary(summary, stats, duration);
        
        fs.writeFileSync(summaryPath, fullSummary);
        
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║               📊 AI TEST ANALYSIS                            ║');
        console.log('╚══════════════════════════════════════════════════════════════╝\n');
        console.log(summary);
        console.log(`\n💾 Full AI summary saved to: ${summaryPath}\n`);
        
        // Save JSON report for programmatic access
        const jsonPath = path.join(outputDir as string, 'ai-test-report.json');
        fs.writeFileSync(
          jsonPath,
          JSON.stringify(
            {
              timestamp: new Date().toISOString(),
              duration,
              statistics: stats,
              testResults: this.testResults,
              aiSummary: summary,
            },
            null,
            2
          )
        );
        
        console.log(`📋 JSON report saved to: ${jsonPath}\n`);
      } catch (error) {
        console.error('❌ Failed to generate AI summary:', error);
      }
    } else {
      console.log('⚠️  ANTHROPIC_API_KEY not set. AI summary generation skipped.\n');
    }
  }

  /**
   * Generate test statistics
   */
  private generateStatistics(): {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    flaky: number;
    passRate: number;
    avgDuration: number;
    slowestTests: Array<{ test: string; duration: number }>;
    failedTests: Array<{ test: string; error: string }>;
  } {
    const total = this.testResults.length;
    const passed = this.testResults.filter((t) => t.status === 'passed').length;
    const failed = this.testResults.filter((t) => t.status === 'failed').length;
    const skipped = this.testResults.filter((t) => t.status === 'skipped').length;
    const flaky = this.testResults.filter((t) => t.retries > 0).length;
    
    const passRate = total > 0 ? (passed / total) * 100 : 0;
    const avgDuration = total > 0 
      ? this.testResults.reduce((acc, t) => acc + t.duration, 0) / total 
      : 0;
    
    const slowestTests = [...this.testResults]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5)
      .map((t) => ({ test: t.test, duration: t.duration }));
    
    const failedTests = this.testResults
      .filter((t) => t.status === 'failed')
      .map((t) => ({ test: t.test, error: t.error || 'Unknown error' }));

    return {
      total,
      passed,
      failed,
      skipped,
      flaky,
      passRate,
      avgDuration,
      slowestTests,
      failedTests,
    };
  }

  /**
   * Print statistics to console
   */
  private printStatistics(stats: ReturnType<typeof this.generateStatistics>): void {
    console.log('📊 TEST STATISTICS');
    console.log('─'.repeat(60));
    console.log(`Total Tests:     ${stats.total}`);
    console.log(`✅ Passed:        ${stats.passed} (${stats.passRate.toFixed(1)}%)`);
    console.log(`❌ Failed:        ${stats.failed}`);
    console.log(`⏭️  Skipped:       ${stats.skipped}`);
    console.log(`🔄 Flaky:         ${stats.flaky}`);
    console.log(`⏱️  Avg Duration:  ${stats.avgDuration.toFixed(0)}ms`);
    console.log('─'.repeat(60));

    if (stats.slowestTests.length > 0) {
      console.log('\n🐌 SLOWEST TESTS:');
      stats.slowestTests.forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.test} - ${t.duration}ms`);
      });
    }

    if (stats.failedTests.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      stats.failedTests.forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.test}`);
        console.log(`      Error: ${t.error.substring(0, 100)}...`);
      });
    }
  }

  /**
   * Build full summary document
   */
  private buildFullSummary(
    aiSummary: string,
    stats: ReturnType<typeof this.generateStatistics>,
    duration: number
  ): string {
    const date = new Date().toISOString();
    
    return `# 🤖 AI-Enhanced Test Run Report

**Generated:** ${date}
**Total Duration:** ${(duration / 1000).toFixed(2)}s

## 📊 Summary Statistics

| Metric | Value |
|--------|-------|
| Total Tests | ${stats.total} |
| ✅ Passed | ${stats.passed} (${stats.passRate.toFixed(1)}%) |
| ❌ Failed | ${stats.failed} |
| ⏭️ Skipped | ${stats.skipped} |
| 🔄 Flaky | ${stats.flaky} |
| ⏱️ Avg Duration | ${stats.avgDuration.toFixed(0)}ms |

## 🐌 Slowest Tests

${stats.slowestTests.map((t, i) => `${i + 1}. **${t.test}** - ${t.duration}ms`).join('\n')}

${stats.failedTests.length > 0 ? `
## ❌ Failed Tests

${stats.failedTests.map((t, i) => `${i + 1}. **${t.test}**\n   \`\`\`\n   ${t.error}\n   \`\`\`\n`).join('\n')}
` : ''}

## 🤖 AI Analysis

${aiSummary}

---

*Report generated by AI-Enhanced Playwright Test Framework*
*Powered by Claude 3.5 Sonnet*
`;
  }

  /**
   * Get emoji for test status
   */
  private getStatusEmoji(status: string): string {
    const emojiMap: { [key: string]: string } = {
      passed: '✅',
      failed: '❌',
      skipped: '⏭️',
      timedOut: '⏱️',
      interrupted: '🛑',
    };
    return emojiMap[status] || '❓';
  }

  /**
   * Called when test step begins
   */
  onStepBegin(test: TestCase, result: TestResult, step: any): void {
    // Can be used for detailed step tracking
  }

  /**
   * Called when test step ends
   */
  onStepEnd(test: TestCase, result: TestResult, step: any): void {
    // Can be used for detailed step tracking
  }

  /**
   * Called on stdout output
   */
  onStdOut(chunk: string | Buffer, test?: TestCase, result?: TestResult): void {
    // Can capture console output for AI analysis
  }

  /**
   * Called on stderr output
   */
  onStdErr(chunk: string | Buffer, test?: TestCase, result?: TestResult): void {
    // Can capture error output for AI analysis
  }

  /**
   * Called when an error occurs outside of test execution
   */
  onError(error: any): void {
    console.error('🔥 Unhandled error:', error);
  }
}

export default AITestReporter;
