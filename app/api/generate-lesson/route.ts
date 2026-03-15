import { GoogleGenAI, Type } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const { language } = await request.json();

    if (!language) {
      return NextResponse.json({ error: 'Language is required' }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere uma lição curta de programação em ${language} no estilo Duolingo.
A lição deve conter 3 exercícios.
Os tipos de exercícios permitidos são: 'multiple_choice', 'fill_in_blank', 'write_code', 'reorder_lines', 'spot_error'.
Certifique-se de que o conteúdo seja educativo, divertido e focado em um conceito básico ou intermediário da linguagem ${language}.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: 'ID único da lição (ex: ai-lesson-1)' },
            title: { type: Type.STRING, description: 'Título da lição' },
            description: { type: Type.STRING, description: 'Descrição curta da lição' },
            exercises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['multiple_choice', 'fill_in_blank', 'write_code', 'reorder_lines', 'spot_error'] },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Apenas para multiple_choice ou reorder_lines' },
                  correctAnswer: { type: Type.STRING, description: 'A resposta correta. Para reorder_lines, use \\n para separar as linhas.' },
                  codeSnippet: { type: Type.STRING, description: 'Código com lacunas ou erros (opcional)' },
                  initialCode: { type: Type.STRING, description: 'Código inicial para write_code (opcional)' },
                  explanation: { type: Type.STRING, description: 'Explicação mostrada após responder' }
                },
                required: ['id', 'type', 'question', 'correctAnswer', 'explanation']
              }
            }
          },
          required: ['id', 'title', 'description', 'exercises']
        }
      }
    });

    const lessonData = JSON.parse(response.text || '{}');
    return NextResponse.json(lessonData);
  } catch (error) {
    console.error('Error generating lesson:', error);
    return NextResponse.json({ error: 'Failed to generate lesson' }, { status: 500 });
  }
}
