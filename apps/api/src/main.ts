import express from 'express';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3333;

const app = express();

app.use(express.json());

const api = express.Router();

api.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', api);

app.listen(port, host, () => {
  console.log(`api listening on http://${host}:${port}`);
});
