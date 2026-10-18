# Mercek — Implementation Review

Reviewed on October 18, 2026. This document summarizes the query correctness, container permissions, proxy configuration, and frontend checks completed for Mercek.

## Changes completed

- [x] **Tenure boundaries:** “The first two years” uses `length_of_service < 2`; “at most 2 years” uses `length_of_service <= 2`. There are 163 resignations within the first two years of service.
- [x] **Date order:** Questions that mix ISO and day/month/year formats preserve the order in which the dates were entered. Reversed date or year ranges receive a clarification response.
- [x] **Store totals:** Both the total and the rows in store-grouped answers include only the STORES business unit.
- [x] **Query safety:** The assistant does not execute user questions as SQL. It reads data through fixed, read-only queries, while API filter values remain parameterized. SQL-like input was checked to ensure that it neither modified tables nor broadened API filter results.
- [x] **Container permissions:** The API already used a non-root account; Nginx was updated to do the same. Read-only filesystems, dropped capabilities, and disabled privilege escalation were verified for both services.
- [x] **Proxy configuration:** Docker DNS resolution and connection/response timeouts were configured. API paths and parameters are preserved, and both the site and API documentation were checked.
- [x] **CSV exports:** Text that could be interpreted as a spreadsheet formula is neutralized. Unicode text, quotation marks, and numeric values are preserved.
- [x] **Request handling:** Rapid filter changes no longer display the previous filter’s data. Requests can be cancelled and time out after 20 seconds; retry behavior is retained.

## Validation

- `python -m unittest discover -s tests -v`: the original 11 test cases passed, with expected results checked against the cleaned CSV. English question support later expanded the suite to 13 passing test cases.
- `node --test frontend/src/csv.test.js`: 2 tests passed.
- Docker Compose built both images, and both containers reported healthy.
- API summaries, assistant queries, API documentation, and query parameters were verified through Nginx and Compose.
- The frontend build passed. Lint checks reported only the existing Fast Refresh warnings in `components.jsx`, with no errors.
- Browser checks covered rapid filter changes, corrected tenure results, filtered CSV downloads, retries after request failures, and mobile layouts.

