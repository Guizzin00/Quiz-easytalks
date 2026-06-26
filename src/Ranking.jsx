import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import './Ranking.css'; // Importando o novo estilo premium

function Ranking() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();

    const subscription = supabase
      .channel('quiz_results_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_results' }, () => {
        fetchResults();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_results')
        .select('*')
        .order('score', { ascending: false })
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Filtra localmente para não quebrar caso a coluna 'hidden' ainda não exista no Supabase
      const visibleResults = (data || []).filter(item => item.hidden !== true);
      setResults(visibleResults);
    } catch (error) {
      console.error("Erro ao buscar resultados:", error);
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para definir a classe de pódio (rank-1, rank-2, rank-3)
  const getRankClass = (index) => {
    if (index === 0) return 'rank-1';
    if (index === 1) return 'rank-2';
    if (index === 2) return 'rank-3';
    return '';
  };

  // Função auxiliar para exibir ícone no pódio
  const getRankIcon = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div className="ranking-page-container">
      <div className="ranking-header">
        <h1 className="ranking-title">Ranking Geral</h1>
        <p className="ranking-subtitle">Top pontuações do EasyTalks em tempo real</p>
      </div>
      
      {loading ? (
        <div className="loading-text">Carregando dados ao vivo...</div>
      ) : results.length === 0 ? (
        <div className="empty-state">O pódio está vazio. Seja o primeiro a jogar!</div>
      ) : (
        <div className="ranking-list">
          {results.map((item, index) => (
            <div key={item.id} className={`ranking-card ${getRankClass(index)}`}>
              <div className="card-left">
                <div className="rank-number">
                  {getRankIcon(index)}
                </div>
                <div className="player-info">
                  <h3 className="player-name">{item.name}</h3>
                  <span className="player-date">
                    {new Date(item.created_at).toLocaleString('pt-BR', {
                      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
              <div className="card-right">
                <div className="score-badge">
                  {item.score} pts
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Ranking;
