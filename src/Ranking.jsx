import { useEffect, useState } from 'react';
import { supabase } from './supabase';

function Ranking() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_results')
        .select('*')
        .order('score', { ascending: false })
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error("Erro ao buscar resultados:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container admin-screen">
      <div className="admin-header">
        <h1 className="title-logo" style={{ fontSize: '2.5rem', marginBottom: 0 }}>Ranking Geral</h1>
      </div>
      
      <div className="admin-table-container">
        {loading ? (
          <p>Carregando ranking...</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Posição</th>
                <th>Nome</th>
                <th>Pontuação</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center' }}>Nenhum resultado ainda.</td>
                </tr>
              ) : (
                results.map((item, index) => (
                  <tr key={item.id}>
                    <td>#{index + 1}</td>
                    <td>{item.name}</td>
                    <td><strong>{item.score}</strong></td>
                    <td>{new Date(item.created_at).toLocaleString('pt-BR')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Ranking;
