// Maps an ai_models.provider value to a local logo in public/images/ai-providers/.
// We use bundled images instead of the DB logo_url so there is nothing to host.
export function providerLogo(provider: string): string {
  switch (provider) {
    case 'anthropic':
      return '/images/ai-providers/anthropic-logo.svg';
    case 'google':
      return '/images/ai-providers/gemini-logo.svg';
    case 'openai':
      return '/images/ai-providers/chatgpt-logo.svg';
    default:
      return '';
  }
}
