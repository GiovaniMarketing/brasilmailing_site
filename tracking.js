window.BrasilMailingTracking = (() => {
  const config = {
    googleAdsId: "AW-11038901326",
    googleAnalyticsId: "G-4Y6PDMLR5E",
    whatsappConversion: "AW-11038901326/XA7TCLeC9-8cEM6I4Y8p",
    metaPixelId: "1066513032935979",
  };

  const recentEvents = new Map();

  function initializeMetaPixel() {
    if (!config.metaPixelId || typeof window.fbq === "function") return;

    const fbq = function () {
      fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
    };
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    window.fbq = fbq;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);

    fbq("init", config.metaPixelId);
    fbq("track", "PageView");
  }

  function isDuplicate(key, interval = 1800000) {
    const now = Date.now();
    const previous = recentEvents.get(key);
    if (previous && now - previous < interval) return true;
    recentEvents.set(key, now);
    return false;
  }

  function event(name, parameters = {}, metaEvent = null, options = {}) {
    const key = options.dedupeKey || `${name}:${parameters.lead_source || ""}`;
    if (options.dedupe && isDuplicate(key, options.dedupeInterval)) return false;

    if (typeof window.gtag === "function") {
      window.gtag("event", name, parameters);
    }

    if (metaEvent && typeof window.fbq === "function") {
      const method = metaEvent.custom ? "trackCustom" : "track";
      window.fbq(method, metaEvent.name, metaEvent.parameters || parameters);
    }
    return true;
  }

  function lead(source, callback) {
    const tracked = event(
      "generate_lead",
      { lead_source: source, currency: "BRL", value: 1 },
      { name: "Lead", parameters: { content_name: source, currency: "BRL", value: 1 } },
      { dedupe: true, dedupeKey: `lead:${source}` }
    );

    if (!tracked || typeof window.gtag !== "function") {
      callback?.();
      return;
    }

    window.gtag("event", "conversion", {
      send_to: config.whatsappConversion,
      value: 1,
      currency: "BRL",
      event_callback: callback,
    });
  }

  initializeMetaPixel();
  return { config, event, lead };
})();
