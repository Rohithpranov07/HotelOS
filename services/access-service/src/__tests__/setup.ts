process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://test@localhost:5432/test';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.JWT_PUBLIC_KEY_PATH ??= '../auth-service/secrets/jwt-public.pem';
process.env.KEY_PROVIDER ??= 'mock';
process.env.WORKER_ENABLED ??= 'false';
