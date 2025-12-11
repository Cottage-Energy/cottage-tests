import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Page } from '@playwright/test';

/**
 * MCP Playwright Helper
 * Integrates Model Context Protocol for advanced browser automation
 */
export class MCPPlaywrightHelper {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize MCP connection
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ MCP already initialized');
      return;
    }

    try {
      console.log('🔌 Initializing MCP Playwright server...');

      this.transport = new StdioClientTransport({
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-playwright'],
      });

      this.client = new Client(
        {
          name: 'cottage-test-framework',
          version: '1.0.0',
        },
        {
          capabilities: {
            sampling: {},
          },
        }
      );

      await this.client.connect(this.transport);
      this.isInitialized = true;
      console.log('✅ MCP Playwright server initialized');
    } catch (error) {
      console.error('❌ MCP initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check if MCP is initialized
   */
  private ensureInitialized(): void {
    if (!this.client || !this.isInitialized) {
      throw new Error('MCP client not initialized. Call initialize() first.');
    }
  }

  /**
   * Navigate to URL using MCP
   */
  async navigate(url: string): Promise<void> {
    this.ensureInitialized();
    
    try {
      console.log(`🔗 MCP navigating to: ${url}`);
      await this.client!.callTool({
        name: 'playwright_navigate',
        arguments: { url },
      });
    } catch (error) {
      console.error('❌ MCP navigation failed:', error);
      throw error;
    }
  }

  /**
   * Take screenshot using MCP
   */
  async screenshot(selector?: string, fullPage: boolean = false): Promise<Buffer> {
    this.ensureInitialized();

    try {
      const result: any = await this.client!.callTool({
        name: 'playwright_screenshot',
        arguments: { 
          selector: selector || 'body',
          fullPage 
        },
      });

      if (result.content && result.content[0] && result.content[0].type === 'text') {
        return Buffer.from(result.content[0].text, 'base64');
      }

      throw new Error('Invalid screenshot response');
    } catch (error) {
      console.error('❌ MCP screenshot failed:', error);
      throw error;
    }
  }

  /**
   * Click element using MCP
   */
  async click(selector: string): Promise<void> {
    this.ensureInitialized();

    try {
      console.log(`🖱️ MCP clicking: ${selector}`);
      await this.client!.callTool({
        name: 'playwright_click',
        arguments: { selector },
      });
    } catch (error) {
      console.error('❌ MCP click failed:', error);
      throw error;
    }
  }

  /**
   * Fill input using MCP
   */
  async fill(selector: string, value: string): Promise<void> {
    this.ensureInitialized();

    try {
      console.log(`⌨️ MCP filling: ${selector}`);
      await this.client!.callTool({
        name: 'playwright_fill',
        arguments: { selector, value },
      });
    } catch (error) {
      console.error('❌ MCP fill failed:', error);
      throw error;
    }
  }

  /**
   * Evaluate JavaScript using MCP
   */
  async evaluate(expression: string): Promise<any> {
    this.ensureInitialized();

    try {
      const result = await this.client!.callTool({
        name: 'playwright_evaluate',
        arguments: { expression },
      });

      return this.parseToolResult(result);
    } catch (error) {
      console.error('❌ MCP evaluate failed:', error);
      throw error;
    }
  }

  /**
   * Execute complex browser interactions using natural language
   * This leverages MCP's ability to understand context and perform actions
   */
  async executeAction(description: string): Promise<any> {
    this.ensureInitialized();

    try {
      console.log(`🤖 MCP executing: ${description}`);
      
      // MCP can interpret natural language commands
      const result = await this.client!.callTool({
        name: 'playwright_action',
        arguments: { action: description },
      });

      return this.parseToolResult(result);
    } catch (error) {
      console.error('❌ MCP action execution failed:', error);
      throw error;
    }
  }

  /**
   * Get page accessibility tree
   */
  async getAccessibilityTree(): Promise<any> {
    this.ensureInitialized();

    try {
      const result = await this.client!.callTool({
        name: 'playwright_accessibility',
        arguments: {},
      });

      return this.parseToolResult(result);
    } catch (error) {
      console.error('❌ MCP accessibility tree failed:', error);
      throw error;
    }
  }

  /**
   * Wait for selector using MCP
   */
  async waitForSelector(selector: string, timeout: number = 30000): Promise<void> {
    this.ensureInitialized();

    try {
      console.log(`⏳ MCP waiting for: ${selector}`);
      await this.client!.callTool({
        name: 'playwright_wait_for_selector',
        arguments: { selector, timeout },
      });
    } catch (error) {
      console.error('❌ MCP wait failed:', error);
      throw error;
    }
  }

  /**
   * Get console messages from browser
   */
  async getConsoleMessages(): Promise<string[]> {
    this.ensureInitialized();

    try {
      const result = await this.client!.callTool({
        name: 'playwright_console',
        arguments: {},
      });

      return this.parseToolResult(result);
    } catch (error) {
      console.error('❌ MCP console messages failed:', error);
      return [];
    }
  }

  /**
   * Advanced: Generate realistic test data using browser automation
   * Navigate to utility sites to scrape realistic data formats
   */
  async generateRealisticUtilityData(utilityType: string): Promise<any> {
    this.ensureInitialized();

    try {
      console.log(`🔍 Generating realistic data for: ${utilityType}`);
      
      // This could navigate to actual utility sites to understand data formats
      // For now, return structured placeholder
      const utilityDataMaps: { [key: string]: any } = {
        BGE: {
          accountNumberFormat: /^\d{10}$/,
          phoneFormat: '(XXX) XXX-XXXX',
          serviceAddressRequired: true,
        },
        NGMA: {
          accountNumberFormat: /^\d{12}$/,
          phoneFormat: 'XXX-XXX-XXXX',
          serviceAddressRequired: true,
        },
        EVERSOURCE: {
          accountNumberFormat: /^\d{9}$/,
          phoneFormat: '(XXX) XXX-XXXX',
          serviceAddressRequired: true,
        },
        DTE: {
          accountNumberFormat: /^\d{11}$/,
          phoneFormat: 'XXX.XXX.XXXX',
          serviceAddressRequired: true,
        },
      };

      return utilityDataMaps[utilityType] || { accountNumberFormat: /^\d{10}$/ };
    } catch (error) {
      console.error('❌ Data generation failed:', error);
      return {};
    }
  }

  /**
   * Visual regression testing with MCP
   */
  async compareScreenshots(
    baseline: Buffer,
    current: Buffer,
    threshold: number = 0.1
  ): Promise<{ match: boolean; difference: number }> {
    this.ensureInitialized();

    try {
      // This would integrate with visual comparison tools
      // For now, basic comparison
      const match = baseline.equals(current);
      const difference = match ? 0 : 1;

      return { match: difference <= threshold, difference };
    } catch (error) {
      console.error('❌ Screenshot comparison failed:', error);
      return { match: false, difference: 1 };
    }
  }

  /**
   * Network request monitoring
   */
  async getNetworkRequests(): Promise<Array<{
    url: string;
    method: string;
    status: number;
    duration: number;
  }>> {
    this.ensureInitialized();

    try {
      const result = await this.client!.callTool({
        name: 'playwright_network',
        arguments: {},
      });

      return this.parseToolResult(result);
    } catch (error) {
      console.error('❌ Network monitoring failed:', error);
      return [];
    }
  }

  /**
   * Performance metrics collection
   */
  async getPerformanceMetrics(): Promise<{
    loadTime: number;
    domContentLoaded: number;
    firstPaint: number;
    firstContentfulPaint: number;
  }> {
    this.ensureInitialized();

    try {
      const result = await this.client!.callTool({
        name: 'playwright_performance',
        arguments: {},
      });

      return this.parseToolResult(result);
    } catch (error) {
      console.error('❌ Performance metrics failed:', error);
      return {
        loadTime: 0,
        domContentLoaded: 0,
        firstPaint: 0,
        firstContentfulPaint: 0,
      };
    }
  }

  /**
   * Close MCP connection
   */
  async close(): Promise<void> {
    if (this.client && this.isInitialized) {
      try {
        console.log('🔌 Closing MCP connection...');
        await this.client.close();
        this.client = null;
        this.transport = null;
        this.isInitialized = false;
        console.log('✅ MCP connection closed');
      } catch (error) {
        console.error('❌ Error closing MCP:', error);
      }
    }
  }

  /**
   * Parse tool result from MCP response
   */
  private parseToolResult(result: any): any {
    if (!result.content || result.content.length === 0) {
      return null;
    }

    const content = result.content[0];
    if (content.type === 'text') {
      try {
        return JSON.parse(content.text);
      } catch {
        return content.text;
      }
    }

    return content;
  }

  /**
   * Health check for MCP connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      this.ensureInitialized();
      // Simple ping operation
      await this.client!.callTool({
        name: 'playwright_evaluate',
        arguments: { expression: 'true' },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get MCP server capabilities
   */
  async getCapabilities(): Promise<any> {
    this.ensureInitialized();

    try {
      const capabilities = await this.client!.listTools();
      console.log('🔧 Available MCP tools:', capabilities);
      return capabilities;
    } catch (error) {
      console.error('❌ Failed to get capabilities:', error);
      return {};
    }
  }
}

/**
 * Singleton instance for global MCP access
 */
export class MCPManager {
  private static instance: MCPPlaywrightHelper | null = null;

  static async getInstance(): Promise<MCPPlaywrightHelper> {
    if (!this.instance) {
      this.instance = new MCPPlaywrightHelper();
      await this.instance.initialize();
    }
    return this.instance;
  }

  static async closeInstance(): Promise<void> {
    if (this.instance) {
      await this.instance.close();
      this.instance = null;
    }
  }
}
