import Pagina from '../components/Pagina.jsx'
import { Adicionar } from '../components/Comuns.jsx'
import { Link } from '../lib/rotas.jsx'
import { useDados } from '../lib/dados.jsx'

// Figura 11: Homepage (matérias do ano escolar)
export default function Home() {
  const { d, add, removerMateria } = useDados()
  const materias = d.materias.filter((m) => m.anoId === d.anoId)
  return (
    <Pagina>
      <div className="lista">
        {materias.map((m) => (
          <div className="linha-item" key={m.id}>
            <Link para={`/materia/${m.id}`} className="cartao"><span>{m.nome}</span></Link>
            <button type="button" className="btn-x" aria-label={`Excluir ${m.nome}`}
              onClick={() => window.confirm(`Excluir "${m.nome}" e tudo que há nela?`) && removerMateria(m.id)}>×</button>
          </div>
        ))}
        <Adicionar rotulo="Adicionar Matéria" placeholder="Nome da matéria" onAdd={(nome) => add('materias', { anoId: d.anoId, nome })} />
      </div>
    </Pagina>
  )
}
