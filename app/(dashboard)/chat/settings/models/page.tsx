import { type Metadata } from 'next';
import Image from 'next/image';
import Link from '@/components/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getCatalogModels } from '../../models';
import { providerLogo } from '@/lib/aiProviders';

export const metadata: Metadata = {
  title: 'AI Models - Chat settings'
};

const tierStyles: Record<string, string> = {
  low: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  medium:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
};

export default async function ModelsSettingsPage() {
  const models = await getCatalogModels();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        These are the AI models available in the chat. The model marked as your
        default is used for new messages — change it from the model picker in the
        chat input. Prices are per&nbsp;1M tokens (USD).
      </p>

      {models.length === 0 ? (
        <p className="text-sm text-muted-foreground">No models configured.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {models.map((model) => {
            const logo = providerLogo(model.provider);
            return (
              <Card key={model.model_id} className="gap-2">
                <CardHeader className="flex flex-row items-center gap-3 pb-0">
                  {logo && (
                    <Image
                      src={logo}
                      alt={model.provider}
                      width={28}
                      height={28}
                      className="h-7 w-7 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold leading-tight">
                      {model.display_name}
                    </h3>
                    <p className="text-xs capitalize text-muted-foreground">
                      {model.provider}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      tierStyles[model.cost_tier] ?? tierStyles.medium
                    }`}
                  >
                    {model.cost_tier}
                  </span>
                </CardHeader>

                <CardContent className="flex flex-col gap-2 text-sm">
                  <p className="text-muted-foreground">{model.description}</p>

                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <dt className="text-muted-foreground">Input</dt>
                    <dd className="text-right font-medium">
                      ${model.input_cost_per_million_usd}/1M
                    </dd>
                    <dt className="text-muted-foreground">Output</dt>
                    <dd className="text-right font-medium">
                      ${model.output_cost_per_million_usd}/1M
                    </dd>
                    <dt className="text-muted-foreground">Typical cost</dt>
                    <dd className="text-right font-medium">{model.cost_note}</dd>
                  </dl>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground">
                      {model.selectable
                        ? 'Available to select'
                        : 'Not selectable'}
                    </span>
                    {model.source_url && (
                      <Link
                        href={model.source_url}
                        target="_blank"
                        rel="noopener"
                        className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Learn more
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
