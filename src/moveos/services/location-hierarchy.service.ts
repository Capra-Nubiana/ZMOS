import { Injectable, Logger } from '@nestjs/common';

/**
 * Location Hierarchy Service
 * Provides country, province, county data and hierarchical location management
 */

export interface Country {
  code: string; // ISO 3166-1 alpha-2 (e.g., "ZA", "US", "GB")
  name: string;
  dialCode: string; // Phone code (e.g., "+27")
  currency: string;
  provinces: Province[];
}

export interface Province {
  code: string;
  name: string;
  country: string; // Country code
  type: string; // 'province', 'state', 'region', 'territory'
  counties?: County[];
}

export interface County {
  code: string;
  name: string;
  province: string; // Province code
  type: string; // 'county', 'district', 'municipality'
}

@Injectable()
export class LocationHierarchyService {
  private readonly logger = new Logger(LocationHierarchyService.name);
  private countries: Map<string, Country> = new Map();
  private provinces: Map<string, Province> = new Map();

  constructor() {
    this.initializeLocationData();
  }

  /**
   * Initialize with common countries and their subdivisions
   */
  private initializeLocationData() {
    // South Africa
    this.addCountry({
      code: 'ZA',
      name: 'South Africa',
      dialCode: '+27',
      currency: 'ZAR',
      provinces: [
        { code: 'ZA-GP', name: 'Gauteng', country: 'ZA', type: 'province' },
        {
          code: 'ZA-WC',
          name: 'Western Cape',
          country: 'ZA',
          type: 'province',
        },
        {
          code: 'ZA-KZN',
          name: 'KwaZulu-Natal',
          country: 'ZA',
          type: 'province',
        },
        {
          code: 'ZA-EC',
          name: 'Eastern Cape',
          country: 'ZA',
          type: 'province',
        },
        { code: 'ZA-FS', name: 'Free State', country: 'ZA', type: 'province' },
        { code: 'ZA-LP', name: 'Limpopo', country: 'ZA', type: 'province' },
        { code: 'ZA-MP', name: 'Mpumalanga', country: 'ZA', type: 'province' },
        { code: 'ZA-NW', name: 'North West', country: 'ZA', type: 'province' },
        {
          code: 'ZA-NC',
          name: 'Northern Cape',
          country: 'ZA',
          type: 'province',
        },
      ],
    });

    // United States
    this.addCountry({
      code: 'US',
      name: 'United States',
      dialCode: '+1',
      currency: 'USD',
      provinces: [
        { code: 'US-CA', name: 'California', country: 'US', type: 'state' },
        { code: 'US-NY', name: 'New York', country: 'US', type: 'state' },
        { code: 'US-TX', name: 'Texas', country: 'US', type: 'state' },
        { code: 'US-FL', name: 'Florida', country: 'US', type: 'state' },
        { code: 'US-IL', name: 'Illinois', country: 'US', type: 'state' },
        // Add more states as needed
      ],
    });

    // United Kingdom
    this.addCountry({
      code: 'GB',
      name: 'United Kingdom',
      dialCode: '+44',
      currency: 'GBP',
      provinces: [
        { code: 'GB-ENG', name: 'England', country: 'GB', type: 'country' },
        { code: 'GB-SCT', name: 'Scotland', country: 'GB', type: 'country' },
        { code: 'GB-WLS', name: 'Wales', country: 'GB', type: 'country' },
        {
          code: 'GB-NIR',
          name: 'Northern Ireland',
          country: 'GB',
          type: 'country',
        },
      ],
    });

    // Kenya
    this.addCountry({
      code: 'KE',
      name: 'Kenya',
      dialCode: '+254',
      currency: 'KES',
      provinces: [
        { code: 'KE-110', name: 'Nairobi', country: 'KE', type: 'county' },
        { code: 'KE-200', name: 'Mombasa', country: 'KE', type: 'county' },
        { code: 'KE-300', name: 'Kisumu', country: 'KE', type: 'county' },
        { code: 'KE-400', name: 'Nakuru', country: 'KE', type: 'county' },
        // Add more counties as needed
      ],
    });

    // Nigeria
    this.addCountry({
      code: 'NG',
      name: 'Nigeria',
      dialCode: '+234',
      currency: 'NGN',
      provinces: [
        { code: 'NG-LA', name: 'Lagos', country: 'NG', type: 'state' },
        {
          code: 'NG-FC',
          name: 'Federal Capital Territory',
          country: 'NG',
          type: 'territory',
        },
        { code: 'NG-KN', name: 'Kano', country: 'NG', type: 'state' },
        // Add more states as needed
      ],
    });

    this.logger.log(
      `Initialized ${this.countries.size} countries with location hierarchies`,
    );
  }

  /**
   * Add a country to the registry
   */
  private addCountry(country: Country) {
    this.countries.set(country.code, country);
    country.provinces.forEach((province) => {
      this.provinces.set(province.code, province);
    });
  }

  /**
   * Get all countries
   */
  getAllCountries(): Country[] {
    return Array.from(this.countries.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  /**
   * Get country by code
   */
  getCountry(code: string): Country | undefined {
    return this.countries.get(code.toUpperCase());
  }

  /**
   * Get provinces/states for a country
   */
  getProvinces(countryCode: string): Province[] {
    const country = this.getCountry(countryCode);
    return country?.provinces || [];
  }

  /**
   * Get province by code
   */
  getProvince(code: string): Province | undefined {
    return this.provinces.get(code.toUpperCase());
  }

  /**
   * Search locations by name
   */
  searchLocations(query: string): {
    countries: Country[];
    provinces: Province[];
  } {
    const lowerQuery = query.toLowerCase();

    const matchingCountries = Array.from(this.countries.values()).filter(
      (country) => country.name.toLowerCase().includes(lowerQuery),
    );

    const matchingProvinces = Array.from(this.provinces.values()).filter(
      (province) => province.name.toLowerCase().includes(lowerQuery),
    );

    return {
      countries: matchingCountries,
      provinces: matchingProvinces,
    };
  }

  /**
   * Get timezone for a location (simplified)
   */
  getTimezone(countryCode: string, provinceCode?: string): string {
    // This is a simplified version - in production, use a timezone database
    const timezoneMap: Record<string, string> = {
      ZA: 'Africa/Johannesburg',
      US: 'America/New_York', // Default - should be province-specific
      GB: 'Europe/London',
      KE: 'Africa/Nairobi',
      NG: 'Africa/Lagos',
    };

    return timezoneMap[countryCode] || 'UTC';
  }

  /**
   * Validate hierarchical address
   */
  validateAddress(address: {
    country?: string;
    province?: string;
    county?: string;
    city?: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (address.country) {
      const country = this.getCountry(address.country);
      if (!country) {
        errors.push(`Invalid country code: ${address.country}`);
      } else if (address.province) {
        const province = country.provinces.find(
          (p) => p.code === address.province,
        );
        if (!province) {
          errors.push(
            `Invalid province ${address.province} for country ${address.country}`,
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format address string
   */
  formatAddress(components: {
    streetNumber?: string;
    streetName?: string;
    city?: string;
    county?: string;
    province?: string;
    postalCode?: string;
    country?: string;
  }): string {
    const parts: string[] = [];

    if (components.streetNumber && components.streetName) {
      parts.push(`${components.streetNumber} ${components.streetName}`);
    } else if (components.streetName) {
      parts.push(components.streetName);
    }

    if (components.city) parts.push(components.city);
    if (components.county) parts.push(components.county);
    if (components.province) {
      const province = this.getProvince(components.province);
      parts.push(province?.name || components.province);
    }
    if (components.postalCode) parts.push(components.postalCode);
    if (components.country) {
      const country = this.getCountry(components.country);
      parts.push(country?.name || components.country);
    }

    return parts.join(', ');
  }
}
