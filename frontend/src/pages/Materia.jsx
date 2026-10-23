import Pagina from '../components/Pagina.jsx'
import { Adicionar, NaoEncontrado } from '../components/Comuns.jsx'
import { Link, ir } from '../lib/rotas.jsx'
import { useDados } from '../lib/dados.jsx'

// Figura 12: Página de matéria (murais)
export default function Materia({ id }) {
  const { d, add, remover } = useDados()
  const materia = d.materias.find((m) => m.id === id)
  if (!materia) return <NaoEncontrado />
  const murais = d.murais.filter((m) => m.materiaId === id)
  return (
    <Pagina titulo={materia.nome} trilha={materia.nome} voltar="/">
      <div className="grade">
        {murais.map((m) => (
          <article className="mini-cartao" key={m.id}>
            <h3>{m.nome}</h3>
            <p>{m.descricao || 'Sem descrição.'}</p>
            <div className="mini-cartao__acoes">
              <Link para={`/materia/${id}/mural/${m.id}`} className="seta" aria-label={`Abrir ${m.nome}`}>▾</Link>
              <button type="button" className="btn-x" aria-label={`Excluir ${m.nome}`}
                onClick={() => window.confirm(`Excluir o mural "${m.nome}"?`) && remover('murais', m.id)}>×</button>
            </div>
          </article>
        ))}
      </div>
      <div className="lista">
        <Adicionar rotulo="Adicionar Mural" placeholder="Nome do mural"
          onAdd={(nome) => ir(`/materia/${id}/mural/${add('murais', { materiaId: id, nome, descricao: '', texto: '', notas: '', anexo: null })}`)} />
      </div>
    </Pagina>
  )
}
