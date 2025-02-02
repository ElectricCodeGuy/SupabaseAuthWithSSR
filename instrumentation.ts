import { registerOTel } from '@vercel/otel';
import { LangfuseExporter } from 'langfuse-vercel';

export function register() {
  registerOTel({
    serviceName: 'langfuse-vercel-ai-lovguiden',
    traceExporter: new LangfuseExporter()
  });
}
