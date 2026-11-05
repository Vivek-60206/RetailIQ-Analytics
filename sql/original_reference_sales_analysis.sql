-- =====================================================
-- Retail Sales Intelligence Project
-- SQL Analysis
-- =====================================================

USE sales_project;

-- 1. View First 10 Records
SELECT *
FROM sales_data
LIMIT 10;

-- 2. Total Number of Records
SELECT COUNT(*) AS total_records
FROM sales_data;

-- 3. Total Revenue
SELECT SUM(revenue) AS total_revenue
FROM sales_data;

-- 4. Total Profit
SELECT SUM(profit) AS total_profit
FROM sales_data;

-- 5. Total Orders
SELECT COUNT(DISTINCT order_number) AS total_orders
FROM sales_data;

-- 6. Total Customers
SELECT COUNT(DISTINCT customer_name) AS total_customers
FROM sales_data;

-- 7. Average Revenue per Record
SELECT ROUND(AVG(revenue), 2) AS avg_revenue
FROM sales_data;

-- 8. Profit Margin (%)
SELECT ROUND((SUM(profit) / SUM(revenue)) * 100, 2) AS profit_margin_pct
FROM sales_data;

-- =====================================================
-- SECTION 2 : REGIONAL SALES ANALYSIS
-- =====================================================

-- 10. Revenue by State
SELECT
    state_name,
    SUM(revenue) AS total_revenue
FROM sales_data
GROUP BY state_name
ORDER BY total_revenue DESC;


-- 11. Profit by State
SELECT
    state_name,
    SUM(profit) AS total_profit
FROM sales_data
GROUP BY state_name
ORDER BY total_profit DESC;


-- 12. Revenue by Region
SELECT
    us_region,
    SUM(revenue) AS total_revenue
FROM sales_data
GROUP BY us_region
ORDER BY total_revenue DESC;


-- 13. Profit by Region
SELECT
    us_region,
    SUM(profit) AS total_profit
FROM sales_data
GROUP BY us_region
ORDER BY total_profit DESC;


-- 14. Revenue by Sales Channel
SELECT
    channel,
    SUM(revenue) AS total_revenue
FROM sales_data
GROUP BY channel
ORDER BY total_revenue DESC;


-- 15. Profit by Sales Channel
SELECT
    channel,
    SUM(profit) AS total_profit
FROM sales_data
GROUP BY channel
ORDER BY total_profit DESC;


-- 16. Top 10 States by Revenue
SELECT
    state_name,
    SUM(revenue) AS total_revenue
FROM sales_data
GROUP BY state_name
ORDER BY total_revenue DESC
LIMIT 10;


-- 17. Bottom 10 States by Revenue
SELECT
    state_name,
    SUM(revenue) AS total_revenue
FROM sales_data
GROUP BY state_name
ORDER BY total_revenue ASC
LIMIT 10;


-- =====================================================
-- SECTION 3 : CUSTOMER ANALYSIS
-- =====================================================

-- 18. Top 10 Customers by Revenue
SELECT
    customer_name,
    SUM(revenue) AS total_revenue
FROM sales_data
GROUP BY customer_name
ORDER BY total_revenue DESC
LIMIT 10;


-- 19. Top 10 Customers by Profit
SELECT
    customer_name,
    SUM(profit) AS total_profit
FROM sales_data
GROUP BY customer_name
ORDER BY total_profit DESC
LIMIT 10;


-- 20. Top 10 Customers by Average Revenue

SELECT
    customer_name,
    ROUND(AVG(revenue),2) AS avg_revenue
FROM sales_data
GROUP BY customer_name
ORDER BY avg_revenue DESC
LIMIT 10;


-- 21. Top 10 Customers by Average Profit

SELECT
    customer_name,
    ROUND(AVG(profit),2) AS avg_profit
FROM sales_data
GROUP BY customer_name
ORDER BY avg_profit DESC
LIMIT 10;


-- =====================================================
-- SECTION 4 : PRODUCT ANALYSIS
-- =====================================================

-- 22. Top 10 Products by Revenue
SELECT
    product_name,
    SUM(revenue) AS total_revenue
FROM sales_data
GROUP BY product_name
ORDER BY total_revenue DESC
LIMIT 10;


-- 23. Top 10 Products by Profit
SELECT
    product_name,
    SUM(profit) AS total_profit
FROM sales_data
GROUP BY product_name
ORDER BY total_profit DESC
LIMIT 10;


-- 24. Bottom 10 Products by Revenue
SELECT
    product_name,
    SUM(revenue) AS total_revenue
FROM sales_data
GROUP BY product_name
ORDER BY total_revenue ASC
LIMIT 10;


-- 25. Bottom 10 Products by Profit
SELECT
    product_name,
    SUM(profit) AS total_profit
FROM sales_data
GROUP BY product_name
ORDER BY total_profit ASC
LIMIT 10;


-- 26. Total Quantity Sold by Product
SELECT
    product_name,
    SUM(quantity) AS total_quantity
FROM sales_data
GROUP BY product_name
ORDER BY total_quantity DESC;


-- 27. Average Selling Price by Product
SELECT
    product_name,
    ROUND(AVG(unit_price),2) AS average_price
FROM sales_data
GROUP BY product_name
ORDER BY average_price DESC;

-- =====================================================
-- SECTION 5 : TIME SERIES ANALYSIS
-- =====================================================

-- 28. Monthly Revenue Trend
SELECT
    order_month,
    SUM(revenue) AS total_revenue
FROM sales_data
GROUP BY order_month_num, order_month
ORDER BY order_month_num;


-- 29. Monthly Profit Trend
SELECT
    order_month,
    SUM(profit) AS total_profit
FROM sales_data
GROUP BY order_month_num, order_month
ORDER BY order_month_num;


-- 30. Monthly Quantity Sold
SELECT
    order_month,
    SUM(quantity) AS total_quantity
FROM sales_data
GROUP BY order_month_num, order_month
ORDER BY order_month_num;


-- 31. Best Sales Month
SELECT
    order_month,
    SUM(revenue) AS total_revenue
FROM sales_data
GROUP BY order_month_num, order_month
ORDER BY total_revenue DESC
LIMIT 1;


-- 32. Lowest Sales Month
SELECT
    order_month,
    SUM(revenue) AS total_revenue
FROM sales_data
GROUP BY order_month_num, order_month
ORDER BY total_revenue ASC
LIMIT 1;


-- 33. Best Profit Month
SELECT
    order_month,
    SUM(profit) AS total_profit
FROM sales_data
GROUP BY order_month_num, order_month
ORDER BY total_profit DESC
LIMIT 1;


-- 34. Monthly Average Revenue
SELECT
    order_month,
    ROUND(AVG(revenue),2) AS average_revenue
FROM sales_data
GROUP BY order_month_num, order_month
ORDER BY order_month_num;


-- 35. Monthly Average Profit
SELECT
    order_month,
    ROUND(AVG(profit),2) AS average_profit
FROM sales_data
GROUP BY order_month_num, order_month
ORDER BY order_month_num;

-- =====================================================
-- SECTION 6 : ADVANCED SQL ANALYSIS
-- =====================================================

-- 36. Rank Products by Revenue
SELECT
    product_name,
    SUM(revenue) AS total_revenue,
    RANK() OVER (ORDER BY SUM(revenue) DESC) AS revenue_rank
FROM sales_data
GROUP BY product_name;


-- 37. Dense Rank Customers by Profit
SELECT
    customer_name,
    SUM(profit) AS total_profit,
    DENSE_RANK() OVER (ORDER BY SUM(profit) DESC) AS profit_rank
FROM sales_data
GROUP BY customer_name;


-- 38. Row Number for Orders by Revenue
SELECT
    order_number,
    revenue,
    ROW_NUMBER() OVER (ORDER BY revenue DESC) AS row_num
FROM sales_data;


-- 39. Running Total Revenue by Month
SELECT
    order_month,
    SUM(revenue) AS monthly_revenue,
    SUM(SUM(revenue)) OVER (
        ORDER BY order_month_num
    ) AS running_total
FROM sales_data
GROUP BY order_month_num, order_month;


-- 40. Revenue Contribution (%) by Region
SELECT
    us_region,
    SUM(revenue) AS total_revenue,
    ROUND(
        SUM(revenue) * 100 /
        SUM(SUM(revenue)) OVER (),
        2
    ) AS revenue_percentage
FROM sales_data
GROUP BY us_region;


-- 41. Top Customer in Each Region
WITH customer_sales AS
(
    SELECT
        us_region,
        customer_name,
        SUM(revenue) AS total_revenue,
        RANK() OVER
        (
            PARTITION BY us_region
            ORDER BY SUM(revenue) DESC
        ) AS rnk
    FROM sales_data
    GROUP BY us_region, customer_name
)

SELECT
    us_region,
    customer_name,
    total_revenue
FROM customer_sales
WHERE rnk = 1;


-- 42. Top Product in Each Region
WITH product_sales AS
(
    SELECT
        us_region,
        product_name,
        SUM(revenue) AS total_revenue,
        RANK() OVER
        (
            PARTITION BY us_region
            ORDER BY SUM(revenue) DESC
        ) AS rnk
    FROM sales_data
    GROUP BY us_region, product_name
)

SELECT
    us_region,
    product_name,
    total_revenue
FROM product_sales
WHERE rnk = 1;


-- 43. Highest Profit Order
SELECT
    order_number,
    customer_name,
    product_name,
    profit
FROM sales_data
ORDER BY profit DESC
LIMIT 1;


-- 44. Highest Revenue Order
SELECT
    order_number,
    customer_name,
    product_name,
    revenue
FROM sales_data
ORDER BY revenue DESC
LIMIT 1;


-- 45. Top 5 Most Profitable Products
SELECT
    product_name,
    SUM(profit) AS total_profit
FROM sales_data
GROUP BY product_name
ORDER BY total_profit DESC
LIMIT 5;

-- =====================================================
-- End of SQL Analysis
-- Total Queries : 45
-- =====================================================