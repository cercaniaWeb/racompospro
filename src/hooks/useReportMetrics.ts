import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

interface ReportMetrics {
    totalSales: number;
    totalOrders: number;
    totalProducts: number;
    avgOrder: number;
}

interface MetricChanges {
    sales: number;
    orders: number;
    products: number;
    avgOrder: number;
}

interface UseReportMetricsReturn {
    metrics: ReportMetrics;
    changes: MetricChanges;
    loading: boolean;
    error: string | null;
}

export const useReportMetrics = (): UseReportMetricsReturn => {
    const data = useLiveQuery(async () => {
        const now = new Date();
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        // Fetch all sales (local DB is fast enough to filter in memory for typical dataset sizes)
        // Optimization: In a real large app, use 'where' clauses with indexes.
        const allSales = await db.sales.toArray();
        const allItems = await db.saleItems.toArray();

        // Filter Current Month
        const currentMonthSalesData = allSales.filter(s => new Date(s.created_at) >= startOfCurrentMonth);
        const currentSalesIds = new Set(currentMonthSalesData.map(s => s.id));
        const currentMonthItems = allItems.filter(i => i.sale_id && currentSalesIds.has(i.sale_id));

        // Filter Last Month
        const lastMonthSalesData = allSales.filter(s => {
            const d = new Date(s.created_at);
            return d >= startOfLastMonth && d <= endOfLastMonth;
        });
        const lastSalesIds = new Set(lastMonthSalesData.map(s => s.id));
        const lastMonthItems = allItems.filter(i => i.sale_id && lastSalesIds.has(i.sale_id));

        // Calculate Metrics
        const calculateMetrics = (sales: typeof allSales, items: typeof allItems) => {
            const totalSales = sales.reduce((sum, sale) => sum + (sale.net_amount || 0), 0);
            const totalOrders = sales.length;
            const totalProducts = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
            const avgOrder = totalOrders > 0 ? totalSales / totalOrders : 0;
            return { totalSales, totalOrders, totalProducts, avgOrder };
        };

        const currentMetrics = calculateMetrics(currentMonthSalesData, currentMonthItems);
        const lastMetrics = calculateMetrics(lastMonthSalesData, lastMonthItems);

        // Calculate % Changes
        const calculateChange = (current: number, last: number): number => {
            if (last === 0) return current > 0 ? 100 : 0;
            return ((current - last) / last) * 100;
        };

        const changes = {
            sales: calculateChange(currentMetrics.totalSales, lastMetrics.totalSales),
            orders: calculateChange(currentMetrics.totalOrders, lastMetrics.totalOrders),
            products: calculateChange(currentMetrics.totalProducts, lastMetrics.totalProducts),
            avgOrder: calculateChange(currentMetrics.avgOrder, lastMetrics.avgOrder),
        };

        return { metrics: currentMetrics, changes };
    });

    return {
        metrics: data?.metrics || { totalSales: 0, totalOrders: 0, totalProducts: 0, avgOrder: 0 },
        changes: data?.changes || { sales: 0, orders: 0, products: 0, avgOrder: 0 },
        loading: !data,
        error: null
    };
};
