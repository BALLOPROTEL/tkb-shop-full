const STAGING_WAKE_URLS = {
    auth: 'https://tkb-auth-staging-6dt7.onrender.com/ready',
    catalog: 'https://tkb-catalog-staging-6dt7.onrender.com/ready',
    orders: 'https://tkb-orders-staging-6dt7.onrender.com/ready',
    payments: 'https://tkb-payments-staging-6dt7.onrender.com/ready',
    backoffice: 'https://tkb-backoffice-staging-6dt7.onrender.com/ready',
    notifications: 'https://tkb-notifications-staging-6dt7.onrender.com/ready',
};

const WAKE_COOLDOWN_MS = 2 * 60 * 1000;
const WAKE_TIMEOUT_MS = 8000;
const lastWakeAt = new Map();
const inFlightWake = new Map();

const isHostedStaging = (apiBaseUrl) =>
    typeof apiBaseUrl === 'string' &&
    apiBaseUrl.includes('tkb-gateway-staging-6dt7.onrender.com');

const apiPath = (rawUrl = '') => {
    try {
        return new URL(rawUrl, window.location.origin).pathname.replace(/^\/api\//, '');
    } catch {
        return String(rawUrl).replace(/^\/?api\//, '');
    }
};

const servicesForPath = (rawUrl) => {
    const path = apiPath(rawUrl);
    const services = new Set();

    if (path === 'products' || path.startsWith('products/')) {
        services.add('catalog');
    }

    if (
        path.startsWith('auth/') ||
        path === 'users/me' ||
        path.startsWith('users/me/') ||
        path === 'admin/invites' ||
        path.startsWith('admin/invites/') ||
        path === 'admin/users' ||
        path.startsWith('admin/users/')
    ) {
        services.add('auth');
    }

    if (
        path === 'orders' ||
        path.startsWith('orders/') ||
        path === 'admin/orders' ||
        path.startsWith('admin/orders/')
    ) {
        services.add('orders');
    }

    if (path === 'payments' || path.startsWith('payments/')) {
        services.add('payments');
        services.add('orders');
    }

    if (
        path === 'settings' ||
        path === 'newsletter' ||
        path === 'admin/newsletter'
    ) {
        services.add('backoffice');
    }

    if (path === 'admin/stats') {
        services.add('backoffice');
        services.add('auth');
        services.add('catalog');
        services.add('orders');
    }

    if (
        path === 'auth/register' ||
        path === 'auth/forgot-password' ||
        path === 'auth/reset-password' ||
        path === 'admin/invites'
    ) {
        services.add('notifications');
    }

    return [...services];
};

const wakeService = async (serviceName) => {
    const wakeUrl = STAGING_WAKE_URLS[serviceName];
    if (!wakeUrl || typeof window === 'undefined') return;

    const now = Date.now();
    if (now - (lastWakeAt.get(serviceName) || 0) < WAKE_COOLDOWN_MS) return;

    if (inFlightWake.has(serviceName)) {
        await inFlightWake.get(serviceName);
        return;
    }

    const wakePromise = (async () => {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), WAKE_TIMEOUT_MS);

        try {
            await fetch(wakeUrl, {
                method: 'GET',
                mode: 'no-cors',
                cache: 'no-store',
                credentials: 'omit',
                referrerPolicy: 'no-referrer',
                signal: controller.signal,
            });
            lastWakeAt.set(serviceName, Date.now());
        } catch {
            // A timed-out/opaque wake request can still have reached Render.
            // Do not block the real API call; the gateway will wait for readiness.
        } finally {
            window.clearTimeout(timeout);
        }
    })();

    inFlightWake.set(serviceName, wakePromise);
    try {
        await wakePromise;
    } finally {
        inFlightWake.delete(serviceName);
    }
};

export const prewarmForApiRequest = async (rawUrl, apiBaseUrl) => {
    if (!isHostedStaging(apiBaseUrl) || typeof window === 'undefined') return;
    await Promise.allSettled(servicesForPath(rawUrl).map(wakeService));
};

export const resetWakeForApiRequest = (rawUrl, apiBaseUrl) => {
    if (!isHostedStaging(apiBaseUrl)) return;
    servicesForPath(rawUrl).forEach((serviceName) => {
        lastWakeAt.delete(serviceName);
    });
};
