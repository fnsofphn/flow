const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

async function fetchChart(symbol, range = '1d', interval = '5m') {
  const response = await fetch(`${YAHOO_BASE}/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`, {
    headers: {
      'User-Agent': 'flow-vercel-market-fetcher',
    },
  });

  if (!response.ok) {
    throw new Error(`Yahoo request failed for ${symbol}`);
  }

  const payload = await response.json();
  const result = payload?.chart?.result?.[0];

  if (!result) {
    throw new Error(`No market data for ${symbol}`);
  }

  const meta = result.meta ?? {};
  const timestamps = result.timestamp ?? [];
  const closes = result.indicators?.quote?.[0]?.close ?? [];
  const series = timestamps
    .map((timestamp, index) => ({ timestamp, close: closes[index] }))
    .filter((point) => typeof point.close === 'number');

  return {
    price: Number(meta.regularMarketPrice ?? meta.previousClose ?? 0),
    previousClose: Number(meta.chartPreviousClose ?? meta.previousClose ?? 0),
    currency: meta.currency ?? 'USD',
    series,
  };
}

export default async function handler(_req, res) {
  try {
    const [btc, gold, silver, usdVnd] = await Promise.all([
      fetchChart('BTC-USD'),
      fetchChart('GC=F'),
      fetchChart('SI=F'),
      fetchChart('USDVND=X', '5d', '1d'),
    ]);

    const usdToVnd = usdVnd.price || 0;
    const percent = (current, previous) => (previous ? ((current - previous) / previous) * 100 : 0);

    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    res.status(200).json({
      updatedAt: new Date().toISOString(),
      usdToVnd,
      assets: [
        {
          key: 'btc',
          label: 'Bitcoin',
          symbol: 'BTC/USD',
          usd: btc.price,
          vnd: btc.price * usdToVnd,
          changePercent: percent(btc.price, btc.previousClose),
          series: btc.series,
        },
        {
          key: 'gold',
          label: 'Vàng',
          symbol: 'XAU/USD',
          usd: gold.price,
          vnd: gold.price * usdToVnd,
          changePercent: percent(gold.price, gold.previousClose),
          series: gold.series,
        },
        {
          key: 'silver',
          label: 'Bạc',
          symbol: 'XAG/USD',
          usd: silver.price,
          vnd: silver.price * usdToVnd,
          changePercent: percent(silver.price, silver.previousClose),
          series: silver.series,
        },
      ],
    });
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Unknown market data error',
    });
  }
}
