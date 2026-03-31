<?php

namespace App\Services;

use App\Models\Trade;
use App\Models\TradingAccount;
use Illuminate\Support\Collection;

class MT4CSVParser
{
    /**
     * MT4/MT5 CSV Column Mapping
     * MT4 typically exports: Ticket,OpenTime,Type,Size,Instrument,Price,S/L,T/P,CloseTime,ClosePrice,Commission,Taxes,Swap,Profit,Comment
     * MT5 typically exports: Deal Ticket,Deal Time,Type,Volume,Asset,Open Price,Stop Loss,Take Profit,Close Time,Close Price,Commission,Fees,Swaps,Profit,Comment
     */
    
    protected $requiredColumns = ['closetime', 'profit'];
    protected $optionalColumns = ['symbol', 'instrument', 'type', 'size', 'volume', 'openprice', 'closeprice', 'comment'];

    public function parse(string $csvContent): array
    {
        $lines = array_filter(explode("\n", $csvContent));
        if (count($lines) < 2) {
            throw new \Exception('CSV file is empty or invalid');
        }

        $header = str_getcsv(trim(array_shift($lines)));
        $headerLower = array_map('strtolower', $header);

        $this->validateHeader($headerLower);

        $trades = [];
        $errors = [];

        foreach ($lines as $index => $line) {
            if (empty(trim($line))) continue;

            try {
                $row = str_getcsv(trim($line));
                $trade = $this->mapRowToTrade($row, $headerLower);
                if ($trade) {
                    $trades[] = $trade;
                }
            } catch (\Exception $e) {
                $errors[] = "Line " . ($index + 2) . ": " . $e->getMessage();
            }
        }

        return [
            'trades' => $trades,
            'errors' => $errors,
            'total' => count($trades),
        ];
    }

    protected function validateHeader(array $headerLower): void
    {
        foreach ($this->requiredColumns as $col) {
            if (!in_array($col, $headerLower)) {
                throw new \Exception("Missing required column: {$col}");
            }
        }
    }

    protected function mapRowToTrade(array $row, array $header): ?array
    {
        $data = array_combine($header, $row);

        $closeTime = $this->parseDateTime($data['closetime'] ?? null);
        $profit = (float) ($data['profit'] ?? 0);

        if (!$closeTime) {
            throw new \Exception('Invalid or missing close time');
        }

        // Extract symbol - try different column names
        $symbol = $data['symbol'] ?? $data['instrument'] ?? 'UNKNOWN';
        $symbol = strtoupper(trim($symbol));

        // Determine trade type
        $type = strtolower($data['type'] ?? 'buy');
        if (stripos($type, 'sell') !== false || stripos($type, 'short') !== false) {
            $type = 'sell';
        } else {
            $type = 'buy';
        }

        // Extract size/volume
        $lot_size = (float) ($data['size'] ?? $data['volume'] ?? 0);

        // Extract prices if available
        $openPrice = (float) ($data['openprice'] ?? 0);
        $closePrice = (float) ($data['closeprice'] ?? 0);

        // Extract comment/setup tag from comment field
        $comment = trim($data['comment'] ?? '');
        $strategyTag = $this->extractStrategyTag($comment);

        return [
            'symbol' => $symbol,
            'type' => $type,
            'lot_size' => $lot_size,
            'pnl' => $profit,
            'close_time' => $closeTime,
            'strategy_tag' => $strategyTag,
            'open_price' => $openPrice ?: null,
            'close_price' => $closePrice ?: null,
            'comment' => $comment ?: null,
        ];
    }

    protected function parseDateTime(?string $dateString): ?\DateTime
    {
        if (!$dateString) return null;

        $dateString = trim($dateString);

        // Try common MT4/MT5 formats
        $formats = [
            'Y.m.d H:i:s',    // MT4 format: 2026.03.31 14:30:00
            'Y-m-d H:i:s',    // 2026-03-31 14:30:00
            'Y/m/d H:i:s',    // 2026/03/31 14:30:00
            'd.m.Y H:i:s',    // 31.03.2026 14:30:00
            'm/d/Y H:i:s',    // 03/31/2026 14:30:00
            'Y-m-d\TH:i:\Z',  // ISO format
        ];

        foreach ($formats as $format) {
            $date = \DateTime::createFromFormat($format, $dateString);
            if ($date) {
                return $date;
            }
        }

        // Try strtotime as fallback
        $timestamp = strtotime($dateString);
        if ($timestamp !== false) {
            return new \DateTime('@' . $timestamp);
        }

        return null;
    }

    protected function extractStrategyTag(string $comment): string
    {
        if (empty($comment)) return 'Imported';

        // Look for common setup names in comments
        $patterns = [
            '/silver\s+bullet/i' => 'Silver Bullet',
            '/judas\s+swing/i' => 'Judas Swing',
            '/london\s+sweep/i' => 'London Sweep',
            '/ob\s+reclaim/i' => 'OB Reclaim',
            '/breaker\s+trade/i' => 'Breaker Trade',
            '/trend\s+follow/i' => 'Trend Follow',
        ];

        foreach ($patterns as $pattern => $tag) {
            if (preg_match($pattern, $comment)) {
                return $tag;
            }
        }

        // Return first 30 chars of comment as tag
        return substr(trim($comment), 0, 30) ?: 'Imported';
    }
}
