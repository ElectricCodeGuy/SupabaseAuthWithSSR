// Maps an ai_models.provider value to a local logo in public/images/ai-providers/.
// We use bundled images instead of the DB logo_url so there is nothing to host.
// The app is Anthropic-only; the switch stays so adding a provider later is a
// one-line change.
export function providerLogo(provider: string): string {
  switch (provider) {
    case 'anthropic':
      return '/images/ai-providers/anthropic-logo.svg';
    default:
      return '';
  }
}
