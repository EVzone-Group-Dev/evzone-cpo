import { LOGO_PATHS } from '../assets';

export class DocumentGenerator {
  static getLogoPath(type: 'cpms' | 'evzoneIcon' | 'evzoneOg'): string {
    return LOGO_PATHS[type];
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  static formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  static getEVzoneColors() {
    return {
      primary: '#3fb950',
      accent: '#ff8c00',
      dark: '#0d1117',
      light: '#ffffff',
      border: '#30363d',
    };
  }
}
