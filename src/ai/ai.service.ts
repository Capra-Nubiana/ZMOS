import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

interface SessionType {
  name: string;
}

interface AvailableSession {
  capacity: number;
  bookings?: unknown[];
  sessionType: SessionType;
  [key: string]: unknown;
}

interface AIRecommendation {
  sessionNumber: number;
  reason: string;
  confidence: number;
}

interface AIResponse {
  recommendations: AIRecommendation[];
  overallConfidence?: number;
  reasoning?: string;
}

interface RecommendationResult {
  spotsAvailable: number;
  recommendationReason: string;
  aiConfidence: number;
  [key: string]: unknown;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI | undefined;
  private model: GenerativeModel | undefined;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GOOGLE_AI_API_KEY');

    if (apiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({
          model: 'gemini-2.0-flash-exp',
        });
        this.logger.log('Google Gemini AI initialized successfully');
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn('Failed to initialize Gemini AI:', errorMessage);
      }
    } else {
      this.logger.warn('GOOGLE_AI_API_KEY not found in environment variables');
    }
  }

  /**
   * Generate session recommendations using AI
   */
  async generateSessionRecommendations(
    memberProfile: unknown,
    memberStats: unknown,
    availableSessions: AvailableSession[],
  ): Promise<{
    recommendations: RecommendationResult[];
    confidence: number;
    reasoning: string;
  }> {
    if (!this.model) {
      throw new Error('AI model not initialized');
    }

    try {
      const sessionList = availableSessions
        .slice(0, 20)
        .map((session, index) => {
          return `${index + 1}. ${session.sessionType.name}`;
        })
        .join(', ');

      const prompt = `Recommend 5 fitness sessions for a member. Available: ${sessionList}. Return JSON with recommendations array containing sessionNumber, reason, confidence fields, plus overallConfidence and reasoning.`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const jsonText = text
        .trim()
        .replace(/```json/g, '')
        .replace(/```/g, '');
      const parsed = JSON.parse(jsonText) as AIResponse;

      const recommendations = parsed.recommendations
        .map((rec: AIRecommendation) => {
          const session = availableSessions[rec.sessionNumber - 1];
          if (!session) return null;
          return {
            ...session,
            spotsAvailable: session.capacity - (session.bookings?.length || 0),
            recommendationReason: rec.reason,
            aiConfidence: rec.confidence,
          };
        })
        .filter((item): item is RecommendationResult => item !== null);

      return {
        recommendations,
        confidence: parsed.overallConfidence ?? 0.8,
        reasoning: parsed.reasoning ?? 'AI-generated',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to generate AI recommendations:', errorMessage);
      throw error;
    }
  }

  /**
   * Check if AI is available
   */
  isAvailable(): boolean {
    return !!this.model;
  }
}
