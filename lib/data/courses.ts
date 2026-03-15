export type ExerciseType = 'multiple_choice' | 'fill_in_blank' | 'write_code' | 'reorder_lines' | 'spot_error';

export interface Exercise {
  id: string;
  type: ExerciseType;
  question: string;
  options?: string[]; // For multiple choice
  correctAnswer: string | string[]; // For multiple choice, fill in blank, spot error
  codeSnippet?: string; // For fill in blank, spot error, reorder lines
  initialCode?: string; // For write code
  expectedOutput?: string; // For write code validation
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  exercises: Exercise[];
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  name: string;
  icon: string;
  units: Unit[];
}

export const courses: Record<string, Course> = {
  python: {
    id: 'python',
    name: 'Python',
    icon: '🐍',
    units: [
      {
        id: 'unit1',
        title: 'Fundamentos',
        description: 'Aprenda o básico de Python.',
        lessons: [
          {
            id: 'lesson1',
            title: 'Olá, Mundo!',
            description: 'Sua primeira linha de código.',
            exercises: [
              {
                id: 'ex1',
                type: 'multiple_choice',
                question: 'Como você imprime "Olá, Mundo!" em Python?',
                options: ['print("Olá, Mundo!")', 'echo "Olá, Mundo!"', 'console.log("Olá, Mundo!")', 'System.out.println("Olá, Mundo!")'],
                correctAnswer: 'print("Olá, Mundo!")',
                explanation: 'Em Python, a função `print()` é usada para exibir texto na tela.'
              },
              {
                id: 'ex2',
                type: 'fill_in_blank',
                question: 'Complete o código para imprimir "Python é legal".',
                codeSnippet: '_____("Python é legal")',
                correctAnswer: 'print',
                explanation: 'A função `print` exibe a mensagem.'
              },
              {
                id: 'ex3',
                type: 'write_code',
                question: 'Escreva um código que imprima o número 42.',
                initialCode: '# Escreva seu código aqui\n',
                correctAnswer: 'print(42)',
                explanation: 'Você pode imprimir números diretamente com `print()`.'
              }
            ]
          },
          {
            id: 'lesson2',
            title: 'Variáveis',
            description: 'Guardando informações.',
            exercises: [
              {
                id: 'ex1',
                type: 'multiple_choice',
                question: 'Como você cria uma variável chamada `nome` com o valor "Maria"?',
                options: ['nome = "Maria"', 'var nome = "Maria"', 'let nome = "Maria"', 'String nome = "Maria"'],
                correctAnswer: 'nome = "Maria"',
                explanation: 'Em Python, você não precisa declarar o tipo da variável. Basta usar o sinal de igual `=`.'
              },
              {
                id: 'ex2',
                type: 'spot_error',
                question: 'Encontre e corrija o erro no código abaixo.',
                codeSnippet: 'idade := 25\nprint(idade)',
                correctAnswer: 'idade = 25\nprint(idade)',
                explanation: 'O operador de atribuição em Python é `=`, não `:=` (a menos que seja o walrus operator, mas não neste contexto simples).'
              }
            ]
          }
        ]
      }
    ]
  },
  javascript: {
    id: 'javascript',
    name: 'JavaScript',
    icon: '🟨',
    units: [
      {
        id: 'unit1',
        title: 'Fundamentos JS',
        description: 'O básico da web.',
        lessons: [
          {
            id: 'lesson1',
            title: 'Console.log',
            description: 'Imprimindo no console.',
            exercises: [
              {
                id: 'ex1',
                type: 'multiple_choice',
                question: 'Como imprimir algo no console em JavaScript?',
                options: ['console.log("Olá")', 'print("Olá")', 'echo("Olá")', 'System.out.println("Olá")'],
                correctAnswer: 'console.log("Olá")',
                explanation: '`console.log()` é a função padrão para debug e impressão no JS.'
              }
            ]
          }
        ]
      }
    ]
  },
  html: {
    id: 'html',
    name: 'HTML/CSS',
    icon: '🌐',
    units: [
      {
        id: 'unit1',
        title: 'Estrutura Básica',
        description: 'Construindo a web.',
        lessons: [
          {
            id: 'lesson1',
            title: 'Tags e Elementos',
            description: 'A base do HTML.',
            exercises: [
              {
                id: 'ex1',
                type: 'multiple_choice',
                question: 'Qual tag é usada para o título principal de uma página?',
                options: ['<h1>', '<title>', '<header>', '<top>'],
                correctAnswer: '<h1>',
                explanation: 'A tag `<h1>` define o cabeçalho mais importante (título principal).'
              }
            ]
          }
        ]
      }
    ]
  },
  java: {
    id: 'java',
    name: 'Java',
    icon: '☕',
    units: [
      {
        id: 'unit1',
        title: 'Iniciando com Java',
        description: 'Aprenda a linguagem corporativa.',
        lessons: [
          {
            id: 'lesson1',
            title: 'Sintaxe Básica',
            description: 'Sua primeira classe.',
            exercises: [
              {
                id: 'ex1',
                type: 'multiple_choice',
                question: 'Como imprimir texto em Java?',
                options: ['System.out.println("Olá");', 'console.log("Olá");', 'print("Olá");', 'echo "Olá";'],
                correctAnswer: 'System.out.println("Olá");',
                explanation: 'Java usa `System.out.println()` para imprimir no console.'
              }
            ]
          }
        ]
      }
    ]
  },
  csharp: {
    id: 'csharp',
    name: 'C#',
    icon: '🔷',
    units: [
      {
        id: 'unit1',
        title: 'Fundamentos C#',
        description: 'A linguagem da Microsoft.',
        lessons: [
          {
            id: 'lesson1',
            title: 'Console',
            description: 'Escrevendo no console.',
            exercises: [
              {
                id: 'ex1',
                type: 'multiple_choice',
                question: 'Como imprimir uma linha em C#?',
                options: ['Console.WriteLine("Olá");', 'System.out.println("Olá");', 'print("Olá");', 'console.log("Olá");'],
                correctAnswer: 'Console.WriteLine("Olá");',
                explanation: 'C# usa a classe `Console` e o método `WriteLine`.'
              }
            ]
          }
        ]
      }
    ]
  },
  cpp: {
    id: 'cpp',
    name: 'C++',
    icon: '⚙️',
    units: [
      {
        id: 'unit1',
        title: 'Básico de C++',
        description: 'Performance e controle.',
        lessons: [
          {
            id: 'lesson1',
            title: 'Output',
            description: 'Imprimindo dados.',
            exercises: [
              {
                id: 'ex1',
                type: 'multiple_choice',
                question: 'Qual é a forma padrão de imprimir em C++?',
                options: ['std::cout << "Olá";', 'printf("Olá");', 'print("Olá");', 'Console.WriteLine("Olá");'],
                correctAnswer: 'std::cout << "Olá";',
                explanation: '`std::cout` é o fluxo de saída padrão em C++.'
              }
            ]
          }
        ]
      }
    ]
  },
  php: {
    id: 'php',
    name: 'PHP',
    icon: '🐘',
    units: [
      {
        id: 'unit1',
        title: 'PHP Básico',
        description: 'Linguagem de servidor.',
        lessons: [
          {
            id: 'lesson1',
            title: 'Tags e Echo',
            description: 'Iniciando scripts.',
            exercises: [
              {
                id: 'ex1',
                type: 'multiple_choice',
                question: 'Como imprimir texto em PHP?',
                options: ['echo "Olá";', 'print("Olá")', 'console.log("Olá")', 'System.out.println("Olá")'],
                correctAnswer: 'echo "Olá";',
                explanation: '`echo` é a construção de linguagem mais comum para saída em PHP.'
              }
            ]
          }
        ]
      }
    ]
  },
  typescript: {
    id: 'typescript',
    name: 'TypeScript',
    icon: '📘',
    units: [
      {
        id: 'unit1',
        title: 'Tipagem Estática',
        description: 'JavaScript com superpoderes.',
        lessons: [
          {
            id: 'lesson1',
            title: 'Tipos Básicos',
            description: 'Definindo tipos.',
            exercises: [
              {
                id: 'ex1',
                type: 'multiple_choice',
                question: 'Como declarar uma variável string em TypeScript?',
                options: ['let nome: string = "João";', 'String nome = "João";', 'let nome = "João" as string;', 'var nome: String = "João";'],
                correctAnswer: 'let nome: string = "João";',
                explanation: 'Em TypeScript, você usa `: tipo` após o nome da variável.'
              }
            ]
          }
        ]
      }
    ]
  }
};
