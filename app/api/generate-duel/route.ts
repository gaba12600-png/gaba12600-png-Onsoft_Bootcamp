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
      contents: `Gere um desafio de programação rápido e divertido em ${language} para um duelo entre dois jogadores.
O desafio deve ser simples o suficiente para ser resolvido em poucos minutos, mas exigir algum pensamento lógico.
Deve ser no formato de escrever uma função.
Retorne o título, a descrição do problema, o código inicial (com a assinatura da função) e a resposta esperada (a solução completa da função).`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Título curto e empolgante do desafio' },
            description: { type: Type.STRING, description: 'Descrição clara do que a função deve fazer' },
            initialCode: { type: Type.STRING, description: 'Código inicial com a assinatura da função e comentários' },
            expectedOutput: { type: Type.STRING, description: 'Código completo com a solução correta e otimizada' }
          },
          required: ['title', 'description', 'initialCode', 'expectedOutput']
        }
      }
    });

    const challengeData = JSON.parse(response.text || '{}');
    return NextResponse.json(challengeData);
  } catch (error) {
    console.error('Error generating duel challenge:', error);
    return NextResponse.json({ error: 'Failed to generate challenge' }, { status: 500 });
  }
}
