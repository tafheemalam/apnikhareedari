<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    protected const REVENUE_STATUSES = ['confirmed', 'processing', 'packed', 'shipped', 'delivered'];

    public function index(): JsonResponse
    {
        return $this->success([
            'totals' => [
                'products' => Product::count(),
                'active_products' => Product::active()->count(),
                'categories' => Category::count(),
                'orders' => Order::count(),
                'pending_orders' => Order::status('pending')->count(),
                'processing_orders' => Order::status('processing')->count(),
                'completed_orders' => Order::status('delivered')->count(),
                'cancelled_orders' => Order::status('cancelled')->count(),
                'total_sales' => (float) Order::whereIn('status', self::REVENUE_STATUSES)->sum('total'),
                'today_sales' => (float) Order::whereIn('status', self::REVENUE_STATUSES)->today()->sum('total'),
                'low_stock_products' => Inventory::lowStock()->count(),
                'out_of_stock_products' => Inventory::outOfStock()->count(),
            ],
            'recent_orders' => Order::with('user:id,name')
                ->latest('placed_at')->take(10)->get()
                ->map(fn (Order $o) => [
                    'id' => $o->id,
                    'order_number' => $o->order_number,
                    'customer' => $o->user?->name ?? $o->shipping_full_name,
                    'status' => $o->status,
                    'total' => $o->total,
                    'placed_at' => $o->placed_at,
                ]),
            'recent_customers' => User::whereDoesntHave('roles')
                ->latest()->take(10)->get(['id', 'name', 'email', 'created_at']),
            'charts' => [
                'daily_sales' => $this->dailySales(),
                'monthly_sales' => $this->monthlySales(),
                'orders_by_status' => $this->ordersByStatus(),
                'top_selling_products' => $this->topSellingProducts(),
            ],
        ]);
    }

    protected function dailySales(): array
    {
        $rows = Order::whereIn('status', self::REVENUE_STATUSES)
            ->where('placed_at', '>=', now()->subDays(29)->startOfDay())
            ->selectRaw('DATE(placed_at) as date, SUM(total) as total')
            ->groupBy('date')
            ->pluck('total', 'date');

        return collect(range(0, 29))->map(function ($daysAgo) use ($rows) {
            $date = now()->subDays(29 - $daysAgo)->toDateString();

            return ['date' => $date, 'total' => (float) ($rows[$date] ?? 0)];
        })->values()->all();
    }

    protected function monthlySales(): array
    {
        $rows = Order::whereIn('status', self::REVENUE_STATUSES)
            ->where('placed_at', '>=', now()->subMonths(11)->startOfMonth())
            ->selectRaw("DATE_FORMAT(placed_at, '%Y-%m') as month, SUM(total) as total")
            ->groupBy('month')
            ->pluck('total', 'month');

        return collect(range(0, 11))->map(function ($monthsAgo) use ($rows) {
            $month = now()->subMonths(11 - $monthsAgo)->format('Y-m');

            return ['month' => $month, 'total' => (float) ($rows[$month] ?? 0)];
        })->values()->all();
    }

    protected function ordersByStatus(): array
    {
        return Order::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->all();
    }

    protected function topSellingProducts(): array
    {
        return DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereIn('orders.status', self::REVENUE_STATUSES)
            ->select('order_items.product_id', 'order_items.product_name', DB::raw('SUM(order_items.quantity) as units_sold'))
            ->groupBy('order_items.product_id', 'order_items.product_name')
            ->orderByDesc('units_sold')
            ->take(10)
            ->get()
            ->toArray();
    }
}
