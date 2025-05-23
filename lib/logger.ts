/**
 * SepetTakip Merkezi Basit Loglama Modülü
 */

// Logger arayüzü
export interface Logger {
  error: (message: string, error?: Error | unknown, data?: any) => void;
  warn: (message: string, data?: any) => void;
  info: (message: string, data?: any) => void;
  http: (message: string, data?: any) => void;
  debug: (message: string, data?: any) => void;
}

// Basit console tabanlı logger
class ConsoleLogger implements Logger {
  private createTimestamp() {
    return new Date().toISOString();
  }

  error(message: string, error?: Error | unknown, data?: any) {
    console.error(`[ERROR] ${this.createTimestamp()} - ${message}`, error, data);
  }
  
  warn(message: string, data?: any) {
    console.warn(`[WARN] ${this.createTimestamp()} - ${message}`, data);
  }
  
  info(message: string, data?: any) {
    console.info(`[INFO] ${this.createTimestamp()} - ${message}`, data);
  }
  
  http(message: string, data?: any) {
    console.log(`[HTTP] ${this.createTimestamp()} - ${message}`, data);
  }
  
  debug(message: string, data?: any) {
    console.debug(`[DEBUG] ${this.createTimestamp()} - ${message}`, data);
  }
}

// Logger örneği oluştur
const logger: Logger = new ConsoleLogger();

export default logger; 