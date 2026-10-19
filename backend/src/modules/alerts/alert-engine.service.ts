import { prisma } from '../../utils/prisma';

export interface WaterEvaluationData {
  ph: number;
  ec: number;
  waterTemp: number;
  doLevel?: number | null;
  waterLevelPercent?: number | null;
  recordedBy?: string;
}

export interface EnvironmentEvaluationData {
  airTemp: number;
  humidity: number;
  co2?: number | null;
  ppfd?: number | null;
  dli?: number | null;
  vpd?: number | null;
  recordedBy?: string;
}

export class AlertEngineService {
  /**
   * Đánh giá chất lượng nước bồn tuần hoàn NFT đối chiếu với từng lô đang canh tác
   */
  async evaluateWaterQuality(reservoirId: string, data: WaterEvaluationData) {
    const reservoir = await prisma.reservoir.findUnique({
      where: { id: reservoirId },
      include: {
        batches: {
          where: { status: 'active' },
          include: { cultivar: true, zone: true }
        }
      }
    });

    if (!reservoir) return [];

    const activeBatches = reservoir.batches;
    const generatedAlerts: any[] = [];

    // Nếu bồn không có lô nào đang trồng, kiểm tra ngưỡng kỹ thuật chung của bồn (5.5 - 6.5 pH, 1.4 - 2.0 EC)
    if (activeBatches.length === 0) {
      await this.evaluateSingleMetric({
        reservoirId,
        batchId: null,
        zoneId: null,
        metric: 'pH',
        actualValue: data.ph,
        min: 5.5,
        max: 6.5,
        unit: 'pH',
        contextName: reservoir.name
      });

      await this.evaluateSingleMetric({
        reservoirId,
        batchId: null,
        zoneId: null,
        metric: 'EC',
        actualValue: data.ec,
        min: 1.4,
        max: 2.0,
        unit: 'mS/cm',
        contextName: reservoir.name
      });
      return generatedAlerts;
    }

    // Đánh giá chi tiết cho từng lô canh tác kết nối với bồn này
    for (const batch of activeBatches) {
      const c = batch.cultivar;
      let targetPhMin = c.recommendedPhMin;
      let targetPhMax = c.recommendedPhMax;
      let targetEcMin = c.recommendedEcMin;
      let targetEcMax = c.recommendedEcMax;
      let targetTempMin = c.optimalWaterTempMin;
      let targetTempMax = c.optimalWaterTempMax;

      // Ưu tiên ngưỡng chuyên biệt của giai đoạn sinh trưởng hiện tại nếu có
      if (c.stageConfigs && (c.stageConfigs as any).stages) {
        const stageList = (c.stageConfigs as any).stages;
        const matchedStage = stageList.find((s: any) => s.stage === batch.currentStage);
        if (matchedStage) {
          if (matchedStage.phMin !== undefined) targetPhMin = matchedStage.phMin;
          if (matchedStage.phMax !== undefined) targetPhMax = matchedStage.phMax;
          if (matchedStage.ecMin !== undefined) targetEcMin = matchedStage.ecMin;
          if (matchedStage.ecMax !== undefined) targetEcMax = matchedStage.ecMax;
          if (matchedStage.waterTempMin !== undefined) targetTempMin = matchedStage.waterTempMin;
          if (matchedStage.waterTempMax !== undefined) targetTempMax = matchedStage.waterTempMax;
        }
      }

      const contextDesc = `giống ${c.name} (Lô ${batch.batchCode} - Giàn ${batch.zone?.code || 'NFT'})`;

      // 1. Đánh giá pH
      const phAlert = await this.evaluateSingleMetric({
        reservoirId,
        batchId: batch.id,
        zoneId: batch.zoneId,
        metric: 'pH',
        actualValue: data.ph,
        min: targetPhMin,
        max: targetPhMax,
        unit: 'pH',
        contextName: contextDesc,
        emergencyDelta: 1.2,
        criticalDelta: 0.4,
        lowEmergencyThreshold: 4.5,
        highEmergencyThreshold: 7.8,
        actionHigh: `Châm 150ml - 250ml axit Phosphoric (pH Down 10%) để hạ pH về mức ${((targetPhMin + targetPhMax) / 2).toFixed(1)}.`,
        actionLow: `Châm 100ml - 200ml dung dịch KOH (pH Up 10%) để nâng pH về ngưỡng thích hợp.`,
        recordedBy: data.recordedBy
      });
      if (phAlert) generatedAlerts.push(phAlert);

      // 2. Đánh giá EC
      const ecAlert = await this.evaluateSingleMetric({
        reservoirId,
        batchId: batch.id,
        zoneId: batch.zoneId,
        metric: 'EC',
        actualValue: data.ec,
        min: targetEcMin,
        max: targetEcMax,
        unit: 'mS/cm',
        contextName: contextDesc,
        emergencyDelta: 0.6,
        criticalDelta: 0.25,
        lowEmergencyThreshold: 0.8,
        highEmergencyThreshold: 3.0,
        actionHigh: `Bù thêm nước sạch để pha loãng dung dịch, hạ EC về khoảng ${targetEcMax} mS/cm tránh cháy đầu lá.`,
        actionLow: `Châm thêm dung dịch mẹ Stock A & Stock B theo tỷ lệ 1:1 để tăng nồng độ ion dinh dưỡng.`
      });
      if (ecAlert) generatedAlerts.push(ecAlert);

      // 3. Đánh giá Nhiệt độ nước
      const tempAlert = await this.evaluateSingleMetric({
        reservoirId,
        batchId: batch.id,
        zoneId: batch.zoneId,
        metric: 'Temp',
        actualValue: data.waterTemp,
        min: targetTempMin,
        max: targetTempMax,
        unit: '°C',
        contextName: contextDesc,
        emergencyDelta: 5.0,
        criticalDelta: 2.0,
        highEmergencyThreshold: 29.0,
        actionHigh: `Bật máy làm mát nước (Chiller), che lưới giảm bức xạ nhiệt để ngăn ngừa nấm bệnh Pythium thối rễ.`,
        actionLow: `Kiểm tra hệ thống sưởi hoặc tăng lưu lượng tuần hoàn máng NFT.`
      });
      if (tempAlert) generatedAlerts.push(tempAlert);

      // 4. Đánh giá Oxy hòa tan DO
      if (data.doLevel !== undefined && data.doLevel !== null) {
        const doAlert = await this.evaluateSingleMetric({
          reservoirId,
          batchId: batch.id,
          zoneId: batch.zoneId,
          metric: 'DO',
          actualValue: data.doLevel,
          min: 6.0,
          max: 9.5,
          unit: 'mg/L',
          contextName: contextDesc,
          lowEmergencyThreshold: 3.5,
          criticalDelta: 1.5,
          emergencyDelta: 2.5,
          actionLow: `Bật sục khí Venturi tăng cường hoặc kiểm tra máy sục khí đáy bể, bổ sung oxy cho rễ cây con.`
        });
        if (doAlert) generatedAlerts.push(doAlert);
      }

      // 5. Đánh giá Mực nước bể
      if (data.waterLevelPercent !== undefined && data.waterLevelPercent !== null) {
        const waterAlert = await this.evaluateSingleMetric({
          reservoirId,
          batchId: batch.id,
          zoneId: batch.zoneId,
          metric: 'WaterLevel',
          actualValue: data.waterLevelPercent,
          min: c.minWaterLevelPercent,
          max: 100.0,
          unit: '%',
          contextName: contextDesc,
          lowEmergencyThreshold: 10.0,
          criticalDelta: 10.0,
          emergencyDelta: 15.0,
          actionLow: `Mở van cấp nước sạch tự động bù nước vào bồn tuần hoàn tránh cháy bơm chìm.`
        });
        if (waterAlert) generatedAlerts.push(waterAlert);
      }
    }

    // Cập nhật giá trị đọc mới nhất cho các cảm biến liên kết
    await this.updateReservoirSensors(reservoirId, data);

    return generatedAlerts;
  }

  /**
   * Đánh giá vi khí hậu môi trường khu vực canh tác (Nhà màng)
   */
  async evaluateEnvironment(zoneId: string, data: EnvironmentEvaluationData) {
    const zone = await prisma.farmZone.findUnique({
      where: { id: zoneId },
      include: {
        batches: {
          where: { status: 'active' },
          include: { cultivar: true }
        }
      }
    });

    if (!zone) return [];

    const generatedAlerts: any[] = [];
    const activeBatch = zone.batches[0];
    const cultivar = activeBatch?.cultivar;

    const airTempMin = cultivar?.optimalAirTempMin ?? 18.0;
    const airTempMax = cultivar?.optimalAirTempMax ?? 26.0;
    const humidityMin = cultivar?.optimalHumidityMin ?? 60.0;
    const humidityMax = cultivar?.optimalHumidityMax ?? 80.0;

    const contextDesc = `Nhà màng ${zone.greenhouse} (Phân khu ${zone.code})`;

    // Đánh giá Nhiệt độ không khí
    const airAlert = await this.evaluateSingleMetric({
      reservoirId: zone.reservoirId,
      batchId: activeBatch?.id || null,
      zoneId,
      metric: 'AirTemp',
      actualValue: data.airTemp,
      min: airTempMin,
      max: airTempMax,
      unit: '°C',
      contextName: contextDesc,
      emergencyDelta: 6.0,
      criticalDelta: 3.0,
      highEmergencyThreshold: 34.0,
      actionHigh: `Kích hoạt quạt hút đối lưu và hệ thống lưới cắt nắng hạ nhiệt nhà màng.`,
      actionLow: `Đóng bớt rèm chắn gió và duy trì vi khí hậu ổn định.`
    });
    if (airAlert) generatedAlerts.push(airAlert);

    // Đánh giá Độ ẩm không khí
    const humAlert = await this.evaluateSingleMetric({
      reservoirId: zone.reservoirId,
      batchId: activeBatch?.id || null,
      zoneId,
      metric: 'Humidity',
      actualValue: data.humidity,
      min: humidityMin,
      max: humidityMax,
      unit: '%',
      contextName: contextDesc,
      emergencyDelta: 18.0,
      criticalDelta: 10.0,
      highEmergencyThreshold: 92.0,
      actionHigh: `Bật quạt thông gió giảm ẩm để phòng ngừa bào tử nấm mốc và đốm lá xà lách.`,
      actionLow: `Phun sương hạt mịn bổ sung độ ẩm trong không khí.`
    });
    if (humAlert) generatedAlerts.push(humAlert);

    return generatedAlerts;
  }

  /**
   * Đánh giá một chỉ số cụ thể: Tự động phân loại INFO/WARNING/CRITICAL/EMERGENCY,
   * Chống trùng lặp (Anti-duplication) và Tự động đóng sự cố khi an toàn (Auto-resolve)
   */
  private async evaluateSingleMetric(params: {
    reservoirId: string | null;
    batchId: string | null;
    zoneId: string | null;
    metric: string;
    actualValue: number;
    min: number;
    max: number;
    unit: string;
    contextName: string;
    emergencyDelta?: number;
    criticalDelta?: number;
    lowEmergencyThreshold?: number;
    highEmergencyThreshold?: number;
    actionHigh?: string;
    actionLow?: string;
    recordedBy?: string;
  }) {
    const {
      reservoirId,
      batchId,
      zoneId,
      metric,
      actualValue,
      min,
      max,
      unit,
      contextName,
      emergencyDelta = 1.0,
      criticalDelta = 0.4,
      lowEmergencyThreshold,
      highEmergencyThreshold,
      actionHigh,
      actionLow,
      recordedBy
    } = params;

    const isNormal = actualValue >= min && actualValue <= max;

    // Tìm cảnh báo đang mở hoặc đang tiếp nhận của chỉ số này
    const openAlert = await prisma.alert.findFirst({
      where: {
        reservoirId: reservoirId || undefined,
        batchId: batchId || undefined,
        zoneId: zoneId || undefined,
        metric,
        status: { in: ['open', 'acknowledged'] }
      }
    });

    // 1. NẾU CHỈ SỐ ĐÃ TRỞ VỀ MỨC AN TOÀN -> TỰ ĐỘNG GIẢI QUYẾT CẢNH BÁO
    if (isNormal) {
      if (openAlert) {
        const resolver = recordedBy || 'Kỹ sư Nông nghiệp (Tự động xác thực)';
        return prisma.alert.update({
          where: { id: openAlert.id },
          data: {
            status: 'resolved',
            resolvedBy: resolver,
            resolvedAt: new Date(),
            resolutionNote: `Chỉ số đo ${metric} đã trở lại ngưỡng an toàn (${actualValue} ${unit}, tiêu chuẩn: ${min} - ${max} ${unit}). Đã xác nhận bởi: ${resolver}.`
          }
        });
      }
      return null;
    }

    // 2. NẾU VI PHẠM NGƯỠNG -> XÁC ĐỊNH MỨC ĐỘ NGHIÊM TRỌNG VÀ NGUY CƠ
    let severity: 'emergency' | 'critical' | 'warning' = 'warning';
    let title = '';
    let message = '';
    let suggestedAction = '';
    let thresholdValue = min;

    const isHigh = actualValue > max;
    const isLow = actualValue < min;

    if (isHigh) {
      thresholdValue = max;
      const delta = actualValue - max;

      if ((highEmergencyThreshold && actualValue >= highEmergencyThreshold) || delta >= emergencyDelta) {
        severity = 'emergency';
        title = `KHẨN CẤP: ${metric} vượt mức nguy hiểm (${actualValue} ${unit})`;
      } else if (delta >= criticalDelta) {
        severity = 'critical';
        title = `Cảnh báo nghiêm trọng: ${metric} quá cao (${actualValue} ${unit})`;
      } else {
        severity = 'warning';
        title = `Cảnh báo: ${metric} cao hơn ngưỡng tiêu chuẩn (${actualValue} ${unit})`;
      }

      message = `${metric} ghi nhận ${actualValue} ${unit} cao hơn ngưỡng tối đa cho phép (${max} ${unit}) tại ${contextName}.`;
      suggestedAction = actionHigh || `Kiểm tra và hiệu chỉnh giảm ${metric} về dải ${min} - ${max} ${unit}.`;
    } else if (isLow) {
      thresholdValue = min;
      const delta = min - actualValue;

      if ((lowEmergencyThreshold && actualValue <= lowEmergencyThreshold) || delta >= emergencyDelta) {
        severity = 'emergency';
        title = `KHẨN CẤP: ${metric} sụt giảm nghiêm trọng (${actualValue} ${unit})`;
      } else if (delta >= criticalDelta) {
        severity = 'critical';
        title = `Cảnh báo nghiêm trọng: ${metric} thấp (${actualValue} ${unit})`;
      } else {
        severity = 'warning';
        title = `Cảnh báo: ${metric} thấp hơn ngưỡng tiêu chuẩn (${actualValue} ${unit})`;
      }

      message = `${metric} ghi nhận ${actualValue} ${unit} thấp hơn ngưỡng tối thiểu khuyến nghị (${min} ${unit}) tại ${contextName}.`;
      suggestedAction = actionLow || `Kiểm tra và bổ sung ${metric} lên dải ${min} - ${max} ${unit}.`;
    }

    // 3. CHỐNG TRÙNG LẶP: Nếu đã có cảnh báo đang mở thì cập nhật số đo thực tế và leo thang mức độ nếu nghiêm trọng hơn
    if (openAlert) {
      // Nếu mức độ mới nghiêm trọng hơn mức độ cũ, leo thang severity
      const severityRank = { emergency: 3, critical: 2, warning: 1, info: 0 };
      const newRank = severityRank[severity] || 1;
      const oldRank = severityRank[openAlert.severity as keyof typeof severityRank] || 1;
      const finalSeverity = newRank > oldRank ? severity : openAlert.severity;

      return prisma.alert.update({
        where: { id: openAlert.id },
        data: {
          severity: finalSeverity,
          actualValue,
          thresholdValue,
          title,
          message,
          suggestedAction,
          updatedAt: new Date()
        }
      });
    }

    // Tạo mới cảnh báo nếu chưa tồn tại
    return prisma.alert.create({
      data: {
        severity,
        status: 'open',
        metric,
        title,
        message,
        suggestedAction,
        thresholdValue,
        actualValue,
        unit,
        reservoirId,
        batchId,
        zoneId
      }
    });
  }

  /**
   * Cập nhật chỉ số cho các cảm biến vật lý / IoT thuộc bồn
   */
  private async updateReservoirSensors(reservoirId: string, data: WaterEvaluationData) {
    const now = new Date();

    if (data.ph !== undefined) {
      await prisma.sensor.updateMany({
        where: { reservoirId, sensorType: 'ph' },
        data: { lastReading: data.ph, lastSeenAt: now, status: 'online' }
      }).catch(() => {});
    }

    if (data.ec !== undefined) {
      await prisma.sensor.updateMany({
        where: { reservoirId, sensorType: 'ec' },
        data: { lastReading: data.ec, lastSeenAt: now, status: 'online' }
      }).catch(() => {});
    }

    if (data.waterTemp !== undefined) {
      await prisma.sensor.updateMany({
        where: { reservoirId, sensorType: 'water_temp' },
        data: { lastReading: data.waterTemp, lastSeenAt: now, status: 'online' }
      }).catch(() => {});
    }

    if (data.doLevel !== undefined && data.doLevel !== null) {
      await prisma.sensor.updateMany({
        where: { reservoirId, sensorType: 'do' },
        data: { lastReading: data.doLevel, lastSeenAt: now, status: 'online' }
      }).catch(() => {});
    }

    if (data.waterLevelPercent !== undefined && data.waterLevelPercent !== null) {
      await prisma.sensor.updateMany({
        where: { reservoirId, sensorType: 'water_level' },
        data: { lastReading: data.waterLevelPercent, lastSeenAt: now, status: 'online' }
      }).catch(() => {});
    }
  }

  /**
   * Giải quyết tự động tất cả cảnh báo khi kết thúc chu kỳ hoặc thu hoạch lô
   */
  async resolveBatchAlerts(batchId: string, reason: string) {
    return prisma.alert.updateMany({
      where: {
        batchId,
        status: { in: ['open', 'acknowledged'] }
      },
      data: {
        status: 'resolved',
        resolvedBy: 'Hệ thống tự động',
        resolvedAt: new Date(),
        resolutionNote: `Tự động đóng sự cố do lô canh tác đã kết thúc: ${reason}`
      }
    });
  }
}

export const alertEngine = new AlertEngineService();
