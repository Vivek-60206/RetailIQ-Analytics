
-- ============================================================
-- Project: RetailIQ
-- Author: Vivek Jotva
-- SQL Business Intelligence Analysis
-- ============================================================

-- TABLE ASSUMPTION: retail_sales
-- Dataset: 64,104 retail transactions

-- 1. DATA OVERVIEW
-- ============================================================

-- 1. Preview records
SELECT *
FROM retail_sales
LIMIT 10;

-- 2. Total transaction records
SELECT COUNT(*) AS total_records
FROM retail_sales;

-- 3. Dataset date coverage
SELECT
    MIN(order_date) AS first_order_date,
    MAX(order_date) AS last_order_date
FROM retail_sales;

-- 4. Check missing budget values
SELECT
    COUNT(*) AS total_records,
    SUM(budget IS NULL) AS missing_budget_records,
    ROUND(
        SUM(budget IS NULL) * 100.0 / COUNT(*), 2
    ) AS missing_budget_percentage
FROM retail_sales;


-- 2. EXECUTIVE BUSINESS PERFORMANCE
-- ============================================================

-- 5. Overall revenue, cost and profit
SELECT
    ROUND(SUM(revenue), 2) AS total_revenue,
    ROUND(SUM(Total_Cost), 2) AS total_cost,
    ROUND(SUM(profit), 2) AS total_profit
FROM retail_sales;

-- 6. Overall profit margin
SELECT
    ROUND(
        SUM(profit) * 100.0 / NULLIF(SUM(revenue), 0), 2
    ) AS profit_margin_percentage
FROM retail_sales;

-- 7. Order and customer KPIs
SELECT
    COUNT(DISTINCT Order_Number) AS total_orders,
    COUNT(DISTINCT Customer_Name) AS total_customers,
    SUM(quantity) AS total_units_sold,
    ROUND(AVG(revenue), 2) AS average_transaction_revenue
FROM retail_sales;

-- 8. Average order value
SELECT
    ROUND(
        SUM(revenue) / NULLIF(COUNT(DISTINCT Order_Number), 0), 2
    ) AS average_order_value
FROM retail_sales;


-- 3. PRODUCT PERFORMANCE
-- ============================================================

-- 9. Revenue and profit by product
SELECT
    Product_Name,
    ROUND(SUM(revenue), 2) AS total_revenue,
    ROUND(SUM(profit), 2) AS total_profit,
    SUM(quantity) AS units_sold
FROM retail_sales
GROUP BY Product_Name
ORDER BY total_revenue DESC;

-- 10. Top 5 products by revenue
SELECT
    Product_Name,
    ROUND(SUM(revenue), 2) AS total_revenue
FROM retail_sales
GROUP BY Product_Name
ORDER BY total_revenue DESC
LIMIT 5;

-- 11. Top 5 products by profit
SELECT
    Product_Name,
    ROUND(SUM(profit), 2) AS total_profit
FROM retail_sales
GROUP BY Product_Name
ORDER BY total_profit DESC
LIMIT 5;

-- 12. Products with lowest profit
SELECT
    Product_Name,
    ROUND(SUM(profit), 2) AS total_profit
FROM retail_sales
GROUP BY Product_Name
ORDER BY total_profit ASC
LIMIT 5;

-- 13. Product profit margin
SELECT
    Product_Name,
    ROUND(SUM(revenue), 2) AS revenue,
    ROUND(SUM(profit), 2) AS profit,
    ROUND(
        SUM(profit) * 100.0 / NULLIF(SUM(revenue), 0), 2
    ) AS profit_margin
FROM retail_sales
GROUP BY Product_Name
ORDER BY profit_margin DESC;


-- 4. CUSTOMER ANALYSIS
-- ============================================================

-- 14. Customer revenue and order frequency
SELECT
    Customer_Name,
    ROUND(SUM(revenue), 2) AS customer_revenue,
    COUNT(DISTINCT Order_Number) AS order_count,
    ROUND(AVG(revenue), 2) AS average_transaction_value
FROM retail_sales
GROUP BY Customer_Name
ORDER BY customer_revenue DESC;

-- 15. Top 10 customers by revenue
SELECT
    Customer_Name,
    ROUND(SUM(revenue), 2) AS total_revenue
FROM retail_sales
GROUP BY Customer_Name
ORDER BY total_revenue DESC
LIMIT 10;

-- 16. Customer contribution to total revenue
SELECT
    Customer_Name,
    ROUND(SUM(revenue), 2) AS customer_revenue,
    ROUND(
        SUM(revenue) * 100.0 /
        (SELECT SUM(revenue) FROM retail_sales), 2
    ) AS revenue_contribution_pct
FROM retail_sales
GROUP BY Customer_Name
ORDER BY customer_revenue DESC;


-- 5. REGIONAL AND CHANNEL ANALYSIS
-- ============================================================

-- 17. Revenue and profit by region
SELECT
    us_region,
    ROUND(SUM(revenue), 2) AS total_revenue,
    ROUND(SUM(profit), 2) AS total_profit
FROM retail_sales
GROUP BY us_region
ORDER BY total_revenue DESC;

-- 18. State-wise business performance
SELECT
    State_Name,
    ROUND(SUM(revenue), 2) AS total_revenue,
    ROUND(SUM(profit), 2) AS total_profit
FROM retail_sales
GROUP BY State_Name
ORDER BY total_revenue DESC;

-- 19. Sales channel comparison
SELECT
    channel,
    COUNT(DISTINCT Order_Number) AS total_orders,
    ROUND(SUM(revenue), 2) AS total_revenue,
    ROUND(SUM(profit), 2) AS total_profit
FROM retail_sales
GROUP BY channel
ORDER BY total_revenue DESC;

-- 20. Revenue share by sales channel
SELECT
    channel,
    ROUND(SUM(revenue), 2) AS channel_revenue,
    ROUND(
        SUM(revenue) * 100.0 /
        (SELECT SUM(revenue) FROM retail_sales), 2
    ) AS revenue_share_pct
FROM retail_sales
GROUP BY channel
ORDER BY channel_revenue DESC;


-- 6. TIME-BASED ANALYSIS
-- ============================================================

-- 21. Monthly revenue and profit
SELECT
    YEAR(order_date) AS sales_year,
    order_month_num,
    order_month,
    ROUND(SUM(revenue), 2) AS monthly_revenue,
    ROUND(SUM(profit), 2) AS monthly_profit
FROM retail_sales
GROUP BY YEAR(order_date), order_month_num, order_month
ORDER BY sales_year, order_month_num;

-- 22. Yearly business performance
SELECT
    YEAR(order_date) AS sales_year,
    ROUND(SUM(revenue), 2) AS yearly_revenue,
    ROUND(SUM(profit), 2) AS yearly_profit
FROM retail_sales
GROUP BY YEAR(order_date)
ORDER BY sales_year;

-- 23. Quarter-wise revenue
SELECT
    YEAR(order_date) AS sales_year,
    QUARTER(order_date) AS sales_quarter,
    ROUND(SUM(revenue), 2) AS quarterly_revenue
FROM retail_sales
GROUP BY YEAR(order_date), QUARTER(order_date)
ORDER BY sales_year, sales_quarter;


-- 7. ADVANCED SQL ANALYSIS
-- ============================================================

-- 24. Rank products by revenue
SELECT
    Product_Name,
    ROUND(SUM(revenue), 2) AS total_revenue,
    RANK() OVER (
        ORDER BY SUM(revenue) DESC
    ) AS revenue_rank
FROM retail_sales
GROUP BY Product_Name;

-- 25. Rank customers by profit
SELECT
    Customer_Name,
    ROUND(SUM(profit), 2) AS total_profit,
    DENSE_RANK() OVER (
        ORDER BY SUM(profit) DESC
    ) AS profit_rank
FROM retail_sales
GROUP BY Customer_Name;

-- 26. Running monthly revenue
WITH monthly_sales AS (
    SELECT
        DATE_FORMAT(order_date, '%Y-%m') AS sales_month,
        SUM(revenue) AS monthly_revenue
    FROM retail_sales
    GROUP BY DATE_FORMAT(order_date, '%Y-%m')
)
SELECT
    sales_month,
    ROUND(monthly_revenue, 2) AS monthly_revenue,
    ROUND(
        SUM(monthly_revenue) OVER (
            ORDER BY sales_month
        ), 2
    ) AS cumulative_revenue
FROM monthly_sales;

-- 27. Month-over-month revenue comparison
WITH monthly_sales AS (
    SELECT
        DATE_FORMAT(order_date, '%Y-%m') AS sales_month,
        SUM(revenue) AS monthly_revenue
    FROM retail_sales
    GROUP BY DATE_FORMAT(order_date, '%Y-%m')
),
comparison AS (
    SELECT
        sales_month,
        monthly_revenue,
        LAG(monthly_revenue) OVER (
            ORDER BY sales_month
        ) AS previous_month_revenue
    FROM monthly_sales
)
SELECT
    sales_month,
    ROUND(monthly_revenue, 2) AS current_revenue,
    ROUND(previous_month_revenue, 2) AS previous_revenue,
    ROUND(
        (monthly_revenue - previous_month_revenue) * 100.0 /
        NULLIF(previous_month_revenue, 0), 2
    ) AS growth_percentage
FROM comparison;

-- 28. Best-performing product in each region
WITH product_region AS (
    SELECT
        us_region,
        Product_Name,
        SUM(revenue) AS total_revenue,
        RANK() OVER (
            PARTITION BY us_region
            ORDER BY SUM(revenue) DESC
        ) AS product_rank
    FROM retail_sales
    GROUP BY us_region, Product_Name
)
SELECT
    us_region,
    Product_Name,
    ROUND(total_revenue, 2) AS total_revenue
FROM product_region
WHERE product_rank = 1;

-- 29. Most profitable sales channel in each region
WITH channel_profit AS (
    SELECT
        us_region,
        channel,
        SUM(profit) AS total_profit,
        RANK() OVER (
            PARTITION BY us_region
            ORDER BY SUM(profit) DESC
        ) AS profit_rank
    FROM retail_sales
    GROUP BY us_region, channel
)
SELECT
    us_region,
    channel,
    ROUND(total_profit, 2) AS total_profit
FROM channel_profit
WHERE profit_rank = 1;

-- 30. Revenue and profit outlier candidates
WITH transaction_stats AS (
    SELECT
        Order_Number,
        Customer_Name,
        revenue,
        profit,
        AVG(revenue) OVER () AS avg_revenue,
        STDDEV_POP(revenue) OVER () AS revenue_stddev
    FROM retail_sales
)
SELECT
    Order_Number,
    Customer_Name,
    revenue,
    profit
FROM transaction_stats
WHERE revenue > avg_revenue + 3 * revenue_stddev
ORDER BY revenue DESC;

-- ============================================================
-- END OF RETAILIQ SQL BUSINESS ANALYSIS
-- ============================================================
