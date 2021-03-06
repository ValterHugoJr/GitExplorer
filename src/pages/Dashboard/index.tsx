import React, { useState, FormEvent, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight, FiTrash } from 'react-icons/fi';
import { DebounceInput } from 'react-debounce-input';

import { Title, Form, Repositories, Error } from './styles';

import api from '../../services/api';

import logo from '../../assets/logo.svg';

interface Repository {
  id: string;
  name: string;
  html_url: string;
  full_name: string;
  description: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

interface AllRepositories {
  name: string;
  id: string;
}

const Dashboard: React.FC = () => {
  const [authorInput, setAuthorInput] = useState('');
  const [repositoryInput, setRepositoryInput] = useState('select');
  const [allRepo, setAllRepo] = useState<AllRepositories[]>([]);
  const [inputError, setInputError] = useState('');
  const [repositories, setRepositories] = useState<Repository[]>(() => {
    const storageRepositories = localStorage.getItem(
      '@GithubExplorer:repositories',
    );

    if (storageRepositories) {
      return JSON.parse(storageRepositories);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(
      '@GithubExplorer:repositories',
      JSON.stringify(repositories),
    );

    if (authorInput) {
      api
        .get<AllRepositories[]>(`/users/${authorInput}/repos?per_page=100 `)
        .then((res) => {
          const response = res.data;

          setAllRepo(response);
        });
    }
  }, [authorInput, repositories]);

  async function handleAddRepository(
    e: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    e.preventDefault();

    if (!authorInput || repositoryInput === 'select') {
      setInputError('Digite o usuário e selecione o repositório');
      return;
    }

    const existRepository = repositories.find(
      (repository) => repository.name === repositoryInput,
    );

    if (existRepository) {
      setInputError('Repositório ja Cadastrado');
      return;
    }

    try {
      const response = await api.get<Repository>(
        `/repos/${authorInput}/${repositoryInput}`,
      );

      const repository = response.data;

      setRepositories([repository, ...repositories]);

      setAuthorInput('');

      setRepositoryInput('select');

      setAllRepo([]);

      setInputError('');
    } catch (err) {
      setInputError('Erro na busca por esse repositório');
    }
  }

  function deleteRepository(id: string): void {
    const repository = repositories.findIndex((repo) => repo.id === id);

    if (repository >= 0) {
      repositories.splice(repository, 1);

      localStorage.setItem(
        '@GithubExplorer:repositories',
        JSON.stringify(repositories),
      );

      setRepositories(repositories.filter((repo) => repo.id !== id));
    }
  }
  return (
    <>
      <img src={logo} alt="Github Explorer" />

      <Title>Explore repositórios no Github</Title>
      <Form hasError={!!inputError} onSubmit={handleAddRepository}>
        <DebounceInput
          minLength={2}
          debounceTimeout={500}
          placeholder="Nome do usuário"
          value={authorInput}
          onChange={(e) => setAuthorInput(e.target.value.split(' ').join(''))}
        />
        <select
          onChange={(e) => setRepositoryInput(e.target.value)}
          value={repositoryInput}
        >
          <option value="select">Nome do repositório</option>
          {allRepo.map((repo) => (
            <option key={repo.id} value={repo.name}>
              {repo.name}
            </option>
          ))}
        </select>
        <button type="submit">Pesquisar</button>
      </Form>
      {inputError && <Error>{inputError}</Error>}
      <Repositories>
        {repositories.map((repository) => (
          <span key={repository.id}>
            <img
              src={repository.owner.avatar_url}
              alt={repository.owner.login}
            />
            <div>
              <strong>{repository.full_name}</strong>
              <p>
                {!repository.description
                  ? 'Repository without description'
                  : repository.description}
              </p>
            </div>
            <Link to={`/repository/${repository.full_name}`}>
              <FiChevronRight className="chevronIcon" size={28} type="button" />
            </Link>
            <FiTrash
              className="trashIcon"
              onClick={() => deleteRepository(repository.id)}
              type="button"
              size={22}
              color="#c53030"
            />
          </span>
        ))}
      </Repositories>
    </>
  );
};

export default Dashboard;
