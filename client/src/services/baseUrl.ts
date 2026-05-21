const SERVERS = [
    'https://servidor1-docuclas.onrender.com',
    'https://servidor2-docuclas-1.onrender.com',
    'https://servidor3-docuclas.onrender.com',
];

let currentIndex = 0;

export function getNextServer(): string {
    const server = SERVERS[currentIndex];
    currentIndex = (currentIndex + 1) % SERVERS.length;
    console.log(`Round Robin → Servidor ${currentIndex}: ${server}`);
    return server;
}

export async function getAvailableServer(): Promise<string> {
    return getNextServer();
}