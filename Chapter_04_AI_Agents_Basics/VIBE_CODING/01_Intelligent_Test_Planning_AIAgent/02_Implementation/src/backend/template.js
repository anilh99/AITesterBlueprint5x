function generateTestPlan(issue) {
  return `# Test Plan for ${issue.key}

## Overview
- **Jira Issue:** ${issue.key}
- **Title:** ${issue.summary}
- **Issue Type:** ${issue.issueType}
- **Priority:** ${issue.priority}

## Objective
Test the functionality described in ${issue.key}.

## Scope

### In Scope
- Functional testing for the described feature.
- Requirements extraction from: ${issue.key}

### Out of Scope
- Performance testing
- Security testing
- Load testing

## Test Scenarios

### Scenario 1: Positive Test
- **Preconditions:** Insufficient information to determine.
- **Steps:** Based on ${issue.key}, verify the core functionality.
- **Expected Result:** Feature works as described in ${issue.key}.

### Scenario 2: Error Handling
- **Preconditions:** Insufficient information to determine.
- **Steps:** Test boundary conditions and invalid input.
- **Expected Result:** System handles errors gracefully.

## Test Environment
Insufficient information to determine.

## Test Data
Insufficient information to determine.

## Entry and Exit Criteria

### Entry Criteria
- Insufficient information to determine.

### Exit Criteria
- All planned test scenarios are executed.
- No critical defects remain.

## Deliverables
- Test execution results
- Defect reports (if any)
- Test closure summary

## Risks
- Requirements clarity: ${issue.description || 'Not provided'}
- Environment availability: Insufficient information to determine.

## Notes
Generated from Jira issue ${issue.key}. Additional details and templates should be customized per project standards.
`;
}

module.exports = { generateTestPlan };
