import api from './api';

const RETRYABLE_STATUSES = new Set([502, 503, 504]);
const BOOTSTRAP_WINDOW_MS = 180000;
const BOOTSTRAP_RETRY_MS = 3000;
const BOOTSTRAP_REQUEST_TIMEOUT_MS = 10000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let bootstrapPromise = null;

const runBootstrap = async () => {
    const deadline = Date.now() + BOOTSTRAP_WINDOW_MS;
    let lastPayload = null;

    while (Date.now() < deadline) {
        try {
            const response = await api.get('/api/system/bootstrap', {
                timeout: BOOTSTRAP_REQUEST_TIMEOUT_MS,
                validateStatus: (status) => status === 200 || status === 503,
            });

            lastPayload = response.data;
            if (response.status === 200 && response.data?.status === 'ready') {
                return response.data;
            }
        } catch (error) {
            const status = error.response?.status;
            if (status && !RETRYABLE_STATUSES.has(status)) {
                throw error;
            }
        }

        await sleep(BOOTSTRAP_RETRY_MS);
    }

    const unavailable = Object.entries(lastPayload?.dependencies || {})
        .filter(([, ready]) => !ready)
        .map(([name]) => name);

    const suffix = unavailable.length
        ? ` Services indisponibles : ${unavailable.join(', ')}.`
        : '';

    throw new Error(`TKB Shop n'a pas pu terminer son demarrage.${suffix}`);
};

export const ensureServicesReady = () => {
    if (!bootstrapPromise) {
        bootstrapPromise = runBootstrap().catch((error) => {
            bootstrapPromise = null;
            throw error;
        });
    }
    return bootstrapPromise;
};
