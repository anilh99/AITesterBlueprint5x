# Hypothetical training example

## 1. Title

**[Hypothetical] No visible validation feedback when password is empty**

## 2. Environment

- Application: VWO login
- URL: `https://app.vwo.com/`
- Browser/version: Not supplied
- Operating system: Not supplied
- Build: Not supplied
- Execution time: Not supplied

## 3. Preconditions

- The user is logged out.
- A registered test email is available.

## 4. Test Data

- Email: `<registered_test_email>`
- Password: Empty

## 5. Steps to Reproduce

1. Open `https://app.vwo.com/`.
2. Enter `<registered_test_email>`.
3. Leave the password field empty.
4. Submit the login form.

## 6. Expected Result

Because password is mandatory, the login attempt should not proceed without a password, and the user should receive visible validation feedback. The exact validation text is not specified.

## 7. Actual Result

The form submits, but no visible validation feedback appears. The authentication outcome was not supplied.

## 8. Reproducibility

Observed in 3 out of 3 attempts.

## 9. Suggested Severity

**Provisional: Medium.** The missing visible feedback may leave users unable to understand why login did not proceed. Confirm the authentication outcome and user impact before final severity assignment.

## 10. Attachments

Not provided.
