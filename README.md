# Cottage Tests

Playwright E2E test suite for the Cottage/PublicGrid platform.

## 🚀 Quick Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS version recommended)
- Git

### Installation
1. Clone the repository (if not already done)
2. Install dependencies:
   ```bash
   npm install
   ```
3. Install Playwright browsers:
   ```bash
   npm run test:install
   ```
4. Configure environment variables:
   - Copy `.env` and fill in your actual values
   - Set `ENV=dev` for development testing

### Running Tests

#### All Tests
```bash
npm test
```

#### Interactive Mode (with browser visible)
```bash
npm run test:headed
```

#### UI Mode (Playwright Test Runner)
```bash
npm run test:ui
```

#### Debug Mode
```bash
npm run test:debug
```

#### View Test Report
```bash
npm run test:report
```

### Environment Configuration
The tests can run against different environments:
- `ENV=dev` - Development environment (default)
- `ENV=staging` - Staging environment  
- `ENV=production` - Production environment

### Test Structure

```
tests/
├── e2e_tests/              # End-to-end test specs
│   ├── connect-account/    # Account connection tests
│   ├── cottage-user-move-in/ # Move-in flow tests
│   ├── homepage/           # Homepage tests
│   ├── light-user-move-in/ # Light user tests
│   └── payment/            # Payment tests
│
└── resources/              # Shared test resources
    ├── api/                # API utilities
    ├── data/               # Test data files (JSON)
    ├── documentation/      # Test documentation
    │
    ├── types/              # TypeScript type definitions
    │   ├── index.ts        # Barrel export
    │   ├── moveIn.types.ts # Move-in types
    │   ├── user.types.ts   # User/payment types
    │   └── database.types.ts # DB record types
    │
    ├── constants/          # Centralized constants
    │   ├── index.ts        # Barrel export
    │   ├── timeouts.ts     # Timeout values
    │   ├── testTags.ts     # Test tag arrays
    │   └── companies.ts    # Utility companies
    │
    ├── fixtures/           # Test utilities & fixtures
    │   ├── index.ts        # Central exports
    │   ├── database/       # Modular DB queries
    │   ├── moveIn/         # Modular move-in utils
    │   └── *.ts            # Other utilities
    │
    ├── page_objects/       # Page Object Model
    │   ├── index.ts        # Central exports
    │   ├── base/           # Base fixtures
    │   └── *_page.ts       # Page classes
    │
    └── utils/              # General utilities
```

### Key Features
- Multi-browser testing (Chrome, Firefox, Safari)
- Parallel test execution
- Screenshots on failure
- HTML test reports
- Database integration via Supabase
- Email testing via Fastmail
- Modular, type-safe architecture

### Migration Guide
See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for information about the new modular architecture and how to update existing tests.
