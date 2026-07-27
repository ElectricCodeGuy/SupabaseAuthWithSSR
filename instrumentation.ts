let started = false;

export async function register() {
  if (
    started ||
    process.env.NEXT_RUNTIME !== 'nodejs' ||
    process.env.AGENTPOND_ENABLED !== 'true'
  ) {
    return;
  }

  const [
    { createSupabaseSpanExporter },
    { isOpenInferenceSpan, OpenInferenceSimpleSpanProcessor },
    { NodeTracerProvider }
  ] = await Promise.all([
    import('@agentpond/supabase'),
    import('@arizeai/openinference-vercel'),
    import('@opentelemetry/sdk-trace-node')
  ]);

  const exporter = createSupabaseSpanExporter();
  const processor = new OpenInferenceSimpleSpanProcessor({
    exporter,
    spanFilter: isOpenInferenceSpan,
    reparentOrphanedSpans: true
  });
  const provider = new NodeTracerProvider({ spanProcessors: [processor] });
  provider.register();
  started = true;
}
