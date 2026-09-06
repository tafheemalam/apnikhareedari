<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AnswerRequest;
use App\Http\Requests\QuestionRequest;
use App\Http\Resources\ProductAnswerResource;
use App\Http\Resources\ProductQuestionResource;
use App\Models\Product;
use App\Models\ProductAnswer;
use App\Models\ProductQuestion;
use Illuminate\Http\JsonResponse;

class QuestionController extends Controller
{
    public function index(Product $product): JsonResponse
    {
        $questions = $product->approvedQuestions()
            ->with(['user:id,name', 'answers.user:id,name'])
            ->latest()
            ->paginate(10);

        return $this->success($questions->through(fn ($question) => new ProductQuestionResource($question)));
    }

    public function store(QuestionRequest $request, Product $product): JsonResponse
    {
        $question = ProductQuestion::create([
            'product_id' => $product->id,
            'user_id' => $request->user()->id,
            'question' => $request->validated('question'),
            'status' => 'pending',
        ]);

        return $this->success(new ProductQuestionResource($question->load('user:id,name')), 'Question submitted', 201);
    }

    public function storeAnswer(AnswerRequest $request, ProductQuestion $question): JsonResponse
    {
        $answer = ProductAnswer::create([
            'product_question_id' => $question->id,
            'user_id' => $request->user()->id,
            'answer' => $request->validated('answer'),
            'is_seller_answer' => $request->user()->isAdminUser(),
        ]);

        return $this->success(new ProductAnswerResource($answer->load('user:id,name')), 'Answer submitted', 201);
    }
}
