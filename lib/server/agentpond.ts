import 'server-only';

export function agentPondTelemetry(functionId: string) {
  return {
    isEnabled: process.env.AGENTPOND_ENABLED === 'true',
    recordInputs: true,
    recordOutputs: true,
    functionId
  } as const;
}
