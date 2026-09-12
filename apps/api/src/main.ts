import express from 'express';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3333;

const app = express();

app.use(express.json());

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, host, () => {
  console.log(`api listening on http://${host}:${port}`);
});
