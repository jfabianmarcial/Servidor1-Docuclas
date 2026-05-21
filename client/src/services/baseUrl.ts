const SERVERS = [
    import.meta.env.VITE_SERVER_1,
    import.meta.env.VITE_SERVER_2,
    import.meta.env.VITE_SERVER_3,
].filter(Boolean);

// Guarda qué servidores están marcados como "caídos" y cuándo falló
const serverFailures: Map<string, number> = new Map();
const COOLDOWN_MS = 30_000; // 30s antes de reintentar un servidor caído

let currentIndex = 0;

function isServerBlacklisted(url: string): boolean {
    const failedAt = serverFailures.get(url);
    if (!failedAt) return false;
    // Si ya pasó el cooldown, lo rehabilitamos
    if (Date.now() - failedAt > COOLDOWN_MS) {
        serverFailures.delete(url);
        return false;
    }
    return true;
}

function markServerAsFailed(url: string) {
    console.warn(`Marcando servidor como caído: ${url}`);
    serverFailures.set(url, Date.now());
}

/**
 * Devuelve el siguiente servidor que no esté en cooldown.
 * Si todos están en cooldown, devuelve el primero de todas formas.
 */
export function getNextServer(): string {
    const total = SERVERS.length;

    for (let i = 0; i < total; i++) {
        const index = (currentIndex + i) % total;
        const server = SERVERS[index];

        if (!isServerBlacklisted(server)) {
            currentIndex = (index + 1) % total; // avanza para la próxima ronda
            console.log(`Round Robin → Servidor elegido [${index + 1}]: ${server}`);
            return server;
        }
    }

    // Todos caídos: reseteamos y usamos el primero
    console.error('Todos los servidores en cooldown, forzando servidor 1');
    serverFailures.clear();
    currentIndex = 1;
    return SERVERS[0];
}

/**
 * Envuelve llamadas gRPC con reintentos automáticos.
 * Si falla, marca el servidor como caído y prueba el siguiente.
 */
export async function executeGrpc<T>(
    operation: (baseUrl: string) => Promise<T>,
    retries = SERVERS.length
): Promise<T> {
    const baseUrl = getNextServer(); // síncrono, sin health check previo

    try {
        return await operation(baseUrl);
    } catch (error) {
        console.error(`Fallo en ${baseUrl}:`, error);
        markServerAsFailed(baseUrl); // lo ponemos en cooldown

        if (retries > 1) {
            console.log(`Reintentando con otro servidor... (${retries - 1} intentos restantes)`);
            return executeGrpc(operation, retries - 1);
        }

        throw error;
    }
}