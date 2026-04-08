<?php

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (ValidationException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'error' => [
                    'type' => 'validation_error',
                    'code' => 'VALIDATION_ERROR',
                    'status' => 422,
                    'details' => $e->errors(),
                ],
            ], 422);
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => 'Authentication required.',
                'error' => [
                    'type' => 'authentication_error',
                    'code' => 'UNAUTHENTICATED',
                    'status' => 401,
                    'details' => [],
                ],
            ], 401);
        });

        $exceptions->render(function (AuthorizationException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => 'You are not allowed to perform this action.',
                'error' => [
                    'type' => 'authorization_error',
                    'code' => 'FORBIDDEN',
                    'status' => 403,
                    'details' => [],
                ],
            ], 403);
        });

        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => 'Resource not found.',
                'error' => [
                    'type' => 'not_found_error',
                    'code' => 'NOT_FOUND',
                    'status' => 404,
                    'details' => [],
                ],
            ], 404);
        });

        $exceptions->render(function (ModelNotFoundException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => 'Resource not found.',
                'error' => [
                    'type' => 'not_found_error',
                    'code' => 'NOT_FOUND',
                    'status' => 404,
                    'details' => [],
                ],
            ], 404);
        });

        $exceptions->render(function (HttpExceptionInterface $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            $status = $e->getStatusCode();
            $map = [
                403 => ['authorization_error', 'FORBIDDEN', 'You are not allowed to perform this action.'],
                404 => ['not_found_error', 'NOT_FOUND', 'Resource not found.'],
                405 => ['method_not_allowed_error', 'METHOD_NOT_ALLOWED', 'Method not allowed for this endpoint.'],
                429 => ['rate_limit_error', 'TOO_MANY_REQUESTS', 'Too many requests. Please try again shortly.'],
            ];
            [$type, $code, $message] = $map[$status] ?? ['http_error', 'HTTP_ERROR', 'HTTP error.'];

            return response()->json([
                'success' => false,
                'message' => $message,
                'error' => [
                    'type' => $type,
                    'code' => $code,
                    'status' => $status,
                    'details' => [],
                ],
            ], $status);
        });

        $exceptions->render(function (\Throwable $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => 'Unexpected server error.',
                'error' => [
                    'type' => 'server_error',
                    'code' => 'INTERNAL_SERVER_ERROR',
                    'status' => 500,
                    'details' => app()->isLocal() ? ['exception' => class_basename($e)] : [],
                ],
            ], 500);
        });
    })->create();
