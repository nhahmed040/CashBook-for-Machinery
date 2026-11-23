# CashBook for Machinery — implementation plan

This plan is the working specification for the approved Stage 0–6 improvement programme. Work is performed on `feature/complete-owner-driver-workflow`; `main` is kept unchanged until the branch is tested and reviewed.

## Implementation status (2026-11-23)

- **Stage 0 — baseline safeguards:** merged to `main`. Six automated regression tests cover default state, existing book/entry identity, legacy migration, totals, CSV safety, and settings sanitization. The APK workflow runs these tests before Gradle.
- **Stage 1 — owner navigation:** implemented on the feature branch. Five main areas route into the existing Machinery groups. Finance → CashBooks reuses the existing Entries screen and storage; Settings is under More. Android Back returns from CashBooks to Finance.
- **Stage 2 — financial accountability:** existing payment-to-driver custody calculation retained; Daily Closing now suggests calculated driver-held cash. Trips and collections can be recorded without a named customer, while named customer allocation remains supported. Driver reassignment is blocked until cash/advance balances, reimbursements, pending/disputed expenses, and pending closings are cleared.
- **Stage 3 — driver profiles:** owner driver cards now open the approved Overview / Operations / Finance & Administration profile tabs. Licence expiry dates are captured and expiry warnings are displayed.
- **Stage 5 — operational records (partial):** backward-compatible attendance, issue, message, and document collections are added to the machinery backup bridge. Owner attendance records support reasoned, audited corrections. Issue records support assignment and resolution; a resolved repair cost is posted once to the machine CashBook.
- **Not complete:** driver authentication/permissions, driver self-service, messaging/notifications, document management beyond licence expiry, and full reports/audit review remain in progress. The app currently has device-local machinery data and Firebase client authentication for cloud features, but owner-managed creation/suspension of separate driver accounts requires a trusted Firebase Admin backend (for example, a secured Cloud Function). Client-side code must not contain service-account credentials or pretend local permission toggles are secure.


## Non-negotiable preservation rules

- Preserve existing CashBook, business, project, contact, machinery, driver, trip, payment, expense, maintenance, payroll, backup, restore, language, calendar, print, and Android WebView behavior.
- Do not rename or discard the existing local-storage keys: `cashbook.data.v2` and `cashbook.machinery.v1`.
- Keep existing IDs and historical records stable. New fields must be optional/defaulted by backward-compatible sanitizers.
- Keep earned trip revenue, customer receipts, and driver cash custody distinct. Never create a second income or expense merely to show a driver-account effect.
- Pending trips are excluded from official totals until approved.
- Do not present device-local PIN hiding as secure multi-device authentication.

## Approved owner navigation

1. Dashboard
2. Operations
3. Finance
4. Fleet
5. More

Settings, account/security, backup shortcuts, and About are available from the top-right overflow menu.

### Dashboard
Business summary, today's operations, collections, receivables, expenses, driver cash accountability, machine status, alerts, pending approvals, and Daily Closing status.

### Operations
Trips and Loads, Record Trip/Load, history, pending approvals, Daily Closing, No Operation Today, attendance, and breakdown/issue reports.

### Finance
CashBooks (existing general, machine, and project books), customer accounts/payments, machine expenses, driver accounts, cash handovers, advances, reimbursements, reconciliation, payroll, and financial reports.

### Fleet
Machines (register, details, assignments, fuel, maintenance, repairs, history) and Drivers (management, profiles, assignments, documents, attendance, performance).

### More
General reports, backup/restore, audit trail, user management, administrative tools, and retained utilities.

## Driver profile

- Overview: personal information, assigned machine, current attendance, account status, alerts.
- Operations: trips/loads, attendance history, machine assignments, breakdown reports, performance.
- Finance & Administration: driver ledger/reconciliation, advances/expenses, documents/licenses, login permissions, acknowledgement and audit history.

## Driver accountability invariants

- All collections held by a driver increase driver cash custody, including collections without a named customer.
- Driver-paid machine expenses decrease custody and create exactly one machine expense.
- Cash handovers decrease custody; advances increase custody until accounted for.
- Daily Closing suggests the calculated balance as actual cash held; owner verifies/edits it.
- Adjustments require owner authorization, reason, and audit trail.
- Reassignment requires clearance of held cash, advances, unreconciled collections, disputed/pending expenses, and reimbursements. Preserve original machine links and assignment history.
- One active driver per machine and one active machine per driver.
- Driver-recorded trips follow per-driver mode: disabled, owner approval, or automatic approval.
- Corrections are audited; no silent deletion or mutation.

## Driver access and operations

Owner-controlled individual driver access and permissions; separate driver dashboard; own-account-only visibility; trip recording permissions; attendance check-in/out and owner corrections; issue reporting; owner-to-driver messaging; notification acknowledgement/dispute history; license/document expiry warnings; performance reports.

## Delivery stages

0. Baseline review, test inventory, storage/data compatibility safeguards, and branch protection.
1. Owner navigation and screen reorganization, including moving Entries into Finance → CashBooks without changing CashBook storage or behavior.
2. Trip and driver financial accountability, approvals, Daily Closing suggestions, and reassignment clearance.
3. Driver profiles, owner permissions, and management screens.
4. Authentication architecture and dedicated driver experience. Multi-device authentication/sync must use a real trusted backend; do not fake security with local UI state.
5. Attendance, notifications, messaging, documents, and expiry alerts.
6. Reports, audit integration, backup compatibility, regression testing, Android build verification.

## Acceptance gates

- Run all existing automated tests and add regression coverage for migration, ledgers, pending approvals, daily closing, and assignment constraints.
- Verify backup/restore round-trips both existing storage areas without data loss.
- Verify the Android APK build and inspect the GitHub Actions result.
- Keep work on this feature branch until all gates pass; do not merge an unverified build into main.
- If an external backend, credentials, signing secrets, or a real device test is required and unavailable, document the blocker rather than claim completion.
