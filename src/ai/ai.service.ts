import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

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
        this.logger.warn('Failed to initialize Gemini AI:', error.message);
      }
    } else {
      this.logger.warn('GOOGLE_AI_API_KEY not found in environment variables');
    }
  }

  /**
   * Generate session recommendations using AI
   */
  async generateSessionRecommendations(
    memberProfile: any,
    memberStats: any,
    availableSessions: any[],
  ): Promise<{
    recommendations: any[];
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
          const spots = session.capacity - (session.bookings?.length || 0);
          return `${index + 1}. ${session.sessionType.name}`;
        })
        .join(', ');

      const prompt = `Recommend 5 fitness sessions for a member. Available: ${sessionList}. Return JSON with recommendations array containing sessionNumber, reason, confidence fields, plus overallConfidence and reasoning.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonText = text
        .trim()
        .replace(/```json/g, '')
        .replace(/```/g, '');
      const parsed = JSON.parse(jsonText);

      const recommendations = parsed.recommendations
        .map((rec: any) => {
          const session = availableSessions[rec.sessionNumber - 1];
          if (!session) return null;
          return {
            ...session,
            spotsAvailable: session.capacity - (session.bookings?.length || 0),
            recommendationReason: rec.reason,
            aiConfidence: rec.confidence,
          };
        })
        .filter(Boolean);

      return {
        recommendations,
        confidence: parsed.overallConfidence || 0.8,
        reasoning: parsed.reasoning || 'AI-generated',
      };
    } catch (error) {
      this.logger.error(
        'Failed to generate AI recommendations:',
        error.message,
      );
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
