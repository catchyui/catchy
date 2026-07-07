<?php

declare(strict_types=1);

namespace Catchyui\Catchy\Domain\Contracts;

use Catchyui\Catchy\Domain\ValueObjects\CatchyPipelineData;
use Closure;

/**
 * Interface PipelineStageInterface
 *
 * Defines the contract for all stages processed within the Catchy SPA HTTP pipeline.
 */
interface PipelineStageInterface
{
    /**
     * Handle the pipeline stage.
     *
     * @param  Closure(CatchyPipelineData): (CatchyPipelineData)  $next
     */
    public function handle(CatchyPipelineData $data, Closure $next): CatchyPipelineData;
}
