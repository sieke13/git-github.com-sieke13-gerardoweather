import { Router } from 'express';
import WeatherService from '../../service/weatherService.js';

const router = Router();

interface WeatherRequest {
  cityName: string; 
}


router.post('/', async (req, res) => {
  try {
    const { cityName } = req.body as WeatherRequest;
    console.log('Received city:', cityName);
    
    if (!cityName) {
      return res.status(400).json({ error: 'City name is required' });
    }


    const weatherData = await WeatherService.getWeatherByCity(cityName);
    console.log('Weather data:', weatherData);
    return res.json(weatherData);
  } catch (error) {
    console.error('Error retrieving weather data:', error);
    return res.status(500).json({ error: 'Failed to retrieve weather data' });
  }
});

export default router;
