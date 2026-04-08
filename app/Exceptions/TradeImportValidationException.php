<?php

namespace App\Exceptions;

use RuntimeException;

class TradeImportValidationException extends RuntimeException
{
    public function __construct(
        string $message,
        public array $rowErrors = [],
        public ?string $batchUuid = null
    ) {
        parent::__construct($message);
    }
}

