const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';
const COINBASE_EXCHANGE_BASE = 'https://api.exchange.coinbase.com';
const BINANCE_FUTURES_BASE = 'https://fapi.binance.com';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const TROY_OUNCE_IN_GRAMS = 31.1034768;
const LUONG_IN_GRAMS = 37.5;
const CHI_IN_GRAMS = 3.75;

async function fetchJson(url, init) {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }

  return response.json();
}

async function fetchYahooChart(symbol, range = '1d', interval = '5m') {
  const payload = await fetchJson(`${YAHOO_BASE}/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`, {
    headers: {
      'User-Agent': 'flow-vercel-market-fetcher',
    },
  });

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

async function fetchCoinbaseTicker(productId = 'BTC-USD') {
  const payload = await fetchJson(`${COINBASE_EXCHANGE_BASE}/products/${productId}/ticker`, {
    headers: {
      'User-Agent': 'flow-vercel-market-fetcher',
    },
  });

  return {
    price: Number(payload?.price ?? 0),
    volume24h: Number(payload?.volume ?? 0),
    bid: Number(payload?.bid ?? 0),
    ask: Number(payload?.ask ?? 0),
    time: payload?.time ?? null,
  };
}

async function fetchCoinbaseCandles(productId = 'BTC-USD', granularity = 3600) {
  const payload = await fetchJson(`${COINBASE_EXCHANGE_BASE}/products/${productId}/candles?granularity=${granularity}`, {
    headers: {
      'User-Agent': 'flow-vercel-market-fetcher',
    },
  });

  return payload
    .map((entry) => ({
      timestamp: Number(entry?.[0] ?? 0),
      low: Number(entry?.[1] ?? 0),
      high: Number(entry?.[2] ?? 0),
      open: Number(entry?.[3] ?? 0),
      close: Number(entry?.[4] ?? 0),
      volume: Number(entry?.[5] ?? 0),
    }))
    .filter((entry) => Number.isFinite(entry.timestamp) && Number.isFinite(entry.close))
    .sort((left, right) => left.timestamp - right.timestamp);
}

async function fetchBinanceMetric(path, params) {
  const search = new URLSearchParams(params);
  return fetchJson(`${BINANCE_FUTURES_BASE}${path}?${search.toString()}`, {
    headers: {
      'User-Agent': 'flow-vercel-market-fetcher',
    },
  });
}

async function fetchCoinGeckoMarkets() {
  return fetchJson(
    `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=80&page=1&sparkline=false&price_change_percentage=24h`,
    {
      headers: {
      'User-Agent': 'flow-vercel-market-fetcher',
      },
    },
  );
}

async function fetchBinanceOpenInterest(symbol) {
  const payload = await fetchJson(`${BINANCE_FUTURES_BASE}/fapi/v1/openInterest?symbol=${encodeURIComponent(symbol)}`, {
    headers: {
      'User-Agent': 'flow-vercel-market-fetcher',
    },
  });

  return {
    symbol,
    openInterest: Number(payload?.openInterest ?? 0),
  };
}

async function buildTopOiMarketCapCoins() {
  const marketRows = await fetchCoinGeckoMarkets();
  const supportedCoins = Array.isArray(marketRows)
    ? marketRows.filter((coin) => {
        const symbol = String(coin?.symbol ?? '').toUpperCase();
        return symbol && !['USDT', 'USDC', 'BUSD', 'DAI', 'FDUSD', 'WBTC', 'WETH', 'STETH'].includes(symbol);
      })
    : [];

  const candidates = supportedCoins.slice(0, 30);
  const oiRows = await Promise.all(
    candidates.map(async (coin) => {
      const symbol = `${String(coin.symbol).toUpperCase()}USDT`;

      try {
        const oi = await fetchBinanceOpenInterest(symbol);
        const price = Number(coin.current_price ?? 0);
        const openInterestUsd = oi.openInterest * price;

        return {
          symbol: String(coin.symbol).toUpperCase(),
          price,
          marketCapUsd: Number(coin.market_cap ?? 0),
          openInterestUsd,
          oiMarketCapRatio: coin.market_cap ? openInterestUsd / Number(coin.market_cap) : 0,
          priceChangePercent4h: 0,
          oiChangePercent4h: 0,
          volumeChangePercent4h: 0,
        };
      } catch {
        return null;
      }
    }),
  );

  return oiRows
    .filter((item) => item && Number.isFinite(item.oiMarketCapRatio) && item.marketCapUsd > 0 && item.openInterestUsd > 0)
    .sort((left, right) => right.oiMarketCapRatio - left.oiMarketCapRatio)
    .slice(0, 5);
}

function percent(current, previous) {
  return previous ? ((current - previous) / previous) * 100 : 0;
}

function summarizeBtcMetrics(ticker, candles) {
  const lastEightCandles = candles.slice(-8);
  const previousBlock = lastEightCandles.slice(0, 4);
  const recentBlock = lastEightCandles.slice(-4);
  const priceReference = candles.at(-5)?.close ?? recentBlock[0]?.open ?? ticker.price;
  const previousVolume = previousBlock.reduce((sum, candle) => sum + candle.volume, 0);
  const recentVolume = recentBlock.reduce((sum, candle) => sum + candle.volume, 0);

  return {
    priceChange4h: percent(ticker.price, priceReference),
    volumeChange4h: percent(recentVolume, previousVolume),
    recentVolume4h: recentVolume,
    chartSeries: candles.slice(-24).map((candle) => ({
      timestamp: candle.timestamp,
      close: candle.close,
      volume: candle.volume,
    })),
  };
}

function buildMetalUnits(usdPerOunce, usdToVnd) {
  const vndPerGram = usdPerOunce && usdToVnd ? (usdPerOunce * usdToVnd) / TROY_OUNCE_IN_GRAMS : 0;

  return {
    vndPerLuong: vndPerGram * LUONG_IN_GRAMS,
    vndPerChi: vndPerGram * CHI_IN_GRAMS,
  };
}

function latestMetricPoint(series) {
  const item = Array.isArray(series) ? series.at(-1) : null;
  return item ?? null;
}

function getSettledValue(result, fallback) {
  return result.status === 'fulfilled' ? result.value : fallback;
}

function getSettledReason(result, label) {
  if (result.status === 'fulfilled') {
    return null;
  }

  const message = result.reason instanceof Error ? result.reason.message : String(result.reason ?? label);
  return `${label}: ${message}`;
}

export default async function handler(_req, res) {
  try {
    const results = await Promise.allSettled([
      fetchCoinbaseTicker('BTC-USD'),
      fetchCoinbaseCandles('BTC-USD', 3600),
      fetchYahooChart('GC=F'),
      fetchYahooChart('SI=F'),
      fetchYahooChart('USDVND=X', '5d', '1d'),
      fetchBinanceMetric('/futures/data/globalLongShortAccountRatio', { symbol: 'BTCUSDT', period: '4h', limit: '2' }),
      fetchBinanceMetric('/futures/data/topLongShortAccountRatio', { symbol: 'BTCUSDT', period: '4h', limit: '2' }),
      fetchBinanceMetric('/futures/data/takerlongshortRatio', { symbol: 'BTCUSDT', period: '4h', limit: '2' }),
      buildTopOiMarketCapCoins(),
    ]);

    const [
      btcTickerResult,
      btcCandlesResult,
      goldResult,
      silverResult,
      usdVndResult,
      globalLongShortResult,
      topAccountLongShortResult,
      takerVolumeResult,
      topOiMarketCapCoinsResult,
    ] = results;

    const btcTicker = getSettledValue(btcTickerResult, null);
    const btcCandles = getSettledValue(btcCandlesResult, []);
    const gold = getSettledValue(goldResult, null);
    const silver = getSettledValue(silverResult, null);
    const usdVnd = getSettledValue(usdVndResult, null);
    const globalLongShort = getSettledValue(globalLongShortResult, []);
    const topAccountLongShort = getSettledValue(topAccountLongShortResult, []);
    const takerVolume = getSettledValue(takerVolumeResult, []);
    const topOiMarketCapCoins = getSettledValue(topOiMarketCapCoinsResult, []);

    if (!btcTicker || !btcCandles.length || !gold || !silver || !usdVnd) {
      throw new Error('Không thể tải đủ dữ liệu nền từ Coinbase, Yahoo hoặc tỷ giá USD/VND.');
    }

    const usdToVnd = usdVnd.price || 0;
    const btcMetrics = summarizeBtcMetrics(btcTicker, btcCandles);
    const goldUnits = buildMetalUnits(gold.price, usdToVnd);
    const silverUnits = buildMetalUnits(silver.price, usdToVnd);
    const globalPoint = latestMetricPoint(globalLongShort);
    const topAccountPoint = latestMetricPoint(topAccountLongShort);
    const takerPoint = latestMetricPoint(takerVolume);
    const warnings = [
      getSettledReason(globalLongShortResult, 'Binance global long/short'),
      getSettledReason(topAccountLongShortResult, 'Binance top-account long/short'),
      getSettledReason(takerVolumeResult, 'Binance taker buy/sell'),
      getSettledReason(topOiMarketCapCoinsResult, 'OI / Market Cap ranking'),
    ].filter(Boolean);

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.status(200).json({
      updatedAt: new Date().toISOString(),
      warnings,
      sources: {
        btc: 'coinbase-exchange',
        metals: 'yahoo-finance',
        derivatives: 'binance-futures',
        oiRanking: 'binance-futures-and-coingecko',
      },
      usdToVnd,
      topOiMarketCapCoins,
      assets: [
        {
          key: 'btc',
          label: 'Bitcoin',
          symbol: 'BTC/USD',
          usd: btcTicker.price,
          vnd: btcTicker.price * usdToVnd,
          bid: btcTicker.bid,
          ask: btcTicker.ask,
          volume24h: btcTicker.volume24h,
          changePercent: btcMetrics.priceChange4h,
          series: btcMetrics.chartSeries,
          metrics: {
            priceChange4h: btcMetrics.priceChange4h,
            volumeChange4h: btcMetrics.volumeChange4h,
            volume4h: btcMetrics.recentVolume4h,
            globalLongShortAccountRatio: globalPoint
              ? {
                  ratio: Number(globalPoint.longShortRatio ?? 0),
                  longAccount: Number(globalPoint.longAccount ?? 0),
                  shortAccount: Number(globalPoint.shortAccount ?? 0),
                }
              : null,
            topLongShortAccountRatio: topAccountPoint
              ? {
                  ratio: Number(topAccountPoint.longShortRatio ?? 0),
                  longAccount: Number(topAccountPoint.longAccount ?? 0),
                  shortAccount: Number(topAccountPoint.shortAccount ?? 0),
                }
              : null,
            takerBuySellRatio4h: takerPoint
              ? {
                  ratio: Number(takerPoint.buySellRatio ?? 0),
                  buyVolume: Number(takerPoint.buyVol ?? 0),
                  sellVolume: Number(takerPoint.sellVol ?? 0),
                }
              : null,
          },
        },
        {
          key: 'gold',
          label: 'Vàng',
          symbol: 'XAU/USD',
          usd: gold.price,
          vnd: gold.price * usdToVnd,
          changePercent: percent(gold.price, gold.previousClose),
          series: gold.series,
          metrics: goldUnits,
        },
        {
          key: 'silver',
          label: 'Bạc',
          symbol: 'XAG/USD',
          usd: silver.price,
          vnd: silver.price * usdToVnd,
          changePercent: percent(silver.price, silver.previousClose),
          series: silver.series,
          metrics: silverUnits,
        },
      ],
    });
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Unknown market data error',
    });
  }
}
