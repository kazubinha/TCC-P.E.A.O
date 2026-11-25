import Logo from './Logo.jsx'

const COLUNAS = [
  { titulo: 'Informações Gerais', links: ['Sobre o projeto', 'Como funciona', 'Perguntas frequentes', 'Termos de uso'] },
  { titulo: 'Contato', links: ['Fale conosco', 'Suporte', 'Redes sociais', 'Trabalhe conosco'] },
]

export default function Rodape() {
  return (
    <footer className="rodape">
      {COLUNAS.map(({ titulo, links }) => (
        <section key={titulo} className="rodape__coluna">
          <h2>{titulo}</h2>
          <ul>
            {links.map((texto, i) => (
              <li key={i}>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  {texto}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <Logo className="rodape__logo" />
    </footer>
  )
}
