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
- `tests/e2e_tests/` - End-to-end test files
- `tests/resources/` - Shared utilities, fixtures, and page objects
- `tests/resources/page_objects/` - Page Object Model classes
- `tests/resources/fixtures/` - Test utilities and helpers
- `tests/resources/data/` - Test data files

### Key Features
- Multi-browser testing (Chrome, Firefox, Safari)
- Parallel test execution
- Screenshots on failure
- HTML test reports
- Database integration via Supabase
- Email testing via Fastmail
- Project management integration via Plane.so
