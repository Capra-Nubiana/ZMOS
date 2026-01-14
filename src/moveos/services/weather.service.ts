/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

/* eslint-disable @typescript-eslint/no-unused-vars */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Weather Service
 * Integrates with weather APIs to check conditions for outdoor activities
 */

export interface WeatherData {
  temperature: number; // Celsius
  feelsLike: number;
  condition: string; // 'clear', 'cloudy', 'rain', 'snow', etc.
  windSpeed: number; // km/h
  humidity: number; // percentage
  precipitation: number; // mm
  visibility: number; // km
  uvIndex: number;
  timestamp: Date;
}

export interface WeatherSafetyCheck {
  isSafe: boolean;
  reasons: string[];
  weatherData: WeatherData;
  recommendation: string;
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly apiKey: string;
  private readonly apiProvider: string; // 'openweather', 'weatherapi', etc.

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('WEATHER_API_KEY') || '';
    this.apiProvider =
      this.configService.get<string>('WEATHER_PROVIDER') || 'mock';
  }

  /**
   * Get current weather for a location
   */
  async getCurrentWeather(
    latitude: number,
    longitude: number,
  ): Promise<WeatherData | null> {
    try {
      // If no API key, return mock data
      if (!this.apiKey || this.apiProvider === 'mock') {
        return this.getMockWeather(latitude, longitude);
      }

      // TODO: Implement real weather API integration
      // Example with OpenWeatherMap:
      // const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric`;
      // const response = await fetch(url);
      // const data = await response.json();
      // return this.parseWeatherResponse(data);

      this.logger.warn('Weather API not configured, returning mock data');
      return this.getMockWeather(latitude, longitude);
    } catch (error) {
      this.logger.error(`Failed to fetch weather: ${error.message}`);
      return null;
    }
  }

  /**
   * Check if weather is safe for a session
   */
  async checkWeatherSafety(
    latitude: number,
    longitude: number,
    requirements: {
      minTemp?: number;
      maxTemp?: number;
      allowedConditions?: string[];
      maxWindSpeed?: number;
      maxPrecipitation?: number;
    },
  ): Promise<WeatherSafetyCheck> {
    const weatherData = await this.getCurrentWeather(latitude, longitude);

    if (!weatherData) {
      return {
        isSafe: false,
        reasons: ['Unable to fetch weather data'],
        weatherData: this.getDefaultWeatherData(),
        recommendation:
          'Cannot verify weather conditions. Consider rescheduling or using indoor venue.',
      };
    }

    const reasons: string[] = [];
    let isSafe = true;

    // Check temperature
    if (
      requirements.minTemp !== undefined &&
      weatherData.temperature < requirements.minTemp
    ) {
      isSafe = false;
      reasons.push(
        `Temperature too low: ${weatherData.temperature}°C (min: ${requirements.minTemp}°C)`,
      );
    }

    if (
      requirements.maxTemp !== undefined &&
      weatherData.temperature > requirements.maxTemp
    ) {
      isSafe = false;
      reasons.push(
        `Temperature too high: ${weatherData.temperature}°C (max: ${requirements.maxTemp}°C)`,
      );
    }

    // Check conditions
    if (
      requirements.allowedConditions &&
      !requirements.allowedConditions.includes(weatherData.condition)
    ) {
      isSafe = false;
      reasons.push(`Unsuitable weather: ${weatherData.condition}`);
    }

    // Check wind speed
    if (
      requirements.maxWindSpeed !== undefined &&
      weatherData.windSpeed > requirements.maxWindSpeed
    ) {
      isSafe = false;
      reasons.push(
        `Wind too strong: ${weatherData.windSpeed} km/h (max: ${requirements.maxWindSpeed} km/h)`,
      );
    }

    // Check precipitation
    if (
      requirements.maxPrecipitation !== undefined &&
      weatherData.precipitation > requirements.maxPrecipitation
    ) {
      isSafe = false;
      reasons.push(
        `Too much rain: ${weatherData.precipitation}mm (max: ${requirements.maxPrecipitation}mm)`,
      );
    }

    const recommendation = isSafe
      ? `Weather is suitable for outdoor activity: ${weatherData.temperature}°C, ${weatherData.condition}`
      : `Weather conditions not suitable. ${reasons.join('. ')}. Consider rescheduling or using indoor venue.`;

    return {
      isSafe,
      reasons,
      weatherData,
      recommendation,
    };
  }

  /**
   * Get weather forecast for upcoming sessions
   */
  async getWeatherForecast(
    latitude: number,
    longitude: number,
    days: number = 7,
  ): Promise<WeatherData[]> {
    try {
      // TODO: Implement forecast API
      this.logger.warn('Weather forecast not implemented, returning mock data');
      return this.getMockForecast(latitude, longitude, days);
    } catch (error) {
      this.logger.error(`Failed to fetch forecast: ${error.message}`);
      return [];
    }
  }

  /**
   * Mock weather data for development/testing
   */
  private getMockWeather(latitude: number, longitude: number): WeatherData {
    // Generate realistic mock data based on latitude
    const isWinter = new Date().getMonth() < 3 || new Date().getMonth() > 9;
    const baseTemp = latitude > 0 ? (isWinter ? 10 : 25) : isWinter ? 25 : 10;

    return {
      temperature: baseTemp + Math.random() * 5,
      feelsLike: baseTemp + Math.random() * 3,
      condition: ['clear', 'partly_cloudy', 'cloudy'][
        Math.floor(Math.random() * 3)
      ],
      windSpeed: Math.random() * 20,
      humidity: 40 + Math.random() * 40,
      precipitation: Math.random() * 2,
      visibility: 8 + Math.random() * 4,
      uvIndex: Math.floor(Math.random() * 11),
      timestamp: new Date(),
    };
  }

  /**
   * Mock forecast data
   */
  private getMockForecast(
    latitude: number,
    longitude: number,
    days: number,
  ): WeatherData[] {
    const forecast: WeatherData[] = [];
    for (let i = 0; i < days; i++) {
      const weather = this.getMockWeather(latitude, longitude);
      forecast.push({
        ...weather,
        timestamp: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
      });
    }
    return forecast;
  }

  /**
   * Default weather data for error cases
   */
  private getDefaultWeatherData(): WeatherData {
    return {
      temperature: 20,
      feelsLike: 20,
      condition: 'unknown',
      windSpeed: 0,
      humidity: 50,
      precipitation: 0,
      visibility: 10,
      uvIndex: 5,
      timestamp: new Date(),
    };
  }

  /**
   * Parse weather API response (example for OpenWeatherMap)
   */
  private parseWeatherResponse(data: any): WeatherData {
    return {
      temperature: data.main?.temp || 20,
      feelsLike: data.main?.feels_like || 20,
      condition: data.weather?.[0]?.main?.toLowerCase() || 'unknown',
      windSpeed: (data.wind?.speed || 0) * 3.6, // m/s to km/h
      humidity: data.main?.humidity || 50,
      precipitation: data.rain?.['1h'] || 0,
      visibility: (data.visibility || 10000) / 1000, // meters to km
      uvIndex: data.uvi || 5,
      timestamp: new Date(),
    };
  }
}
