const arcjet = require('@arcjet/node');
const { shield, detectBot, slidingWindow } = require('@arcjet/node');

const arcjetKey = process.env.ARCJET_KEY;
const arcjetMode = process.env.ARCJET_MODE === 'DRY_RUN' ? 'DRY_RUN' : 'LIVE';

// Optional: warn once if ARCJET_KEY is missing so operators know protections are disabled.
if (!arcjetKey) {
  console.warn('[Arcjet] ARCJET_KEY is not set. HTTP and WebSocket protections are disabled.');
}

// Do not throw if ARCJET_KEY is missing; allow optional protection with null-guards.
const httpArcjet = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        shield({ mode: arcjetMode }),
        detectBot({ mode: arcjetMode, allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW'] }),
        slidingWindow({ mode: arcjetMode, interval: '10s', max: 50 }),
      ],
    })
  : null;

const wsArcjet = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        shield({ mode: arcjetMode }),
        detectBot({ mode: arcjetMode, allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW'] }),
        slidingWindow({ mode: arcjetMode, interval: '2s', max: 5 }),
      ],
    })
  : null;

function securityMiddleware() {
  return async (req, res, next) => {
    if (!httpArcjet) return next();

    try {
      const decision = await httpArcjet.protect(req);
      if (decision.isDenied()) {
        if (decision.reason.isRateLimit()) {
          return res.status(429).json({ error: 'Too many requests' });
        }
        return res.status(403).json({ error: 'Forbidden' });
      }
    } catch (e) {
      console.error('Arcjet middleware error', e);
      return res.status(503).json({ error: 'Internal server error' });
    }

    next();
  };
}

module.exports = {
  httpArcjet,
  wsArcjet,
  securityMiddleware,
};