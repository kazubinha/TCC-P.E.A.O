import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/api/status', (req, res) => {
  res.json({
    mensagem: 'API funcionando!'
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});