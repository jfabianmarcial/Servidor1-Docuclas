const SERVERS = [
    import.meta.env.VITE_SERVER_1,
    import.meta.env.VITE_SERVER_2,
    import.meta.env.VITE_SERVER_3,
].filter(Boolean);

let currentIndex = 0;

async function isServerAvailable(url: string): Promise<boolean> {
    try {
        // Usamos mode: 'no-cors' para evitar que el navegador bloquee la validación si Render responde con un 503 genérico
        await fetch(`${url}/health`, {
            method: 'GET',
            mode: 'no-cors',
            signal: AbortSignal.timeout(2000), // 2 segundos es suficiente para un ping
        });
        return true;
    } catch {
        return false;
    }
}

export async function getAvailableServer(): Promise<string> {
    const total = SERVERS.length;

    for (let i = 0; i < total; i++) {
        const index = currentIndex % total;
        const server = SERVERS[index];

        // Avanzamos el puntero para la siguiente ronda preventivamente
        currentIndex = (index + 1) % total;

        const available = await isServerAvailable(server);
        if (available) {
            console.log(`Round Robin → Servidor elegido [${index + 1}]: ${server}`);
            return server;
        } else {
            console.warn(`Servidor [${index + 1}] (${server}) no disponible, saltando...`);
        }
    }

    console.error('Todos los servidores caídos, usando servidor 1 por defecto');
    return SERVERS[0];
}

/**
 * Función utilitaria para envolver llamadas gRPC. 
 * Si la llamada física falla (p.ej. caída repentina), intenta con otro servidor automáticamente.
 */
export async function executeGrpc<T>(operation: (baseUrl: string) => Promise<T>, retries = SERVERS.length): Promise<T> {
    const baseUrl = await getAvailableServer();
    try {
        return await operation(baseUrl);
    } catch (error) {
        console.error(`Error de red o CORS ejecutando en ${baseUrl}:`, error);
        if (retries > 1) {
            console.log(`Reintentando operación en el siguiente servidor disponible...`);
            return await executeGrpc(operation, retries - 1);
        }
        throw error;
    }
}