---
name: new-fixture
description: Create a new Playwright fixture or database query module
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Create a New Fixture

## Fixture Types

### A. Database Query Module
Place in `tests/resources/fixtures/database/{name}Queries.ts`

```typescript
import { createClient } from '../../utils/supabase';
import { createLogger } from '../../utils/logger';

const log = createLogger('ModuleQueries');

export class ModuleQueries {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  async getRecord(id: string): Promise<RecordType> {
    log.info('Fetching record', { id });
    const { data, error } = await this.supabase
      .from('table_name')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      log.error('Failed to fetch record', { id, error: error.message });
      throw error;
    }
    return data;
  }
}
```

After creating, export from `tests/resources/fixtures/database/index.ts`.

### B. Test Utility Fixture
Place in `tests/resources/fixtures/{name}Utilities.ts`

Follow patterns from `paymentUtilities.ts` or `billUploadUtilities.ts`.

### C. Playwright Custom Fixture
Extend the base fixture in `tests/resources/page_objects/base/baseFixture.ts` to add new fixture parameters available to all tests.

## Rules
- Use structured logger with `createLogger('ModuleName')` — never `console.log`
- Type all parameters and return values — no `any`
- Use `TIMEOUTS` and `RETRY_CONFIG` constants for waits and retries
- Export from the appropriate barrel `index.ts`
- Handle errors with meaningful log messages
