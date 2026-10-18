# Data source

Downloaded on October 8, 2026.

**Source:** Lyndon Sundmark, [AIHR — Employee Churn tutorial](https://www.aihr.com/blog/tutorial-people-analytics-r-employee-churn/).

**Original archive:** [Datasets — Tutorial People Analytics](https://www.aihr.com/wp-content/uploads/2016/09/Datasets-Tutorial-People-Analytics.zip).

`MFG10YearTerminationData.csv` was extracted from the archive. The raw CSV was left unchanged. The dataset is entirely synthetic and does not describe real company employees. Its licensing terms have not been independently verified.

## Dataset summary

The raw file contains 49,653 rows, 18 columns, and 6,284 unique employees over 2006–2015. There are 1,485 TERMINATED records: 885 retirements, 385 resignations, and 215 layoffs. `Resignaton` is the spelling used in the original file.

Five additional records share an employee–year combination with another record. Each pair contains both ACTIVE and TERMINATED statuses for the same year. Both records were retained, so employee and year alone do not form a unique row key.

## Cleaning decisions

The raw data has no missing cells, but it contains placeholder values such as `1900-01-01` and `Not Applicable`.

In a separate cleaned file:

- `1900-01-01` departure dates were converted to missing values.
- Date columns were converted during preparation; CSV exports store dates as strings.
- `Resignaton` was corrected to `Resignation`.
- Two date conflicts were flagged without changing the underlying dates.
- Alternative city spellings were retained rather than merged.
- The raw dataset was preserved.

The dataset does not include employee names, salaries, overtime, or satisfaction measures. Earlier ACTIVE records may contain information about a later departure, so departures are counted only from actual TERMINATED events. Date filters use the actual departure date, not `recorddate_key`.

Initial validation figures and file metadata are available in [dataset_summary.json](dataset_summary.json). Analysis findings and implemented cleaning decisions are explained in the [project README](../../README.md).
