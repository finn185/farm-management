import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/env';
import authRoutes from './modules/auth/auth.routes';
import batchRoutes from './modules/batches/batches.routes';
import reservoirRoutes from './modules/reservoirs/reservoirs.routes';
import alertRoutes from './modules/alerts/alerts.routes';
import harvestRoutes from './modules/harvests/harvests.routes';
import cultivarRoutes from './modules/cultivars/cultivars.routes';
import zoneRoutes from './modules/zones/zones.routes';
import aiRoutes from './modules/ai/ai.routes';
import sensorRoutes from './modules/sensors/sensors.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import simulatorRoutes from './modules/simulator/simulator.routes';
import { bootstrapSimulator } from './modules/simulator/simulator.service';
import { startDeviceWatchdog } from './modules/sensors/device-watchdog';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

// Middlewares
const allowedOrigins = config.CORS_ORIGIN
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || config.CORS_ORIGIN === '*' || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    const cleanOrigin = origin.replace(/\/+$/, '');
    if (
      allowedOrigins.includes(cleanOrigin) ||
      cleanOrigin === 'http://localhost:3000' ||
      cleanOrigin === 'http://127.0.0.1:3000' ||
      cleanOrigin.endsWith('.up.railway.app')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check API
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'HydroSmart Farm Management Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'HydroSmart Farm Management Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Application Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/auth', authRoutes);

app.use('/api/v1/batches', batchRoutes);
app.use('/api/batches', batchRoutes);

app.use('/api/v1/reservoirs', reservoirRoutes);
app.use('/api/reservoirs', reservoirRoutes);

app.use('/api/v1/alerts', alertRoutes);
app.use('/api/alerts', alertRoutes);

app.use('/api/v1/harvests', harvestRoutes);
app.use('/api/harvests', harvestRoutes);

app.use('/api/v1/cultivars', cultivarRoutes);
app.use('/api/cultivars', cultivarRoutes);

app.use('/api/v1/zones', zoneRoutes);
app.use('/api/zones', zoneRoutes);

app.use('/api/v1/ai', aiRoutes);
app.use('/api/ai', aiRoutes);

app.use('/api/v1/sensors', sensorRoutes);
app.use('/api/sensors', sensorRoutes);

app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Trạm giả lập IoT (thiết bị ảo) - tắt khi DATA_SOURCE=device
app.use('/api/v1/simulator', simulatorRoutes);
app.use('/api/simulator', simulatorRoutes);

// 404 Route Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Không tìm thấy API endpoint yêu cầu'
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🌱 HydroSmart Backend is running on port: ${config.PORT}`);
    console.log(`🚀 Health Check: http://localhost:${config.PORT}/health`);
    console.log(`🔐 Auth Endpoints:`);
    console.log(`   - POST http://localhost:${config.PORT}/api/v1/auth/register`);
    console.log(`   - POST http://localhost:${config.PORT}/api/v1/auth/login`);
    console.log(`   - GET  http://localhost:${config.PORT}/api/v1/auth/me`);
    console.log(`📡 Nguồn dữ liệu cảm biến: ${config.DATA_SOURCE === 'device' ? 'THIẾT BỊ THẬT (ESP32)' : 'TRẠM GIẢ LẬP (có thể bật/tắt trên giao diện)'}`);
    console.log(`   - POST http://localhost:${config.PORT}/api/v1/sensors/telemetry/batch`);
    console.log(`=======================================================`);
    bootstrapSimulator();
    startDeviceWatchdog();
  });
}

export default app;
