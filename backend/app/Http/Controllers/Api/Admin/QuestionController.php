<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductQuestionResource;
use App\Models\ProductAnswer;
use App\Models\ProductQuestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $questions = ProductQuestion::query()
            ->with(['product:id,name,slug', 'user:id,name', 'answers.user:id,name'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->when($request->filled('product_id'), fn ($q) => $q->where('product_id', $request->input('product_id')))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return $this->success($questions->through(fn ($question) => new ProductQuestionResource($question)));
    }

    public function reject(ProductQuestion $question): JsonResponse
    {
        $question->update(['status' => 'rejected']);

        return $this->success(new ProductQuestionResource($question), 'Question rejected');
    }

    public function destroy(ProductQuestion $question): JsonResponse
    {
        $question->delete();

        return $this->success(null, 'Question deleted successfully');
    }

    public function destroyAnswer(ProductQuestion $question, ProductAnswer $answer): JsonResponse
    {
        abort_unless($answer->product_question_id === $question->id, 404);

        $answer->delete();

        return $this->success(null, 'Answer deleted successfully');
    }
}
