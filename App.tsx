
import React, { useState, useEffect, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { solveMathProblem } from './services/geminiService';
import type { Solution } from './types.ts';
import { Page } from './types.ts';
import { HomeIcon, CalculatorIcon, HistoryIcon, SunIcon, MoonIcon, CameraIcon, UploadIcon, SparklesIcon, TrashIcon } from './components/Icons';
import SolutionCard from './components/SolutionCard';

// Main App Component
const App: React.FC = () => {
  const [theme, setTheme] = useLocalStorage<'dark' | 'light'>('theme', 'light');
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [solutions, setSolutions] = useLocalStorage<Solution[]>('solutions', []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const addSolution = (solution: Solution) => {
    setSolutions(prev => [solution, ...prev]);
  };
  
  const clearHistory = () => {
      setSolutions([]);
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.Home:
        return <HomeScreen setPage={setCurrentPage} recentSolutions={solutions.slice(0, 3)} />;
      case Page.Solve:
        return <SolverScreen addSolution={addSolution} />;
      case Page.History:
        return <HistoryScreen solutions={solutions} clearHistory={clearHistory} />;
      default:
        return <HomeScreen setPage={setCurrentPage} recentSolutions={solutions.slice(0, 3)} />;
    }
  };

  return (
    <div className="min-h-screen font-sans bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text flex flex-col">
      <Header theme={theme} toggleTheme={toggleTheme} />
      <main className="flex-grow container mx-auto px-4 py-8">
        {renderPage()}
      </main>
      <BottomNav currentPage={currentPage} setPage={setCurrentPage} />
    </div>
  );
};

// Header Component
interface HeaderProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}
const Header: React.FC<HeaderProps> = ({ theme, toggleTheme }) => (
  <header className="bg-light-card dark:bg-dark-card shadow-md sticky top-0 z-10">
    <div className="container mx-auto px-4 py-3 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-primary">M.Q.S</h1>
      <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
        {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
      </button>
    </div>
  </header>
);

// BottomNav Component
interface BottomNavProps {
    currentPage: Page;
    setPage: (page: Page) => void;
}
const BottomNav: React.FC<BottomNavProps> = ({ currentPage, setPage }) => {
    const navItems = [
        { page: Page.Home, icon: HomeIcon, label: 'Home' },
        { page: Page.Solve, icon: CalculatorIcon, label: 'Solve' },
        { page: Page.History, icon: HistoryIcon, label: 'History' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-light-card dark:bg-dark-card shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
            <div className="container mx-auto flex justify-around">
                {navItems.map(item => (
                    <button
                        key={item.label}
                        onClick={() => setPage(item.page)}
                        className={`flex flex-col items-center justify-center w-full py-2 px-1 text-sm transition-colors ${
                            currentPage === item.page
                                ? 'text-primary'
                                : 'text-secondary hover:text-primary'
                        }`}
                    >
                        <item.icon className="h-6 w-6 mb-1" />
                        <span>{item.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};


// Screen Components
interface HomeScreenProps {
    setPage: (page: Page) => void;
    recentSolutions: Solution[];
}
const HomeScreen: React.FC<HomeScreenProps> = ({ setPage, recentSolutions }) => (
    <div className="flex flex-col items-center text-center space-y-8 pb-20">
        <div className="mt-8">
            <h2 className="text-4xl font-bold text-light-text dark:text-dark-text">Welcome to M.Q.S</h2>
            <p className="text-secondary mt-2">Your AI-powered math solving companion.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
            <button onClick={() => setPage(Page.Solve)} className="bg-primary text-white font-semibold py-4 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105 flex items-center justify-center space-x-2">
                <SparklesIcon className="h-6 w-6" />
                <span>Solve a Problem</span>
            </button>
            <button onClick={() => setPage(Page.History)} className="bg-slate-500 text-white font-semibold py-4 px-6 rounded-lg shadow-lg hover:bg-slate-600 transition-transform transform hover:scale-105 flex items-center justify-center space-x-2">
                <HistoryIcon className="h-6 w-6" />
                <span>View History</span>
            </button>
        </div>
        {recentSolutions.length > 0 && (
            <div className="w-full max-w-4xl pt-8">
                <h3 className="text-2xl font-bold mb-4 text-left">Recent Solutions</h3>
                <div className="space-y-4">
                    {recentSolutions.map(sol => (
                        <div key={sol.id} className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md text-left">
                            <p className="font-medium truncate">{sol.questionText || "Image Question"}</p>
                            <p className="text-sm text-secondary mt-1">{new Date(sol.timestamp).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);


interface SolverScreenProps {
    addSolution: (solution: Solution) => void;
}
const SolverScreen: React.FC<SolverScreenProps> = ({ addSolution }) => {
    const [question, setQuestion] = useState('');
    const [image, setImage] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
    const [solution, setSolution] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage({
                    base64: reader.result as string,
                    mimeType: file.type,
                    name: file.name
                });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const triggerCamera = () => {
        if (fileInputRef.current) {
            fileInputRef.current.setAttribute('capture', 'environment');
            fileInputRef.current.click();
        }
    };
    
    const triggerFileUpload = () => {
        if (fileInputRef.current) {
            fileInputRef.current.removeAttribute('capture');
            fileInputRef.current.click();
        }
    };

    const handleSubmit = async () => {
        if (!question && !image) return;
        setIsLoading(true);
        setSolution(null);

        const prompt = question || "Solve the math problem in the image.";
        const result = await solveMathProblem(prompt, image ?? undefined);

        const newSolution: Solution = {
            id: new Date().toISOString(),
            questionText: question,
            questionImage: image?.base64,
            solution: result,
            timestamp: Date.now(),
        };

        setSolution(result);
        addSolution(newSolution);
        setIsLoading(false);
    };
    
    return (
        <div className="flex flex-col items-center space-y-6 pb-20">
            <div className="w-full max-w-2xl p-6 bg-light-card dark:bg-dark-card rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-center">Solve a Math Problem</h2>
                <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Type your math question here, e.g., 'What is the integral of x^2?'"
                    className="w-full p-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-light-bg dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                    rows={4}
                />

                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

                <div className="flex items-center my-4">
                    <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
                    <span className="flex-shrink mx-4 text-secondary">OR</span>
                    <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
                </div>
                
                 {image && (
                    <div className="mb-4 text-center">
                        <img src={image.base64} alt="Question preview" className="max-h-40 mx-auto rounded-lg mb-2" />
                        <p className="text-sm text-secondary">{image.name}</p>
                        <button onClick={() => setImage(null)} className="text-red-500 text-xs hover:underline">Remove</button>
                    </div>
                )}


                <div className="grid grid-cols-2 gap-4 mb-4">
                    <button onClick={triggerCamera} className="flex items-center justify-center space-x-2 p-3 bg-secondary/20 dark:bg-secondary/30 text-secondary dark:text-slate-300 rounded-lg hover:bg-secondary/30 dark:hover:bg-secondary/40 transition">
                        <CameraIcon className="h-5 w-5" />
                        <span>Use Camera</span>
                    </button>
                     <button onClick={triggerFileUpload} className="flex items-center justify-center space-x-2 p-3 bg-secondary/20 dark:bg-secondary/30 text-secondary dark:text-slate-300 rounded-lg hover:bg-secondary/30 dark:hover:bg-secondary/40 transition">
                        <UploadIcon className="h-5 w-5" />
                        <span>Upload Photo</span>
                    </button>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={isLoading || (!question && !image)}
                    className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-blue-700 transition disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading ? (
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : <SparklesIcon className="h-5 w-5 mr-2" />}
                    <span>{isLoading ? 'Solving...' : 'Solve'}</span>
                </button>
            </div>
            
            {isLoading && (
                 <div className="w-full max-w-2xl text-center p-4">
                    <p className="text-secondary">AI is thinking... Please wait.</p>
                 </div>
            )}

            {solution && (
                <div className="w-full max-w-2xl">
                     <SolutionCard solution={solution} />
                </div>
            )}
        </div>
    );
};

interface HistoryScreenProps {
    solutions: Solution[];
    clearHistory: () => void;
}
const HistoryScreen: React.FC<HistoryScreenProps> = ({ solutions, clearHistory }) => (
    <div className="flex flex-col space-y-6 pb-20">
        <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">Solution History</h2>
            {solutions.length > 0 && (
                <button onClick={clearHistory} className="flex items-center space-x-2 text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 transition">
                    <TrashIcon className="h-4 w-4" />
                    <span>Clear History</span>
                </button>
            )}
        </div>

        {solutions.length === 0 ? (
            <div className="text-center py-16">
                <p className="text-secondary">You haven't solved any problems yet.</p>
            </div>
        ) : (
            <div className="space-y-4">
                {solutions.map(sol => (
                     <details key={sol.id} className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md overflow-hidden">
                        <summary className="font-semibold cursor-pointer flex justify-between items-center">
                            <div>
                                <p className="truncate pr-4">{sol.questionText || "Image Question"}</p>
                                <p className="text-sm text-secondary mt-1">{new Date(sol.timestamp).toLocaleString()}</p>
                            </div>
                            <span className="text-sm text-primary">View Solution</span>
                        </summary>
                        <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                            {sol.questionImage && <img src={sol.questionImage} alt="Question" className="max-h-60 rounded-lg mb-4" />}
                            <SolutionCard solution={sol.solution} />
                        </div>
                     </details>
                ))}
            </div>
        )}
    </div>
);


export default App;
