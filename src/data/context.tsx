import { createContext, useContext } from 'react';
import { Repository } from './repository';
export const RepositoryContext = createContext<Repository | null>(null);
export function useRepository(): Repository {
  const repository = useContext(RepositoryContext);
  if (!repository) throw new Error('Database is not ready.');
  return repository;
}
