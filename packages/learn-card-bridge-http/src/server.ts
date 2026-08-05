import app from './app';

const port = Number(process.env.PORT ?? 3100);

const server = app.listen(port, '127.0.0.1', () => {
    console.log(`LearnCard VC API listening at http://127.0.0.1:${port}`);
});

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
