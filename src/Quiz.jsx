import { useState, useEffect } from 'react';
import { questions } from './questions';
import { supabase } from './supabase';

const SHAPES = ["▲", "◆", "●"];

function Quiz() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    checkIfCanPlay();
  }, []);

  const checkIfCanPlay = async () => {
    const savedScore = localStorage.getItem('quiz_score');
    const savedName = localStorage.getItem('quiz_name');
    const savedId = localStorage.getItem('quiz_id');
    
    // Se existe pontuação salva, vamos checar no banco se o Admin excluiu
    if (savedScore !== null) {
      try {
        let query = supabase.from('quiz_results').select('id');
        
        if (savedId) {
          query = query.eq('id', savedId);
        } else if (savedName) {
          query = query.eq('name', savedName);
        } else {
          // Se não tiver nome nem ID (jogado na versão antiga), não temos como checar o banco.
          // Libera logo o cara por garantia ou mantém bloqueado? Vamos manter, mas é raro.
        }

        if (savedId || savedName) {
          const { data, error } = await query.limit(1);
            
          if (error) throw error;
          
          // Se retornar vazio, significa que o Admin excluiu do painel!
          if (data && data.length === 0) {
            localStorage.removeItem('quiz_score');
            localStorage.removeItem('quiz_name');
            localStorage.removeItem('quiz_id');
            setCheckingStatus(false);
            return;
          }
        }
      } catch (err) {
        console.error("Erro ao verificar status no banco:", err);
        // Descomente o alert abaixo se quiser ver se o banco está dando erro
        // alert("Erro ao verificar o banco de dados. Veja o console (F12).");
      }

      // Se passou por tudo e não foi excluído (ou deu erro de rede), bloqueia
      setFinalScore(parseInt(savedScore, 10));
      setShowResult(true);
      setHasStarted(true);
      setAlreadyPlayed(true);
    }
    
    setCheckingStatus(false);
  };

  const handleAnswer = async (optionScore) => {
    const newAnswers = { ...answers, [currentQuestionIndex]: optionScore };
    setAnswers(newAnswers);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      const totalScore = Object.values(newAnswers).reduce((acc, curr) => acc + curr, 0);
      setFinalScore(totalScore);
      setShowResult(true);
      
      localStorage.setItem('quiz_score', totalScore);
      localStorage.setItem('quiz_name', playerName);
      
      await saveResult(totalScore);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const saveResult = async (scoreToSave) => {
    setIsSaving(true);
    try {
      // O .select() faz o supabase retornar a linha criada, com o ID exato!
      const { data, error } = await supabase
        .from('quiz_results')
        .insert([{ name: playerName, score: scoreToSave }])
        .select();
        
      if (error) throw error;

      if (data && data.length > 0) {
        localStorage.setItem('quiz_id', data[0].id);
      }
    } catch (error) {
      console.error("Erro ao salvar resultado:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="app-container start-screen">
        <h1 className="title-logo" style={{fontSize: '2rem'}}>Verificando status...</h1>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="app-container start-screen">
        <h1 className="title-logo">Quiz: Seu Perfil Profissional</h1>
        <p className="subtitle">Descubra como você interage com boas experiências e com sua equipe!</p>
        
        <div className="input-container">
          <input 
            type="text" 
            className="name-input" 
            placeholder="Digite seu nome..." 
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
          />
          <button 
            className="start-btn" 
            onClick={() => setHasStarted(true)}
            disabled={!playerName.trim()}
          >
            Iniciar Quiz
          </button>
        </div>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="app-container result-screen">
        <h1 className="result-title">Sua Pontuação</h1>
        <div className="result-card">
          {isSaving ? (
            <p className="result-message">Salvando seu resultado...</p>
          ) : (
            <p className="result-message" style={{fontSize: '5rem', margin: 0}}>{finalScore}</p>
          )}
        </div>
        
        {alreadyPlayed && !isSaving && (
          <p style={{ marginTop: '2rem', opacity: 0.8, fontSize: '1.2rem', fontWeight: 700 }}>
            Você já completou o quiz. Seus resultados foram salvos!
          </p>
        )}
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="app-container quiz-screen">
      <div className="quiz-header">
        <div className="question-counter">
          {currentQuestionIndex + 1} de {questions.length}
        </div>
        <div className="score-display">Jogador: {playerName}</div>
      </div>
      
      <div className="question-section">
        <h2 className="question-text">{currentQuestion.text}</h2>
      </div>

      <div className="options-grid">
        {currentQuestion.options.map((option, index) => (
          <button 
            key={index} 
            className="option-btn" 
            style={{ backgroundColor: option.color }}
            onClick={() => handleAnswer(option.score)}
          >
            <span className="option-shape">{SHAPES[index % SHAPES.length]}</span>
            <span className="option-text">{option.text}</span>
          </button>
        ))}
      </div>

      {currentQuestionIndex > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
          <button 
            onClick={handleBack}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.4)',
              padding: '1rem 2rem',
              color: 'white',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '1.2rem',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
          >
            ← Voltar para a pergunta anterior
          </button>
        </div>
      )}
    </div>
  );
}

export default Quiz;
