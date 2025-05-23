# Sepet Takip End-to-End Tests

This directory contains end-to-end tests for the Sepet Takip application. The tests use Playwright to test the application's functionality from a user's perspective.

## Test Structure

The tests are organized into several files based on user roles and functionality:

- `admin.spec.ts`: Tests for admin user functionality
- `courier.spec.ts`: Tests for courier user functionality
- `business.spec.ts`: Tests for business user functionality
- `customer.spec.ts`: Tests for customer user functionality
- `auth-system.spec.ts`: Tests for authentication system functionality
- `test-runner.spec.ts`: A test runner that executes all tests and generates a report
- `test-data-setup.ts`: A script to set up test data before running tests

## Requirements

- Node.js v18 or later
- Playwright
- A running instance of the Sepet Takip application
- A test database (SQLite or PostgreSQL)

## Setting Up Test Data

Before running the tests, you need to set up test data. This can be done by running:

```bash
npx ts-node tests/e2e/test-data-setup.ts
```

This will create test users, businesses, products, orders, and deliveries in the database.

## Running Tests

You can run all tests with the following command:

```bash
npx playwright test
```

Or run a specific test with:

```bash
npx playwright test tests/e2e/admin.spec.ts
```

To run tests and generate a report, use:

```bash
npx playwright test tests/e2e/test-runner.spec.ts
```

The report will be generated in `app/page-manual-check/page-manual-check.md`.

## Test Accounts

The tests use the following test accounts:

- Admin: admin1@example.com / Test123
- Courier: courier1@example.com / Test123
- Business: business1@example.com / Test123
- Customer: customer1@example.com / Test123

These accounts are created by the `test-data-setup.ts` script.

## Test Environment

The tests are designed to run against a local development environment with the following configuration:

- Next.js server running on http://localhost:3000
- Database: SQLite (in development) or PostgreSQL (in production)
- API endpoints: /api/*

## Debugging Tests

You can run tests in debug mode to see what's happening in the browser:

```bash
npx playwright test --debug
```

Or to see the browser while the tests are running:

```bash
npx playwright test --headed
```

## Adding New Tests

When adding new tests, follow these guidelines:

1. Create a new test file or add to an existing one based on functionality
2. Use the same structure as the existing tests
3. Make sure to add appropriate assertions
4. Update the test report in the `appendToReport` function

## CI/CD Integration

The tests can be integrated into a CI/CD pipeline to run automatically on each pull request or deployment. Set up the CI config to:

1. Start the application
2. Set up test data
3. Run the tests
4. Generate and store the report

## Report Format

The test report includes:

- Test environment information
- Summary of test results
- Detailed results for each test
- Timestamp of test execution

The report is appended to the `page-manual-check.md` file after each test run. 