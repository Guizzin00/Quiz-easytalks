import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Link } from 'react-router-dom';

function Admin() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

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

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja liberar este jogador para refazer o quiz?")) return;
    
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('quiz_results')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setResults(results.filter(item => item.id !== id));
    } catch (error) {
      console.error("Erro ao deletar resultado:", error);
      alert("Erro ao excluir. Verifique se você aplicou a permissão DELETE no Supabase.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="app-container admin-screen">
      <div className="admin-header">
        <h1 className="title-logo" style={{ fontSize: '2.5rem', marginBottom: 0 }}>Painel Admin</h1>
        <Link to="/" className="back-btn">← Voltar ao Quiz</Link>
      </div>
      
      <div className="admin-table-container">
        {loading ? (
          <p>Carregando resultados...</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Posição</th>
                <th>Nome</th>
                <th>Pontuação</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>Nenhum resultado ainda.</td>
                </tr>
              ) : (
                results.map((item, index) => (
                  <tr key={item.id}>
                    <td>#{index + 1}</td>
                    <td>{item.name}</td>
                    <td><strong>{item.score}</strong></td>
                    <td>{new Date(item.created_at).toLocaleString('pt-BR')}</td>
                    <td>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        style={{
                          background: '#E21B3C',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          opacity: deletingId === item.id ? 0.5 : 1
                        }}
                      >
                        {deletingId === item.id ? "Excluindo..." : "Liberar"}
                      </button>
                    </td>
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

export default Admin;
