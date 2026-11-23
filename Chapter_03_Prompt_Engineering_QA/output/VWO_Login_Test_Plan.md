# VWO Login Module Test Plan

**Test Plan ID:** VWO-TP-LOGIN-001 (locally assigned)  
**Status:** Draft for review  
**Application:** VWO login module  
**Reference URL:** `https://app.vwo.com/`

## 1. Test Plan

### Objective

Define a functional test approach for the VWO login module to verify that registered users can log in with valid credentials, invalid credentials do not grant access, email and password are mandatory, and successful login opens the authenticated dashboard.

The approved requirements supplied for this exercise are the source of expected behavior. Unspecified behavior is marked **Requires clarification** rather than assumed.

### Scope

#### Inclusions

- Login with valid credentials.
- Rejection of invalid credentials and verification of the supplied error message.
- Mandatory email and password checks, individually and together.
- Verification that a successful login opens the authenticated dashboard.
- Boundary scenarios limited to the required-field boundary (missing email and/or password).

#### Exclusions

- Password complexity, email-format rules, account lockout, rate limiting, MFA, SSO, password reset, session timeout, logout, and remember-me behavior.
- Browser/device compatibility beyond the environment agreed for this test cycle.
- Performance, security, accessibility, and load testing.
- Registration and other application pages outside the supplied login requirements.

### Test Environments

The exact test environment, browser, operating system, and version are **Requires clarification**.

**Recommendation:** Use a designated non-production VWO environment and an approved test account. Confirm the environment URL and authorization before executing authentication tests. Do not use personal or unapproved credentials.

### Defect Reporting Procedure

For each defect, record:

- Test case ID and reproducible steps.
- Environment URL/name, browser, operating system, and timestamp.
- Expected and actual results.
- Sanitized screenshot or other approved evidence.
- Severity and priority using the owning team's existing definitions.

Do not include passwords, authentication tokens, or other secrets in defect reports or evidence. The defect management tool and severity definitions are **Requires clarification**.

## 2. Test Strategy

- **Test level:** Functional system testing through the login user interface.
- **Test types:** Positive, negative, and required-field boundary testing.
- **Execution:** Start each test with a clean, unauthenticated browser session. Record the result and observed behavior; do not infer success from a button click alone.
- **Authentication safety:** Use only an approved test environment and authorized test data.
- **Expected error:** For invalid credentials, verify the supplied message exactly:  
  `Your email, password, IP address or location did not match`
- **Unspecified validation:** The supplied requirements do not define the exact behavior or message for empty fields. Verify that empty required fields do not result in successful login; the precise validation response is **Requires clarification**.
- **Dashboard oracle:** The specific dashboard page or element that proves authentication is successful is **Requires clarification**. Agree on an observable authenticated dashboard indicator before execution.

### Test Scenarios

| Test Case ID | Scenario | Type | Preconditions / Test Data | Steps | Expected Result |
| --- | --- | --- | --- | --- | --- |
| VWO-LOGIN-001 | Log in with valid credentials | Positive | Approved environment; registered, authorized test account with valid credentials | 1. Open the approved login URL. 2. Enter the test account's valid email and password. 3. Submit the login form. | The user can log in. Successful login opens the authenticated dashboard. |
| VWO-LOGIN-002 | Submit invalid credentials | Negative | Approved environment; invalid test credentials | 1. Open the approved login URL. 2. Enter invalid credentials. 3. Submit the form. | Access is not granted. The error message is `Your email, password, IP address or location did not match`. |
| VWO-LOGIN-003 | Submit with email empty | Negative / boundary | Approved environment; leave email empty and use a test value for password | 1. Open the approved login URL. 2. Leave email empty. 3. Enter a password value. 4. Submit the form. | Access is not granted because email is mandatory. The exact validation behavior/message is **Requires clarification**. |
| VWO-LOGIN-004 | Submit with password empty | Negative / boundary | Approved environment; use a test value for email and leave password empty | 1. Open the approved login URL. 2. Enter an email value. 3. Leave password empty. 4. Submit the form. | Access is not granted because password is mandatory. The exact validation behavior/message is **Requires clarification**. |
| VWO-LOGIN-005 | Submit with both fields empty | Negative / boundary | Approved environment; both fields empty | 1. Open the approved login URL. 2. Leave email and password empty. 3. Submit the form. | Access is not granted because both fields are mandatory. Whether validation appears per-field, as a form-level message, or through another behavior is **Requires clarification**. |
| VWO-LOGIN-006 | Verify authenticated dashboard after login | Positive | Approved environment; registered test account with valid credentials; agreed dashboard success indicator | 1. Log in with valid credentials. 2. Observe the post-login page. 3. Verify the agreed dashboard indicator. | Successful login opens the authenticated dashboard. The specific dashboard indicator is **Requires clarification**. |

No email-format, password-strength, input-length, or whitespace-only scenarios are included because those rules are not stated in the supplied requirements.

## 3. Test Schedule

Dates, duration, and assigned resources are **Requires clarification**.

**Recommendation:** Schedule test execution after the approved environment, test account, and dashboard success indicator are confirmed. Reserve time for defect retesting and test closure.

## 4. Test Deliverables

- This test plan.
- Execution results for each listed test case, including pass, fail, blocked, or not run.
- Defect reports with sanitized evidence for failed cases.
- A test closure summary with results, outstanding defects, blocked tests, and residual risks.

## 5. Entry and Exit Criteria

### Entry Criteria

The following are **recommendations** for starting execution:

- The test environment URL and test window are approved.
- An authorized registered test account is available for the valid-login scenario.
- Invalid test data is agreed and safe to use.
- The expected authenticated dashboard indicator is agreed.
- The target browser and operating system are agreed.
- Test cases and expected outcomes are reviewed by the responsible QA/product owner.

### Exit Criteria

The following are **recommendations** for completing execution:

- All in-scope test cases have a recorded result, or are explicitly documented as blocked/not run.
- Failures have defect records with reproducible steps and sanitized evidence.
- No unresolved in-scope critical defects remain, using the organization's severity definitions.
- The QA and product owners have reviewed the results and documented acceptance or follow-up actions.

The severity threshold and release sign-off authority are **Requires clarification**.

## 6. Test Execution

### Entry Criteria

- The entry criteria in Section 5 are met.
- Each run begins in a clean, unauthenticated browser session.
- The valid account and invalid test data are available through approved means.

### Exit Criteria

- Each in-scope test has a result and execution evidence where appropriate.
- Defects are filed for behavior that conflicts with the supplied requirements.
- Any blocked test, environment issue, or unresolved clarification is recorded.

## 7. Test Closure

### Entry Criteria

- Planned execution is complete, or remaining tests are documented as blocked/not run.
- Relevant defects have been recorded and their status reviewed.

### Exit Criteria

- A closure summary reports executed, passed, failed, blocked, and not-run counts.
- Outstanding defects and risks are listed with owners or next steps, where known.
- QA and the designated product owner have reviewed the summary.

Approver names and the formal sign-off process are **Requires clarification**.

## 8. Tools

Specific tools are **Requires clarification**.

**Recommendation:** Use the team's approved browser, test case management system, and defect tracking system. Capture only sanitized evidence and do not store credentials in test documents, logs, or source control.

## 9. Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Test execution targets a production environment without approval. | Confirm the target and authorization before authentication testing; prefer a designated non-production environment. |
| A valid registered test account is unavailable. | Obtain an authorized test account before execution; mark the valid-login scenario blocked until available. |
| The exact dashboard success indicator is undefined. | Agree on an observable authenticated dashboard indicator before running positive tests. |
| Empty-field validation behavior is unspecified. | Verify only that access is not granted; request clarification before asserting exact wording or UI behavior. |
| Credentials or session data appear in screenshots or defect reports. | Sanitize evidence and exclude passwords, tokens, and other secrets. |
| Unspecified behavior is added to scope as an assumed requirement. | Keep test coverage limited to the supplied requirements and track all other behavior as **Requires clarification**. |

## 10. Approvals

| Role | Name | Approval / Date |
| --- | --- | --- |
| QA / Test Owner | Requires clarification | Requires clarification |
| Product Owner | Requires clarification | Requires clarification |
| Environment Owner | Requires clarification | Requires clarification |

