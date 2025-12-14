# API Implementation Guide for Backend Development

## Overview
This document outlines all the API endpoints needed for the financial management features. All endpoints are currently mocked in `miniprogram/utils/service.ts` and ready for backend implementation.

## API Endpoints

### 1. Dashboard APIs

#### Get Dashboard Summary
```
GET /api/dashboard/summary/
```

**Response:**
```json
{
  "netWorth": "5,196,800",
  "netWorthChange": "8,230",
  "cashAmount": "81,000",
  "stockAmount": "35,800",
  "mortgageAmount": "240,000",
  "houseAmount": "5,320,000",
  "monthlyBalance": "5,001",
  "monthlyIncome": "20,000",
  "monthlyExpense": "14,999",
  "monthlyStockProfit": "+2,300",
  "incomePercent": 70,
  "expensePercent": 30,
  "trendData": {
    "categories": ["12月", "1月", ...],
    "series": [{ "name": "预测净资产", "data": [123, 125, ...] }]
  }
}
```

---

### 2. Transaction APIs

#### List Transactions
```
GET /api/transactions/
Query Params: ?month=2025-11&type=income&category=工资
```

**Response:**
```json
[
  {
    "id": 1,
    "type": "income",
    "category": "工资",
    "amount": "20,000",
    "date": "2025-11-10",
    "account": "招行",
    "icon": "💰",
    "note": "11月工资"
  }
]
```

#### Create Transaction
```
POST /api/transactions/
Body: {
  "type": "income|expense",
  "category": "工资",
  "amount": "20000",
  "date": "2025-11-10",
  "account": "招行",
  "note": "备注",
  "icon": "💰"
}
```

#### Update Transaction
```
PUT /api/transactions/:id/
Body: (same as create)
```

#### Delete Transaction
```
DELETE /api/transactions/:id/
```

---

### 3. Planning APIs

#### Get Planning Summary
```
GET /api/planning/summary/
```

**Response:**
```json
{
  "assets": [
    {
      "id": 1,
      "name": "招商银行",
      "type": "cash|stock|house",
      "value": "20,000",
      "desc": "尾号 8888",
      "stock_code": "00700",
      "shares": "100"
    }
  ],
  "fixed": [
    {
      "id": 1,
      "type": "income|expense",
      "name": "工资",
      "amount": "20,000",
      "date": "每月 10 日",
      "frequency": "weekly|monthly|yearly",
      "date_value": "10",
      "account": "招行工资卡",
      "enabled": true
    }
  ],
  "futureSteps": [
    {
      "id": 1,
      "type": "cash|stock",
      "text": "年终奖 +20,000",
      "amount": "20,000",
      "stock_code": "00700",
      "shares": "10",
      "desc": "2025-12-25 · 预计入账"
    }
  ],
  "loans": [
    {
      "id": 1,
      "name": "公积金贷款",
      "principal": "600,000",
      "periods": 240,
      "rate": "3.1",
      "method": "equal_principal_interest|equal_principal",
      "repaymentDate": "每月 20 日"
    }
  ]
}
```

---

### 4. Asset Management APIs

#### Create Asset
```
POST /api/assets/
Body: {
  "name": "招商银行",
  "type": "cash|stock|house",
  "value": "20000",
  "desc": "尾号 8888",
  "stock_code": "00700",  // Optional, for stocks
  "shares": "100"        // Optional, for stocks
}
```

#### Update Asset
```
PUT /api/assets/:id/
Body: (same as create)
```

#### Delete Asset
```
DELETE /api/assets/:id/
```

---

### 5. Fixed Item APIs

#### Create Fixed Item
```
POST /api/fixed-items/
Body: {
  "name": "工资",
  "type": "income|expense",
  "amount": "20000",
  "frequency": "weekly|monthly|yearly",
  "date_value": "10",        // Day for monthly, weekday for weekly, "M-D" for yearly
  "date": "每月 10 日",      // Formatted string
  "account": "招行工资卡",
  "enabled": true
}
```

**Date Format Examples:**
- Weekly: `date_value: "一"` → `date: "每周周一"`
- Monthly: `date_value: "15"` → `date: "每月 15 日"`
- Yearly: `date_value: "1-1"` → `date: "每年 1月1日"`

#### Update Fixed Item
```
PUT /api/fixed-items/:id/
Body: (same as create)
```

#### Delete Fixed Item
```
DELETE /api/fixed-items/:id/
```

---

### 6. Future Item APIs

#### Create Future Item
```
POST /api/future-items/
Body: {
  "type": "cash|stock",
  "name": "年终奖 +20,000",
  "amount": "20000",      // For cash
  "stock_code": "00700",   // For stock
  "shares": "10",         // For stock
  "desc": "2025-12-25 · 预计入账"
}
```

#### Update Future Item
```
PUT /api/future-items/:id/
Body: (same as create)
```

#### Delete Future Item
```
DELETE /api/future-items/:id/
```

---

### 7. Loan APIs

#### Create Loan
```
POST /api/loans/
Body: {
  "name": "公积金贷款",
  "principal": "600000",
  "periods": 240,
  "rate": "3.1",
  "method": "equal_principal_interest|equal_principal",
  "repayment_date": 20
}
```

#### Update Loan
```
PUT /api/loans/:id/
Body: (same as create)
```

#### Delete Loan
```
DELETE /api/loans/:id/
```

---

### 8. Profile APIs

#### Get Profile
```
GET /api/profile/
```

**Response:**
```json
{
  "userInfo": {
    "name": "FridayLi",
    "days": 128,
    "avatar": "https://..."
  },
  "accounts": [
    {
      "name": "招商银行",
      "value": "¥20,000",
      "label": "尾号 8888"
    }
  ],
  "settings": {
    "currency": "人民币 (CNY)",
    "startDate": "2025-07-01"
  }
}
```

---

### 9. Asset Correction APIs

#### Get Correction Data
```
GET /api/assets/correction/
```

**Response:**
```json
{
  "cashSystem": 50000,
  "stockSystem": 200000
}
```

#### Save Correction
```
POST /api/assets/correction/
Body: {
  "cashActual": 52000,
  "stockActual": 198500,
  "note": "手动调整"
}
```

---

## Implementation Steps

1. **Review service.ts**: All functions in `miniprogram/utils/service.ts` have TODO comments showing where to replace mock implementations with `callContainer()` calls.

2. **Test with Mock Data**: Current implementation works fully with mock data for frontend testing.

3. **Replace Mocks**: Once backend is ready, uncomment the `callContainer()` calls in each function and remove the mock `Promise` blocks.

4. **Example Replacement**:
```typescript
// Before (Mock):
const getDashboardData = (): Promise<any> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockData), 500);
  });
};

// After (Real API):
const getDashboardData = (): Promise<any> => {
  return callContainer('/api/dashboard/summary/', 'GET');
};
```

---

## Data Models

### Fixed Item Date Format
The frontend handles three frequency types:
- **Weekly**: User selects weekday (一/二/三/四/五/六/日), stored as "每周周X"
- **Monthly**: User selects day (1-31), stored as "每月 X 日"
- **Yearly**: User inputs "M-D" format, stored as "每年 X月X日"

Backend should:
1. Accept both `frequency` + `date_value` fields for editing
2. Store the formatted `date` string for display
3. Parse `date` string to calculate next occurrence dates

---

## Notes

- All mock data uses simplified numeric formatting (comma-separated strings)
- Backend should return numbers or formatted strings based on frontend requirements
- User authentication via `openId` is already implemented for legacy features
- Consider adding pagination for transaction lists if volume grows
