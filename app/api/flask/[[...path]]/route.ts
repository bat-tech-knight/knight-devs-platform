import { NextRequest, NextResponse } from 'next/server';

function resolveFlaskOrigin(): string {
  const fromEnv = process.env.FLASK_API_URL?.trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === 'development') return 'http://127.0.0.1:5328';
  return '';
}

async function proxyToFlask(
  request: NextRequest,
  pathSegments: string[]
): Promise<NextResponse> {
  const origin = resolveFlaskOrigin();
  if (!origin) {
    return NextResponse.json(
      {
        success: false,
        error: 'FLASK_API_URL is not configured',
        error_type: 'configuration_error',
      },
      { status: 503 }
    );
  }

  const subpath = pathSegments.length ? pathSegments.join('/') : '';
  const pathname = subpath ? `/api/${subpath}` : '/api';
  const targetUrl = new URL(pathname + request.nextUrl.search, origin);

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);

  let body: ArrayBuffer | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
    });
  } catch (err) {
    console.error('[api/flask proxy] upstream fetch failed', targetUrl.toString(), err);
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to reach Flask API',
        error_type: 'upstream_unreachable',
      },
      { status: 502 }
    );
  }

  // Node fetch decompresses gzip/br bodies but may keep Content-Encoding / Content-Length
  // from upstream; forwarding those with a decompressed body breaks the browser (ERR_CONTENT_DECODING_FAILED).
  const outHeaders = new Headers(upstream.headers);
  outHeaders.delete('content-encoding');
  outHeaders.delete('content-length');
  outHeaders.delete('transfer-encoding');

  return new NextResponse(await upstream.arrayBuffer(), {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: outHeaders,
  });
}

type RouteCtx = { params: Promise<{ path?: string[] }> };

export async function GET(request: NextRequest, ctx: RouteCtx) {
  const { path = [] } = await ctx.params;
  return proxyToFlask(request, path);
}

export async function POST(request: NextRequest, ctx: RouteCtx) {
  const { path = [] } = await ctx.params;
  return proxyToFlask(request, path);
}

export async function PUT(request: NextRequest, ctx: RouteCtx) {
  const { path = [] } = await ctx.params;
  return proxyToFlask(request, path);
}

export async function PATCH(request: NextRequest, ctx: RouteCtx) {
  const { path = [] } = await ctx.params;
  return proxyToFlask(request, path);
}

export async function DELETE(request: NextRequest, ctx: RouteCtx) {
  const { path = [] } = await ctx.params;
  return proxyToFlask(request, path);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
