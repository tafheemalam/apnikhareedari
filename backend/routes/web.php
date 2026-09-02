<?php

use Illuminate\Support\Facades\Route;

// This is an API-only backend; avoid serving the framework's default
// welcome page (unnecessary fingerprinting of the underlying stack).
Route::get('/', fn () => response()->json(['name' => config('app.name')]));
