'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { courses, Exercise } from '@/lib/data/courses';
import { X, Heart, Check, AlertCircle, Star } from 'lucide-react';
import Editor from '@monaco-editor/react';
import Link from 'next/link';

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { language, unit, lesson } = params as { language: string; unit: string; lesson: string };
  
  const { user, hearts, loseHeart, addXp, completeLesson, gems, spendGems, refillHearts } = useStore();
  
  const [mounted, setMounted] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [codeValue, setCodeValue] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [aiLessonData, setAiLessonData] = useState<any>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (unit === 'ai' && lesson === 'challenge') {
      const data = localStorage.getItem('codelingo-ai-lesson');
      if (data) {
        setAiLessonData(JSON.parse(data));
      }
    }
  }, [unit, lesson]);

  useEffect(() => {
    if (mounted && !user) {
      router.push('/');
    }
  }, [mounted, user, router]);

  const courseData = courses[language];
  const unitData = courseData?.units.find(u => u.id === unit);
  const lessonData = unit === 'ai' && lesson === 'challenge' ? aiLessonData : unitData?.lessons.find(l => l.id === lesson);

  const exercises = lessonData?.exercises || [];
  const currentExercise = exercises[currentExerciseIndex];
  const progress = exercises.length > 0 ? (currentExerciseIndex / exercises.length) * 100 : 0;

  const draftKey = `codelingo-draft-${language}-${unit}-${lesson}-${currentExercise?.id}`;

  useEffect(() => {
    if (mounted && currentExercise) {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft !== null) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCodeValue(savedDraft);
      } else {
        setCodeValue(currentExercise.initialCode || '');
      }
    }
  }, [currentExerciseIndex, mounted, currentExercise, draftKey]);

  const handleCodeChange = (value: string) => {
    if (!isChecking) {
      setCodeValue(value);
      localStorage.setItem(draftKey, value);
    }
  };

  if (!mounted || !user) return null;

  if (unit === 'ai' && lesson === 'challenge' && !aiLessonData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        Carregando desafio IA...
      </div>
    );
  }

  if (!lessonData || !currentExercise) return <div>Lição não encontrada.</div>;

  const handleCheck = () => {
    if (isChecking) {
      // Move to next
      if (feedback === 'correct') {
        localStorage.removeItem(draftKey);
        if (currentExerciseIndex < exercises.length - 1) {
          setCurrentExerciseIndex(prev => prev + 1);
          setFeedback(null);
          setSelectedOption(null);
          setCodeValue('');
          setIsChecking(false);
        } else {
          // Finish lesson
          setShowSuccess(true);
          addXp(10);
          completeLesson(`${language}-${unit}-${lesson}`);
        }
      } else {
        // If incorrect, they must retry or we just move on? Duolingo makes you retry at the end, but for simplicity we'll let them retry immediately.
        setFeedback(null);
        setIsChecking(false);
      }
      return;
    }

    setIsChecking(true);
    let isCorrect = false;

    if (currentExercise.type === 'multiple_choice') {
      isCorrect = selectedOption === currentExercise.correctAnswer;
    } else if (currentExercise.type === 'fill_in_blank' || currentExercise.type === 'spot_error' || currentExercise.type === 'reorder_lines') {
      // Simple string match for now
      isCorrect = codeValue.trim() === currentExercise.correctAnswer;
    } else if (currentExercise.type === 'write_code') {
      // Simple string match for now, ideally we'd run it
      isCorrect = codeValue.trim() === currentExercise.correctAnswer;
    }

    if (isCorrect) {
      setFeedback('correct');
    } else {
      setFeedback('incorrect');
      loseHeart();
      if (hearts <= 1) {
        setShowGameOver(true);
      }
    }
  };

  const handleBuyHearts = async () => {
    const success = await spendGems(350);
    if (success) {
      refillHearts();
      setShowGameOver(false);
      setFeedback(null);
      setIsChecking(false);
    } else {
      alert('Gemas insuficientes!');
    }
  };

  if (showGameOver) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4">
        <Heart className="w-24 h-24 text-zinc-300 dark:text-zinc-700 mb-6" />
        <h1 className="text-3xl font-bold mb-4">Você ficou sem vidas!</h1>
        <p className="text-zinc-500 mb-8 text-center max-w-md">
          Não desista agora. Recarregue suas vidas para continuar aprendendo.
        </p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button 
            onClick={handleBuyHearts}
            className="w-full py-4 rounded-2xl font-bold text-white bg-blue-500 border-b-4 border-blue-600 active:border-b-0 active:translate-y-1 transition-all"
          >
            Comprar Vidas (350 Gemas)
          </button>
          <button 
            onClick={() => router.push('/')}
            className="w-full py-4 rounded-2xl font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-800 border-b-4 border-zinc-300 dark:border-zinc-700 active:border-b-0 active:translate-y-1 transition-all"
          >
            Sair da lição
          </button>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4">
        <div className="w-32 h-32 bg-yellow-400 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <Star className="w-16 h-16 text-white fill-current" />
        </div>
        <h1 className="text-3xl font-bold mb-2 text-yellow-500">Lição Concluída!</h1>
        <p className="text-zinc-500 mb-8 font-bold">+10 XP</p>
        <button 
          onClick={() => router.push('/')}
          className="w-full max-w-xs py-4 rounded-2xl font-bold text-white bg-green-500 border-b-4 border-green-600 active:border-b-0 active:translate-y-1 transition-all"
        >
          Continuar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between p-4 max-w-4xl mx-auto w-full gap-4">
        <button onClick={() => router.push('/')} className="text-zinc-400 hover:text-zinc-600 transition-colors">
          <X className="w-6 h-6" />
        </button>
        <div className="flex-1 h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-1.5 text-red-500 font-bold">
          <Heart className="w-6 h-6 fill-current" />
          <span>{hearts}</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-4 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8">{currentExercise.question}</h2>

        <div className="flex-1">
          {currentExercise.type === 'multiple_choice' && (
            <div className="grid gap-4">
              {currentExercise.options?.map((option: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => !isChecking && setSelectedOption(option)}
                  className={`p-4 rounded-2xl border-2 text-left font-mono text-sm sm:text-base transition-all ${
                    selectedOption === option 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  } ${isChecking ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {(currentExercise.type === 'fill_in_blank' || currentExercise.type === 'spot_error') && (
            <div className="space-y-6">
              <div className="p-6 bg-zinc-100 dark:bg-zinc-900 rounded-2xl font-mono text-lg">
                {currentExercise.codeSnippet}
              </div>
              <input
                type="text"
                value={codeValue}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="Digite sua resposta..."
                className="w-full p-4 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-transparent focus:border-blue-500 outline-none font-mono"
                disabled={isChecking}
              />
            </div>
          )}

          {currentExercise.type === 'write_code' && (
            <div className="h-[300px] rounded-2xl overflow-hidden border-2 border-zinc-200 dark:border-zinc-800">
              <Editor
                height="100%"
                defaultLanguage={
                  language === 'html' ? 'html' :
                  language === 'java' ? 'java' :
                  language === 'csharp' ? 'csharp' :
                  language === 'cpp' ? 'cpp' :
                  language === 'php' ? 'php' :
                  language === 'typescript' ? 'typescript' :
                  language === 'python' ? 'python' : 'javascript'
                }
                theme="vs-dark"
                value={codeValue}
                onChange={(value) => handleCodeChange(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 16,
                  padding: { top: 16 },
                  readOnly: isChecking
                }}
              />
            </div>
          )}

          {currentExercise.type === 'reorder_lines' && (
            <div className="space-y-6">
              <p className="text-zinc-500">Digite as linhas na ordem correta (separadas por quebra de linha):</p>
              <div className="grid gap-2 mb-4">
                {currentExercise.options?.map((opt: string, i: number) => (
                  <div key={i} className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl font-mono text-sm">
                    {opt}
                  </div>
                ))}
              </div>
              <textarea
                value={codeValue}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="w-full h-40 p-4 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-transparent focus:border-blue-500 outline-none font-mono resize-none"
                disabled={isChecking}
                placeholder="Escreva aqui..."
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer / Feedback Area */}
      <div className={`border-t-2 transition-colors ${
        feedback === 'correct' ? 'border-green-500 bg-green-100 dark:bg-green-900/30' :
        feedback === 'incorrect' ? 'border-red-500 bg-red-100 dark:bg-red-900/30' :
        'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950'
      }`}>
        <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            {feedback === 'correct' && (
              <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Excelente!</h3>
                  <p className="text-sm opacity-90">{currentExercise.explanation}</p>
                </div>
              </div>
            )}
            {feedback === 'incorrect' && (
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white">
                  <X className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Incorreto.</h3>
                  <p className="text-sm opacity-90 font-mono mt-1">Resposta: {currentExercise.correctAnswer}</p>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={handleCheck}
            disabled={!isChecking && !selectedOption && !codeValue.trim()}
            className={`w-full sm:w-auto min-w-[150px] py-3 px-6 rounded-2xl font-bold text-white transition-all ${
              feedback === 'correct' ? 'bg-green-500 hover:bg-green-600 border-b-4 border-green-700 active:border-b-0 active:translate-y-1' :
              feedback === 'incorrect' ? 'bg-red-500 hover:bg-red-600 border-b-4 border-red-700 active:border-b-0 active:translate-y-1' :
              (!selectedOption && !codeValue.trim()) ? 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 cursor-not-allowed' :
              'bg-green-500 hover:bg-green-600 border-b-4 border-green-700 active:border-b-0 active:translate-y-1'
            }`}
          >
            {isChecking ? 'Continuar' : 'Verificar'}
          </button>
        </div>
      </div>
    </div>
  );
}
