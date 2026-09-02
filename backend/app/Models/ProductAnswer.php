<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductAnswer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'product_question_id',
        'user_id',
        'answer',
        'is_seller_answer',
    ];

    protected function casts(): array
    {
        return ['is_seller_answer' => 'boolean'];
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(ProductQuestion::class, 'product_question_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
