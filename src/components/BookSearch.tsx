import { useState } from 'react';

export default function BookSearch({ onAddBook }: { onAddBook: (book: any) => void }) {
  const [query, setQuery] = useState('');

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Procure por livros..."
      />
      <button onClick={() => onAddBook({ title: query })}>
        Adicionar
      </button>
    </div>
  );
}