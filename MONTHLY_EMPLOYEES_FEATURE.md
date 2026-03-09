# Monthly Employees Payroll System

## Overview

The system now supports two types of workers:
- **Daily Workers**: Paid per day worked, record daily attendance
- **Monthly Employees**: Paid fixed monthly salary, do NOT record attendance

---

## Key Differences

| Feature | Daily Workers | Monthly Employees |
|---------|--------------|-------------------|
| **Payment Basis** | Per day worked | Fixed monthly salary |
| **Attendance** | Required | Not applicable |
| **Payroll Calculation** | `rate_per_day × days_worked` | `monthly_salary` (prorated if partial month) |
| **Fields Required** | `rate_per_day` | `monthly_salary`, `start_date`, `end_date` (optional) |

---

## Database Changes

### New Columns Added to `workers` Table

```sql
monthly_salary DECIMAL(12, 2)  -- Fixed monthly salary
start_date DATE                -- Employment start date
end_date DATE                  -- Employment end date (NULL if still employed)
```

### Run Migration

Execute in Supabase SQL Editor:
```bash
database/migrations/002_monthly_employees.sql
```

---

## Backend Changes

### Worker Controller Updates

**Create/Update Worker:**
- Daily workers require `rate_per_day`
- Monthly employees require `monthly_salary`
- Monthly employees can have `start_date` and optional `end_date`

**Attendance Recording:**
- Backend validates worker type before allowing attendance
- Returns error if attempting to record attendance for monthly employee

**Payroll Report:**
- Daily workers: Calculated from attendance records
- Monthly employees: 
  - Included if employed during payroll period
  - Salary prorated based on days employed in the period
  - Automatically excluded if employment ended before period

### Payroll Calculation Logic

#### Monthly Employee Proration

```javascript
// Example: Employee with salary 300,000 RWF
// Payroll period: March 1-31 (31 days)
// Employee worked: March 1-20 (20 days)

totalDaysInPeriod = 31
daysEmployed = 20
proratedAmount = (300,000 × 20) / 31 = 193,548.39 RWF
```

#### Employment Period Check

Monthly employee is included in payroll if:
```
start_date <= period_end AND (end_date IS NULL OR end_date >= period_start)
```

**Examples:**
- ✅ Employee started Feb 1, still employed → Included in March payroll
- ✅ Employee started March 15, still employed → Included (prorated)
- ✅ Employee started Jan 1, ended March 15 → Included (prorated)
- ❌ Employee ended Feb 28 → NOT included in March payroll
- ❌ Employee starts April 1 → NOT included in March payroll

---

## Frontend Changes

### Workers Page

**New Fields in Form:**
- Payment Type selector (Daily/Monthly)
- For Daily: Shows "Rate per Day" field
- For Monthly: Shows "Monthly Salary", "Start Date", "End Date" fields

**Worker List:**
- Shows rate/salary based on type
- Shows employment status badge (Active/Inactive/Ended)

### Attendance Page

**Changes:**
- Only daily workers are displayed
- Info message explains monthly employees don't record attendance
- Monthly employees filtered out automatically

### Payroll Report

**Report Shows:**
- Daily workers: Days worked from attendance, calculated amount
- Monthly employees: Days employed in period, prorated salary
- Employment status indicator

---

## API Response Examples

### Payroll Report Response

```json
{
  "period": {
    "start_date": "2024-03-01",
    "end_date": "2024-03-31"
  },
  "workers": [
    {
      "worker_id": "uuid-daily-1",
      "full_name": "John Daily Worker",
      "payment_type": "daily",
      "rate_per_day": 5000,
      "monthly_salary": null,
      "total_days_worked": 22,
      "total_amount": 110000,
      "employment_status": "active"
    },
    {
      "worker_id": "uuid-monthly-1",
      "full_name": "Jane Monthly Employee",
      "payment_type": "monthly",
      "rate_per_day": null,
      "monthly_salary": 300000,
      "total_days_worked": 31,
      "total_days_in_period": 31,
      "total_amount": 300000,
      "employment_status": "active"
    },
    {
      "worker_id": "uuid-monthly-2",
      "full_name": "Bob Partial Month",
      "payment_type": "monthly",
      "monthly_salary": 250000,
      "total_days_worked": 15,
      "total_days_in_period": 31,
      "total_amount": 120967.74,
      "employment_status": "ended"
    }
  ],
  "total_payroll": 530967.74
}
```

---

## User Guide

### Adding a Monthly Employee

1. Go to **Workers** page
2. Click **Add Worker**
3. Fill in:
   - Full Name
   - Phone
   - Position
   - **Payment Type**: Select "Monthly"
   - **Monthly Salary**: Enter fixed monthly salary
   - **Start Date**: Employment start date
   - **End Date**: Leave empty if still employed (or set if ended)
4. Click **Save**

### Recording Attendance

1. Go to **Attendance** page
2. Select project and date
3. Only daily workers will be shown
4. Enter days worked for each worker
5. Click **Save**

> **Note:** Monthly employees do not appear in attendance. They are automatically paid their full salary (or prorated) during payroll.

### Generating Payroll Report

1. Go to **Attendance** page
2. Click **Payroll Report**
3. Select date range
4. Report will show:
   - Daily workers with days worked and calculated pay
   - Monthly employees with salary (prorated if applicable)
5. Export to Excel or PDF if needed

---

## Common Scenarios

### Scenario 1: Full Month Employment

**Employee:** Hired Jan 1, still employed
**Payroll Period:** March 1-31
**Result:** Full monthly salary paid

### Scenario 2: Mid-Month Hire

**Employee:** Hired March 15
**Payroll Period:** March 1-31
**Result:** Salary prorated for 17 days (March 15-31)

### Scenario 3: Mid-Month Termination

**Employee:** Hired Jan 1, Ended March 15
**Payroll Period:** March 1-31
**Result:** Salary prorated for 15 days (March 1-15)

### Scenario 4: Ended Before Period

**Employee:** Ended Feb 28
**Payroll Period:** March 1-31
**Result:** NOT included in payroll

---

## Error Messages

### Attendance Errors

**"Cannot record attendance for monthly employee..."**
- You're trying to record attendance for a monthly employee
- Monthly employees don't record attendance
- Solution: Only record attendance for daily workers

**"Please select a worker"**
- No worker selected
- Solution: Select a worker from the dropdown

### Payroll Errors

**"Start date and end date are required"**
- Missing date range
- Solution: Select both start and end dates for payroll period

---

## Migration from Old System

If you have existing workers:

1. All existing workers default to `payment_type = 'daily'`
2. To convert a worker to monthly:
   - Edit the worker
   - Change Payment Type to "Monthly"
   - Enter Monthly Salary
   - Set Start Date
   - Save

---

## Best Practices

1. **For Monthly Employees:**
   - Always set a start date
   - Set end date when employment terminates
   - Use meaningful salary amounts

2. **For Payroll:**
   - Run payroll at end of month
   - Review prorated amounts for partial-month employees
   - Export reports for record-keeping

3. **For Attendance:**
   - Record daily attendance consistently
   - Use fractional days (0.25, 0.5, 0.75) for partial days
   - Add comments for absences or special cases

---

## Troubleshooting

### Monthly Employee Not Appearing in Payroll

**Check:**
1. Employee `payment_type` is set to "monthly"
2. Employee `start_date` is before or on period end date
3. If `end_date` is set, it's after or on period start date

### Wrong Salary Amount in Payroll

**Check:**
1. `monthly_salary` field is set correctly
2. Proration is expected (employee started/ended mid-period)
3. Date range is correct

### Attendance Not Saving for Worker

**Check:**
1. Worker is not a monthly employee
2. Worker belongs to selected project
3. Date is valid

---

## Future Enhancements

- [ ] Bulk import of workers from Excel
- [ ] Automatic end-date reminders for contracts
- [ ] Overtime tracking for monthly employees
- [ ] Leave management integration
- [ ] Tax calculation on payroll
- [ ] Bank transfer integration for salary payments
