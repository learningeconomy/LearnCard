# LearnCard LTI 1.3 Testing Framework

This directory contains a comprehensive testing framework for the LearnCard LTI 1.3 implementation. These tests validate that the LTI functionality adheres to the IMS Global specifications and works correctly within the LearnCard ecosystem.

## Test Architecture

The LTI tests are designed with a flexible architecture that allows them to run in different modes:

1. **Mock Mode**: Tests run with mock dependencies, allowing them to execute without actual MongoDB connections, Docker containers, or external services. This is the default mode and is ideal for CI/CD pipelines.

2. **Integration Mode**: Tests run against actual services in a Docker environment, providing end-to-end validation. This requires starting the Docker containers with `docker compose up`.

## Test Files

The LTI tests are organized into several files:

1. **lti.spec.ts** - Core LTI test suite that tests basic functionality
2. **enhanced-lti-conformance.spec.ts** - Comprehensive IMS Global LTI 1.3 conformance tests
3. **lti-performance.spec.ts** - Performance and load testing for the LTI implementation

### Helper Files

- **helpers/lti.helpers.ts** - Core LTI testing utilities for integration testing
- **helpers/lti-conformance.helpers.ts** - Mock database and helpers for isolated testing
- **helpers/lti-platform-mock.ts** - A mock LTI platform for simulating LMS behaviors

## Running the Tests

### Mock Mode (No Dependencies)

The mock mode allows you to run tests without any external dependencies:

```bash
# Run all LTI tests in mock mode
pnpm test:lti:all

# Run specific test files
pnpm test:lti:conformance
pnpm test:lti:performance
```

### Integration Mode (With Docker Environment)

For integration testing with actual services:

```bash
# First, start the Docker environment
cd tests/e2e
docker compose up -d

# Wait for all services to be ready
# You can check the status with:
docker compose ps

# Run all LTI tests
pnpm test:lti:all
```

## Test Categories

### Core Functionality Tests (lti.spec.ts)

The main LTI test suite tests:

- JWKS and configuration endpoints
- OIDC login flow
- Launch flow for both resource links and deep linking
- LearnCard integration with the LTI system
- Security validations

### Enhanced Conformance Tests (enhanced-lti-conformance.spec.ts)

The enhanced conformance tests provide comprehensive validation against the IMS Global LTI 1.3 specification:

- JWKS endpoint requirements with detailed key validation
- OIDC flow requirements with complete parameter validation
- Launch flow requirements for different message types
- Comprehensive context type and role handling
- Detailed security validation
- Token validation
- Custom parameters handling
- Platform integration testing

#### Platform Coverage

The conformance tests validate against multiple LMS platforms:

- IMS Global Reference Implementation
- Canvas
- Blackboard
- Other LMS platforms as needed

### Performance Tests (lti-performance.spec.ts)

The performance tests measure system behavior under various conditions:

- Single launch performance
- Sequential launch performance
- Concurrent launch handling
- Mixed workload performance (resource links and deep linking)
- Error handling under load
- Performance benchmarks and metrics collection

The tests measure and log key performance indicators:

- Response times (average, min, max, percentiles)
- Throughput (launches per second)
- Success rate under load
- Credential issuance performance

## IMS Global Certification

For official IMS Global certification, additional steps are required beyond these tests:

1. Register for the IMS Global LTI 1.3 certification program
2. Use the official IMS Global test suite
3. Submit certification evidence and results

These test suites provide a foundation to ensure the implementation meets the requirements before pursuing official certification.

## Integration with CI/CD

These tests are designed to integrate with CI/CD pipelines. Mock mode tests can run without external dependencies, making them ideal for continuous integration.

Example CI Configuration:

```yaml
test-lti:
  script:
    - pnpm install
    - pnpm test:lti:all
```

## Troubleshooting

If tests fail, check:

1. In mock mode:
   - Make sure vitest and dependencies are properly installed
   - Check for network connectivity issues with external URLs

2. In integration mode:
   - Docker services are running correctly (`docker compose ps`)
   - MongoDB is accessible and properly initialized
   - Environment variables are correctly set
   - Redis cache is working properly

Logs can be viewed with:

```bash
docker compose logs -f
```

## Test Mocking Strategy

The tests use a sophisticated mocking approach:

1. **Mock Database**: In-memory storage for platforms, states, sessions, and user mappings
2. **Mock JWT Validation**: Simulated token validation without requiring actual key exchange
3. **Mock Network**: Intercepts and simulates network requests to external services
4. **Mock LearnCard**: Lightweight LearnCard implementation for credential issuance

This allows tests to run without actual connections to MongoDB, external JWKS endpoints, or LearnCard dependencies.

## Extending the Tests

When adding new LTI features, corresponding tests should be added to maintain coverage:

1. Add test cases to the appropriate test files
2. Extend mock implementations in helper files if needed
3. Ensure both mock and integration modes are supported
4. Add performance tests for new endpoints or features

## Future Enhancements

Planned enhancements to the test suite include:

1. Extended platform coverage (Moodle, D2L, Sakai)
2. Automated visual testing of LTI flows
3. Security penetration testing
4. Long-running stability tests
5. Network degradation testing