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
    
    if (savedScore !== null && savedName !== null) {
      try {
        const { data, error } = await supabase
          .from('quiz_results')
          .select('id')
          .eq('name', savedName)
          .limit(1);
          
        if (error) throw error;
        
        // Se retornar vazio, o admin excluiu
        if (data && data.length === 0) {
          localStorage.removeItem('quiz_score');
          localStorage.removeItem('quiz_name');
          setCheckingStatus(false);
          return;
        }
      } catch (err) {
        console.error("Erro ao verificar status:", err);
      }

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
      await supabase
        .from('quiz_results')
        .insert([{ name: playerName, score: scoreToSave }]);
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
        <h1 className="title-logo">Quiz: Qual é o seu potencial MARKETEIRO?</h1>
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
