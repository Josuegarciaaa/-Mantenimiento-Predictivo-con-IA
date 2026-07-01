function predictRUL(sensorReading, totalCycles) {
    const s3 = sensorReading.sensor_3 || 1580;
    const s4 = sensorReading.sensor_4 || 1400;
    const s9 = sensorReading.sensor_9 || 9040;
    const s11 = sensorReading.sensor_11 || 47;
    const s14 = sensorReading.sensor_14 || 8130;
    const s15 = sensorReading.sensor_15 || 8.41;

    const tempScore = Math.max(0, (1620 - s3) / 50);
    const coreScore = Math.max(0, (9100 - s9) / 80);
    const pressureScore = Math.max(0, (49 - s11) / 4);

    const rawRUL = (tempScore * 40 + coreScore * 35 + pressureScore * 25);
    const cycleAdjust = Math.max(0, 1 - totalCycles / 400);
    let predictedRUL = Math.round(rawRUL * cycleAdjust);
    predictedRUL = Math.max(0, Math.min(125, predictedRUL));

    const noise = (Math.random() - 0.5) * 4;
    predictedRUL = Math.max(0, Math.min(125, Math.round(predictedRUL + noise)));

    let riskLevel;
    if (predictedRUL <= 15) riskLevel = 'critical';
    else if (predictedRUL <= 30) riskLevel = 'high';
    else if (predictedRUL <= 50) riskLevel = 'medium';
    else riskLevel = 'low';

    const baseConfidence = 0.82;
    const confidenceBoost = Math.min(0.12, totalCycles / 3000);
    const confidence = Math.round((baseConfidence + confidenceBoost + (Math.random() - 0.5) * 0.06) * 100) / 100;

    return {
        predicted_rul: predictedRUL,
        confidence: Math.max(0.7, Math.min(0.98, confidence)),
        risk_level: riskLevel,
        model_version: 'rf_v1.0_sim'
    };
}

function classifyRiskLevel(rul) {
    if (rul <= 15) return 'critical';
    if (rul <= 30) return 'high';
    if (rul <= 50) return 'medium';
    return 'low';
}

module.exports = { predictRUL, classifyRiskLevel };
