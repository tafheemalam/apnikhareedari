<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    public const PERMISSIONS = [
        'view-dashboard',
        'manage-categories',
        'manage-products',
        'manage-inventory',
        'manage-orders',
        'manage-coupons',
        'manage-reviews',
        'manage-questions',
        'manage-settings',
        'manage-admins',
    ];

    public const ROLE_PERMISSIONS = [
        'Super Admin' => self::PERMISSIONS,
        'Admin' => [
            'view-dashboard', 'manage-categories', 'manage-products', 'manage-inventory',
            'manage-orders', 'manage-coupons', 'manage-reviews', 'manage-questions', 'manage-settings',
        ],
        'Inventory Manager' => ['view-dashboard', 'manage-inventory'],
        'Order Manager' => ['view-dashboard', 'manage-orders'],
    ];

    public function run(): void
    {
        foreach (self::PERMISSIONS as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        foreach (self::ROLE_PERMISSIONS as $roleName => $permissions) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $role->syncPermissions($permissions);
        }
    }
}
