# ABC Lifestyle Store · Simulated Demo Data Dictionary

All records are generated for demonstration. They are not real customer, supplier, market, or bank records. Currency: SGD. Historical window: 90 days ending on the generation date. Forecast window: the following 30 days.

The downloadable CSV is a normalized multi-table export. The `dataset` field identifies each row family; blank columns are not applicable to that family.

## Row families

| dataset | Contents |
|---|---|
| business_profile | Company type, currency, date coverage, scenario, and source status. |
| sales | Dated sales transactions, products, quantities, and collection assumptions. |
| cash_inflow | Actual receipts and dated forecast collections. |
| expense_cash_outflow | Actual and forecast operating or supplier cash payments. |
| inventory_procurement | Purchase orders, units, unit cost, supplier, and payment terms. |
| accounts_receivable / accounts_payable | Open invoice balances and due dates linked to the underlying sale or purchase. |
| daily_inventory | SKU-level opening stock + replenishments − units sold = closing stock. |
| daily_cash_balance | Dated cash inflows, outflows, and reconciled daily closing balance. |
| daily_business_performance | Revenue, units sold, demand proxy, and marketing spend by day. |
| simulated_market_observation | Generated demand indexes; internal demo assumptions, not external research. |

## Common fields

| Field | Meaning |
|---|---|
| transactionId / invoiceId / purchaseOrderId | Stable simulated identifier used to reconcile linked records. |
| date / transactionDate / invoiceDate | Sale, movement, invoice, or scheduled-event date in YYYY-MM-DD format. |
| dueDate / expectedPaymentDate / paymentDate / actualPaymentDate | Contractual, expected, and actual payment or collection dates. Blank means not paid or not applicable. |
| recordType / type | Sale, receipt, expense, supplier, inventory, revenue, COGS, or operating expense classification. |
| category / expenseCategory / productName / sku | Product, inventory, or operating-cost classification. |
| quantity / unitSellingPrice / unitCost | Units and per-unit price or cost. |
| amount / outstandingAmount / purchaseCost | SGD amount. Sales are revenue; receipts and payment rows are cash events, not duplicate recognized revenue. |
| paymentMethod / paymentStatus / status | Simulated payment channel and settlement state. |
| sourceLabel / dataStatus / recordClass | Provenance. Values distinguish simulated historical records, forecasts, and assumptions. |
| phase / growthInvestment | Business phase or explicit growth-investment flag. |
| customerId / customerName / supplier | Simulated counterparties; not real people or companies. |

## Reconciliation notes

- Sales revenue is recognized on transaction date. Cash receipts use actual or expected collection date; unpaid sales remain in accounts receivable and are not counted as cash received.
- Cash balance is opening cash plus settled cash inflows minus settled cash outflows through the as-of date. Forecast events are separately labeled.
- Inventory closes as opening units plus replenishment units minus units sold for each SKU and date. Supplier invoices carry 14-day terms unless explicitly labeled as a growth deposit.
- Accounts receivable and payable link back to the associated sale or purchase order.
- Market demand indexes are simulated assumptions and do not represent external market research.
