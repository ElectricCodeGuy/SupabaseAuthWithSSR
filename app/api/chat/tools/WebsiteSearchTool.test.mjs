import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { generateText, isStepCount } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { websiteSearchTool } from './WebsiteSearchTool.ts';

const sessionId = '22666b53-9158-42a3-8375-244347039560';
const modelName = 'configured-model';
const query = 'Next.js server authentication guide';
const input = { query };
const options = { toolCallId: 'search-1', messages: [] };
const makeTool = () =>
  websiteSearchTool({ chatSessionId: sessionId, modelName });
const envNames = ['WEB_SEARCH_PROVIDER', 'EXA_API_KEY', 'PARALLEL_API_KEY'];
const savedEnv = Object.fromEntries(
  envNames.map((key) => [key, process.env[key]])
);
let mocks;

beforeEach((t) => {
  mocks = t.mock;
  for (const key of envNames) delete process.env[key];
  mocks.method(console, 'error', () => {});
});

afterEach(() => {
  for (const key of envNames) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

const page = {
  title: 'Authentication guide',
  url: 'https://nextjs.org/docs/app/guides/authentication',
  excerpts: ['Validate the user session on the server.'],
  publish_date: '2026-10-01'
};

function mockMCP({ result, onSearch, onInitialize } = {}) {
  const requests = [];
  mocks.method(globalThis, 'fetch', async (url, init) => {
    assert.equal(String(url), 'https://search.parallel.ai/mcp');
    const headers = new Headers(init.headers);
    assert.match(headers.get('user-agent'), /SupaChat\/5\.1\.0/);
    assert.equal(headers.has('authorization'), false);
    assert.equal(headers.has('x-api-key'), false);
    if (init.method === 'GET' || init.method === 'DELETE') {
      requests.push({ method: init.method, headers, signal: init.signal });
      return new Response(null, { status: init.method === 'GET' ? 405 : 204 });
    }
    const request = JSON.parse(init.body);
    requests.push({ ...request, headers, signal: init.signal });
    if (request.id === undefined) return new Response(null, { status: 202 });
    let response;
    switch (request.method) {
      case 'initialize':
        if (onInitialize) return onInitialize(init.signal);
        response = {
          protocolVersion: request.params.protocolVersion,
          capabilities: { tools: {} },
          serverInfo: { name: 'test-parallel', version: '1.0.0' }
        };
        break;
      case 'tools/list':
        response = {
          tools: [
            {
              name: 'web_search',
              inputSchema: {
                type: 'object',
                properties: {
                  objective: { type: 'string' },
                  search_queries: { type: 'array', items: { type: 'string' } }
                },
                required: ['objective', 'search_queries']
              }
            }
          ]
        };
        break;
      case 'tools/call':
        assert.equal(request.params.name, 'web_search');
        assert.deepEqual(request.params.arguments, {
          objective: query,
          search_queries: [query],
          session_id: sessionId,
          model_name: modelName
        });
        if (onSearch) return onSearch(init.signal);
        response = result ?? {
          content: [],
          structuredContent: { results: [page] }
        };
        break;
      default:
        assert.fail(`Unexpected MCP request: ${request.method}`);
    }
    return Response.json(
      { jsonrpc: '2.0', id: request.id, result: response },
      { headers: { 'mcp-session-id': 'test-mcp-session' } }
    );
  });
  return requests;
}

test('unset and explicit exa keep the existing endpoint, key and output', async () => {
  process.env.EXA_API_KEY = 'test-exa';
  const requests = [];
  mocks.method(globalThis, 'fetch', async (url, init) => {
    requests.push(url);
    assert.equal(url, 'https://api.exa.ai/search');
    assert.equal(init.headers['x-api-key'], 'test-exa');
    const body = JSON.parse(init.body);
    assert.equal(body.query, query);
    assert.equal(body.numResults, 5);
    assert.equal(body.contents.text.maxCharacters, 8000);
    assert.deepEqual(body.contents.highlights, { query, maxCharacters: 1500 });
    return Response.json({
      results: [
        {
          title: page.title,
          url: page.url,
          text: 'Full page',
          highlights: page.excerpts,
          publishedDate: page.publish_date
        }
      ]
    });
  });
  for (const provider of [undefined, 'exa']) {
    if (provider) process.env.WEB_SEARCH_PROVIDER = provider;
    const output = await makeTool().execute(input, options);
    assert.deepEqual(output.context, [
      {
        type: 'website',
        title: page.title,
        url: page.url,
        content: 'Full page',
        highlights: page.excerpts,
        publishedDate: page.publish_date
      }
    ]);
  }
  assert.equal(requests.length, 2);
});

test('Parallel runs keylessly through the tool and AI SDK follow-up consumes sources', async () => {
  process.env.WEB_SEARCH_PROVIDER = 'parallel';
  const requests = mockMCP();
  const usage = { inputTokens: { total: 10 }, outputTokens: { total: 10 } };
  let calls = 0;
  const model = new MockLanguageModelV4({
    doGenerate: async ({ prompt }) => {
      if (calls++ === 0)
        return {
          content: [
            {
              type: 'tool-call',
              toolCallId: 'search-1',
              toolName: 'websiteSearchTool',
              input: JSON.stringify(input)
            }
          ],
          finishReason: { unified: 'tool-calls', raw: 'tool_calls' },
          usage,
          warnings: []
        };
      const output = prompt.find((message) => message.role === 'tool')
        .content[0].output.value;
      assert.match(output.instructions, /Cite sources inline/);
      assert.deepEqual(output.context, [
        {
          type: 'website',
          title: page.title,
          url: page.url,
          highlights: page.excerpts,
          content: '',
          publishedDate: page.publish_date
        }
      ]);
      return {
        content: [
          { type: 'text', text: `[${page.title}](${output.context[0].url})` }
        ],
        finishReason: { unified: 'stop', raw: 'stop' },
        usage,
        warnings: []
      };
    }
  });
  const result = await generateText({
    model,
    prompt: query,
    tools: { websiteSearchTool: makeTool() },
    stopWhen: isStepCount(2)
  });
  assert.equal(calls, 2);
  assert.match(result.text, /https:\/\/nextjs.org/);
  assert.deepEqual(
    requests
      .filter((r) => !['GET', 'DELETE'].includes(r.method))
      .map((r) => r.method),
    ['initialize', 'notifications/initialized', 'tools/list', 'tools/call']
  );
  assert.equal(requests.at(-1).method, 'DELETE');
});

test('Parallel parses text JSON and bounds excerpts, results and dates', async () => {
  process.env.WEB_SEARCH_PROVIDER = 'parallel';
  mockMCP({
    result: {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            results: Array.from({ length: 8 }, () => ({
              ...page,
              title: null,
              publish_date: 'invalid',
              excerpts: ['x'.repeat(9000)]
            }))
          })
        }
      ]
    }
  });
  const output = await makeTool().execute(input, options);
  assert.equal(output.context.length, 5);
  assert.equal(output.context[0].title, page.url);
  assert.equal(output.context[0].highlights.join('').length, 8000);
  assert.equal(output.context[0].publishedDate, undefined);
});

test('Parallel preserves an empty result set', async () => {
  process.env.WEB_SEARCH_PROVIDER = 'parallel';
  mockMCP({ result: { content: [], structuredContent: { results: [] } } });
  const output = await makeTool().execute(input, options);
  assert.deepEqual(output.context, []);
  assert.match(output.instructions, /don't actually answer/);
});

for (const [name, result] of [
  [
    'MCP tool error',
    { isError: true, content: [{ type: 'text', text: 'quota exceeded' }] }
  ],
  ['malformed JSON', { content: [{ type: 'text', text: 'bad json' }] }],
  [
    'invalid source URL',
    {
      content: [],
      structuredContent: { results: [{ ...page, url: 'javascript:alert(1)' }] }
    }
  ]
]) {
  test(`Parallel ${name} uses the existing failure surface without fallback`, async () => {
    process.env.WEB_SEARCH_PROVIDER = 'parallel';
    mockMCP({ result });
    const output = await makeTool().execute(input, options);
    assert.deepEqual(output.context, []);
    assert.match(output.instructions, /search failed/);
  });
}

test('HTTP errors do not retry or fall back to Exa', async () => {
  process.env.WEB_SEARCH_PROVIDER = 'parallel';
  const requests = mockMCP({
    onSearch: () => new Response('unavailable', { status: 503 })
  });
  const output = await makeTool().execute(input, options);
  assert.match(output.instructions, /search failed/);
  assert.equal(requests.filter((r) => r.method === 'tools/call').length, 1);
});

function waitForAbort(signal) {
  return new Promise((_resolve, reject) => {
    if (signal.aborted) reject(signal.reason);
    else
      signal.addEventListener('abort', () => reject(signal.reason), {
        once: true
      });
  });
}

test('user cancellation reaches the active MCP request and propagates', async () => {
  process.env.WEB_SEARCH_PROVIDER = 'parallel';
  const controller = new AbortController();
  mockMCP({
    onSearch: (signal) => {
      const pending = waitForAbort(signal);
      controller.abort(new DOMException('Stopped', 'AbortError'));
      return pending;
    }
  });
  await assert.rejects(
    makeTool().execute(input, { ...options, abortSignal: controller.signal }),
    { name: 'AbortError' }
  );
});

for (const phase of ['initialization', 'search']) {
  test(`the 30-second bound cancels stalled ${phase}`, async () => {
    process.env.WEB_SEARCH_PROVIDER = 'parallel';
    const timeout = AbortSignal.timeout.bind(AbortSignal);
    mocks.method(AbortSignal, 'timeout', (ms) => {
      assert.equal(ms, 30_000);
      return timeout(10);
    });
    mockMCP(
      phase === 'initialization'
        ? { onInitialize: waitForAbort }
        : { onSearch: waitForAbort }
    );
    // AbortSignal.timeout does not keep Node alive on its own.
    const keepAlive = setTimeout(() => {}, 1000);
    try {
      const output = await makeTool().execute(input, options);
      assert.match(output.instructions, /search failed/);
    } finally {
      clearTimeout(keepAlive);
    }
  });
}

test('unknown provider fails without making a request', async () => {
  process.env.WEB_SEARCH_PROVIDER = 'typo';
  mocks.method(globalThis, 'fetch', () => assert.fail('Unexpected request'));
  const output = await makeTool().execute(input, options);
  assert.match(output.instructions, /search failed/);
});
