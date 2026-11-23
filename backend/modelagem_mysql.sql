-- Modelo relacional convertido da imagem fornecida
-- MySQL 8.0+ / InnoDB / utf8mb4
-- Observacoes:
-- 1) Tipos "texto" foram convertidos para VARCHAR/TEXT conforme o uso.
-- 2) "nome: timestamp" em professores parece ser um erro de anotacao no diagrama;
--    foi convertido para VARCHAR(150), pois nome normalmente e texto.
-- 3) Os relacionamentos foram inferidos pelas linhas do diagrama. Revise-os
--    antes de usar em producao, especialmente periodo <-> materia e agenda.

CREATE DATABASE IF NOT EXISTS peao
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE peao;

CREATE TABLE usuario (
  email VARCHAR(254) NOT NULL,
  nome_usuario VARCHAR(150) NOT NULL,
  numero_telefone VARCHAR(8),
  PRIMARY KEY (email)
) ENGINE=InnoDB;

CREATE TABLE imagem (
  link VARCHAR(500) NOT NULL,
  nome_imagem VARCHAR(255) NOT NULL,
  usuario_email VARCHAR(254) NOT NULL,
  PRIMARY KEY (link),
  CONSTRAINT fk_imagem_usuario
    FOREIGN KEY (usuario_email) REFERENCES usuario(email)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE professores (
  professor_id INT NOT NULL AUTO_INCREMENT,
  usuario_email VARCHAR(254) NOT NULL,
  nome VARCHAR(150) NOT NULL,
  descricao TEXT,
  PRIMARY KEY (professor_id),
  CONSTRAINT fk_professores_usuario
    FOREIGN KEY (usuario_email) REFERENCES usuario(email)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE agenda (
  agenda_id BIGINT NOT NULL AUTO_INCREMENT,
  usuario_email VARCHAR(254) NOT NULL,
  marcacao INT,
  PRIMARY KEY (agenda_id),
  CONSTRAINT fk_agenda_usuario
    FOREIGN KEY (usuario_email) REFERENCES usuario(email)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE ano_escolar (
  ano_id INT NOT NULL AUTO_INCREMENT,
  usuario_email VARCHAR(254) NOT NULL,
  nome_ano VARCHAR(100) NOT NULL,
  ano DATETIME,
  materia_nome VARCHAR(150),
  PRIMARY KEY (ano_id),
  CONSTRAINT fk_ano_escolar_usuario
    FOREIGN KEY (usuario_email) REFERENCES usuario(email)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE materia (
  nome_materia VARCHAR(150) NOT NULL,
  periodo_nome VARCHAR(150),
  ano_id INT,
  PRIMARY KEY (nome_materia),
  CONSTRAINT fk_materia_ano_escolar
    FOREIGN KEY (ano_id) REFERENCES ano_escolar(ano_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE periodo (
  nome_periodo VARCHAR(150) NOT NULL,
  materia_nome VARCHAR(150),
  quadro_codigo VARCHAR(100),
  PRIMARY KEY (nome_periodo),
  CONSTRAINT fk_periodo_materia
    FOREIGN KEY (materia_nome) REFERENCES materia(nome_materia)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE quadro (
  codigo VARCHAR(100) NOT NULL,
  nome_quadro VARCHAR(150) NOT NULL,
  anotacao TEXT,
  imagem_link VARCHAR(500),
  usuario_email VARCHAR(254) NOT NULL,
  periodo_nome VARCHAR(150),
  PRIMARY KEY (codigo),
  CONSTRAINT fk_quadro_imagem
    FOREIGN KEY (imagem_link) REFERENCES imagem(link)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_quadro_usuario
    FOREIGN KEY (usuario_email) REFERENCES usuario(email)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_quadro_periodo
    FOREIGN KEY (periodo_nome) REFERENCES periodo(nome_periodo)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- Relacionamentos que dependem de tabelas criadas posteriormente.
ALTER TABLE materia
  ADD CONSTRAINT fk_materia_periodo
  FOREIGN KEY (periodo_nome) REFERENCES periodo(nome_periodo)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ano_escolar
  ADD CONSTRAINT fk_ano_escolar_materia
  FOREIGN KEY (materia_nome) REFERENCES materia(nome_materia)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE periodo
  ADD CONSTRAINT fk_periodo_quadro
  FOREIGN KEY (quadro_codigo) REFERENCES quadro(codigo)
  ON UPDATE CASCADE ON DELETE SET NULL;

-- Observacao sobre agenda.marcacao:
-- O diagrama nao deixa claro se esse campo referencia marcacao_agenda.
-- Para manter a criacao executavel e evitar uma relacao presumida incorreta,
-- ele foi mantido como inteiro sem chave estrangeira. Se for uma FK para
-- marcacao_agenda.marcacao_id, podemos adiciona-la depois.
