import { prisma } from '../../utils/prisma';
import { alertEngine } from '../alerts/alert-engine.service';

export interface SensorTelemetryInput {
  sensorCode: string;
  reading: number;
  batteryLevel?: number;
  source?: 'sensor' | 'manual';
}

export class SensorsService {
  async getAllSensors() {
    return prisma.sensor.findMany({
      include: {
        reservoir: {
          select: { id: true, name: true, currentVolumeLiters: true, capacityLiters: true }
        },
        zone: {
          select: { id: true, code: true, name: true, greenhouse: true }
        }
      },
      orderBy: { code: 'asc' }
    });
  }

  async getSensorById(id: string) {
    const sensor = await prisma.sensor.findUnique({
      where: { id },
      include: {
        reservoir: true,
        zone: true
      }
    });

    if (!sensor) {
      throw new Error(`Không tìm thấy cảm biến với ID: ${id}`);
    }

    return sensor;
  }

  /**
   * Tiếp nhận dữ liệu đo thời gian thực từ cảm biến IoT (Telemetry Ingestion)
   */
  async ingestTelemetry(data: SensorTelemetryInput) {
    const sensor = await prisma.sensor.findUnique({
      where: { code: data.sensorCode },
      include: { reservoir: true, zone: true }
    });

    if (!sensor) {
      throw new Error(`Không tìm thấy cảm biến với mã: ${data.sensorCode}`);
    }

    const now = new Date();

    // 1. Cập nhật trạng thái cảm biến
    const updatedSensor = await prisma.sensor.update({
      where: { id: sensor.id },
      data: {
        lastReading: data.reading,
        lastSeenAt: now,
        status: 'online',
        batteryLevel: data.batteryLevel !== undefined ? data.batteryLevel : sensor.batteryLevel
      }
    });

    // 2. Nếu cảm biến gắn với bể dinh dưỡng
    if (sensor.reservoirId) {
      const res = sensor.reservoir!;
      let newPh = res.currentPh;
      let newEc = res.currentEc;
      let newTemp = res.currentWaterTemp;
      let newDo = res.currentDo;
      let newLevel = Math.round((res.currentVolumeLiters / res.capacityLiters) * 100);

      if (sensor.sensorType === 'ph') newPh = data.reading;
      else if (sensor.sensorType === 'ec') newEc = data.reading;
      else if (sensor.sensorType === 'water_temp') newTemp = data.reading;
      else if (sensor.sensorType === 'do') newDo = data.reading;
      else if (sensor.sensorType === 'water_level') newLevel = data.reading;

      // Lưu nhật ký chất lượng nước
      await prisma.waterQualityLog.create({
        data: {
          reservoirId: sensor.reservoirId,
          ph: newPh,
          ec: newEc,
          waterTemp: newTemp,
          doLevel: newDo,
          waterLevelPercent: newLevel,
          source: data.source || 'sensor',
          recordedBy: `IoT-${sensor.code}`
        }
      });

      // Cập nhật giá trị bể
      await prisma.reservoir.update({
        where: { id: sensor.reservoirId },
        data: {
          currentPh: newPh,
          currentEc: newEc,
          currentWaterTemp: newTemp,
          currentDo: newDo
        }
      });

      // Chạy Alert Engine đánh giá
      await alertEngine.evaluateWaterQuality(sensor.reservoirId, {
        ph: newPh,
        ec: newEc,
        waterTemp: newTemp,
        doLevel: newDo,
        waterLevelPercent: newLevel,
        recordedBy: sensor.code
      });
    }

    // 3. Nếu cảm biến gắn với phân khu / nhà màng
    if (sensor.zoneId) {
      const airTemp = sensor.sensorType === 'air_temp' || sensor.sensorType === 'multi' ? data.reading : 24.5;
      const humidity = sensor.sensorType === 'humidity' ? data.reading : 68.0;

      await prisma.environmentLog.create({
        data: {
          zoneId: sensor.zoneId,
          airTemp,
          humidity,
          recordedBy: sensor.code,
          source: data.source || 'sensor'
        }
      });

      await alertEngine.evaluateEnvironment(sensor.zoneId, {
        airTemp,
        humidity,
        recordedBy: sensor.code
      });
    }

    return updatedSensor;
  }
}
