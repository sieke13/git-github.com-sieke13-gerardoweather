import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const historyFile = path.join(__dirname, '../../data/searchHistory.json');


dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface WeatherData {
  city: string;
  date: string;
  icon: string;
  iconDescription: string;
  tempF: number;
  windSpeed: number;
  humidity: number;
}

class WeatherService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.API_KEY || '';
    this.baseUrl = process.env.API_BASE_URL || 'http://api.openweathermap.org/data/2.5';
  }

  async getWeatherByCity(city: string): Promise<WeatherData[]> {
    try {

      const currentWeatherUrl = new URL('weather', this.baseUrl);
      currentWeatherUrl.searchParams.append('q', city);
      currentWeatherUrl.searchParams.append('appid', this.apiKey);
      currentWeatherUrl.searchParams.append('units', 'imperial');

 
      const forecastUrl = new URL('forecast', this.baseUrl);
      forecastUrl.searchParams.append('q', city);
      forecastUrl.searchParams.append('appid', this.apiKey);
      forecastUrl.searchParams.append('units', 'imperial');

      const [currentResponse, forecastResponse] = await Promise.all([
        axios.get(currentWeatherUrl.toString()),
        axios.get(forecastUrl.toString())
      ]);

    
      const currentWeather: WeatherData = {
        city: currentResponse.data.name,
        date: new Date().toLocaleDateString(),
        icon: currentResponse.data.weather[0].icon,
        iconDescription: currentResponse.data.weather[0].description,
        tempF: Math.round(currentResponse.data.main.temp),
        windSpeed: Math.round(currentResponse.data.wind.speed),
        humidity: currentResponse.data.main.humidity
      };

      const forecast = forecastResponse.data.list
        .filter((_: any, index: number) => index % 8 === 0) 
        .map((item: any) => ({
          city: currentResponse.data.name,
          date: new Date(item.dt * 1000).toLocaleDateString(),
          icon: item.weather[0].icon,
          iconDescription: item.weather[0].description,
          tempF: Math.round(item.main.temp),
          windSpeed: Math.round(item.wind.speed),
          humidity: item.main.humidity
        }));

      await this.saveToHistory(city);

      return [currentWeather, ...forecast];
    } catch (error) {
      console.error('Error in getWeatherByCity:', error);
      throw error;
    }
  }

  private async saveToHistory(city: string): Promise<void> {
    try {
      let history = [];
      try {
        const data = await fs.readFile(historyFile, 'utf-8');
        history = JSON.parse(data);
      } catch {
      }

      history.push({
        id: Date.now().toString(),
        name: city
      });

      const uniqueHistory = history.filter((item: any, index: number, self: any[]) =>
        index === self.findIndex((t) => t.name === item.name)
      );

      await fs.writeFile(historyFile, JSON.stringify(uniqueHistory, null, 2));
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  }
}

export default new WeatherService();
