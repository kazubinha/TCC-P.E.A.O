-- Banco do P.E.A.O (MySQL 8+ / InnoDB / utf8mb4)
-- Parte da modelagem original (modelagem_mysql.sql). Mudancas principais:
--  * tabelas passam a usar ids numericos (antes materia, periodo e quadro usavam o nome como chave);
--  * usuario ganha senha_hash e papel (usuario ou administrador);
--  * imagem virou arquivo (guarda imagens, PDFs e audios enviados);
--  * novas tabelas: nota (boletim), aviso, conversa, conversa_membro e mensagem;
--  * periodo foi removido: o mural (quadro) fica direto dentro da materia.

CREATE DATABASE IF NOT EXISTS peao
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE peao;

CREATE TABLE IF NOT EXISTS usuario (
  email VARCHAR(254) NOT NULL PRIMARY KEY,
  nome_usuario VARCHAR(150) NOT NULL,
  numero_telefone VARCHAR(20),
  senha_hash VARCHAR(255) NOT NULL,
  papel VARCHAR(15) NOT NULL DEFAULT 'usuario',
  criado_em DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS arquivo (
  link VARCHAR(500) NOT NULL PRIMARY KEY,
  nome_arquivo VARCHAR(255) NOT NULL,
  tipo VARCHAR(10) NOT NULL,
  usuario_email VARCHAR(254) NOT NULL,
  FOREIGN KEY (usuario_email) REFERENCES usuario(email)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ano_escolar (
  ano_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  usuario_email VARCHAR(254) NOT NULL,
  nome_ano VARCHAR(100) NOT NULL,
  FOREIGN KEY (usuario_email) REFERENCES usuario(email)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS materia (
  materia_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ano_id INT NOT NULL,
  nome_materia VARCHAR(150) NOT NULL,
  FOREIGN KEY (ano_id) REFERENCES ano_escolar(ano_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS quadro (
  quadro_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  materia_id INT NOT NULL,
  nome_quadro VARCHAR(150) NOT NULL,
  descricao MEDIUMTEXT,
  texto MEDIUMTEXT,
  anotacao MEDIUMTEXT,
  imagem_link VARCHAR(500),
  FOREIGN KEY (materia_id) REFERENCES materia(materia_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (imagem_link) REFERENCES arquivo(link)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS nota (
  nota_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  materia_id INT NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  nota_maxima DECIMAL(5,2) NOT NULL,
  resultado DECIMAL(5,2) NOT NULL,
  trimestre TINYINT NOT NULL,
  FOREIGN KEY (materia_id) REFERENCES materia(materia_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS agenda (
  agenda_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  usuario_email VARCHAR(254) NOT NULL,
  dia DATE NOT NULL,
  texto VARCHAR(500) NOT NULL,
  FOREIGN KEY (usuario_email) REFERENCES usuario(email)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS professores (
  professor_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  usuario_email VARCHAR(254) NOT NULL, -- administrador que cadastrou o cartao
  nome VARCHAR(150) NOT NULL,
  materia VARCHAR(150),
  horarios TEXT,
  sala VARCHAR(150),
  contato VARCHAR(255),
  FOREIGN KEY (usuario_email) REFERENCES usuario(email)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS aviso (
  aviso_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  usuario_email VARCHAR(254) NOT NULL,
  texto VARCHAR(300) NOT NULL,
  criado_em DATETIME NOT NULL,
  FOREIGN KEY (usuario_email) REFERENCES usuario(email)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS conversa (
  conversa_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150),
  grupo TINYINT NOT NULL DEFAULT 0,
  criado_em DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS conversa_membro (
  conversa_id INT NOT NULL,
  usuario_email VARCHAR(254) NOT NULL,
  PRIMARY KEY (conversa_id, usuario_email),
  FOREIGN KEY (conversa_id) REFERENCES conversa(conversa_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (usuario_email) REFERENCES usuario(email)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS mensagem (
  mensagem_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  conversa_id INT NOT NULL,
  autor_email VARCHAR(254) NOT NULL,
  texto TEXT,
  anexo_link VARCHAR(500),
  criado_em DATETIME NOT NULL,
  FOREIGN KEY (conversa_id) REFERENCES conversa(conversa_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (autor_email) REFERENCES usuario(email)
    ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (anexo_link) REFERENCES arquivo(link)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- Turmas, frequencia, material das aulas e compartilhamento de murais
CREATE TABLE IF NOT EXISTS turma (
  turma_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS turma_membro (
  turma_id INT NOT NULL,
  usuario_email VARCHAR(254) NOT NULL,
  PRIMARY KEY (turma_id, usuario_email),
  FOREIGN KEY (turma_id) REFERENCES turma(turma_id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_email) REFERENCES usuario(email) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS frequencia (
  turma_id INT NOT NULL,
  usuario_email VARCHAR(254) NOT NULL,
  dia DATE NOT NULL,
  presente TINYINT NOT NULL,
  PRIMARY KEY (turma_id, usuario_email, dia),
  FOREIGN KEY (turma_id, usuario_email) REFERENCES turma_membro(turma_id, usuario_email)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS material (
  material_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  turma_id INT NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  descricao VARCHAR(500),
  arquivo_link VARCHAR(500) NOT NULL,
  criado_em DATETIME NOT NULL,
  FOREIGN KEY (turma_id) REFERENCES turma(turma_id) ON DELETE CASCADE,
  FOREIGN KEY (arquivo_link) REFERENCES arquivo(link) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS compartilhamento (
  quadro_id INT NOT NULL,
  usuario_email VARCHAR(254) NOT NULL,
  PRIMARY KEY (quadro_id, usuario_email),
  FOREIGN KEY (quadro_id) REFERENCES quadro(quadro_id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_email) REFERENCES usuario(email) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;
