const express = require('express');
const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Base de Conocimiento de Turbofan (RAG Knowledge Base)
// Basada en manuales CFM56-7B / LEAP-1B y documentacion CMMS aeronautica.
// ─────────────────────────────────────────────────────────────────────────────
const TURBOFAN_KB = {
    // Sensores y su significado fisico
    sensor_definitions: {
        sensor_2:  { name: 'Temperatura total a la entrada de la LPC (T2)', unit: '°R', nominal: '491–560', critical: '>580', desc: 'Temperatura del aire en la entrada del compresor de baja presion. Un valor elevado indica restriccion en las entradas de aire o condiciones atmosfericas anomalas.' },
        sensor_3:  { name: 'Temperatura total a la salida de la HPC (T30)', unit: '°R', nominal: '600–630', critical: '>650', desc: 'Temperatura del aire comprimido antes de entrar a la camara de combustion. Es el sensor mas critico para detectar degradacion del compresor de alta presion (HPC). Valores altos pueden indicar fouling o erosion de alabes.' },
        sensor_4:  { name: 'Temperatura total a la salida de la LPT (T50)', unit: '°R', nominal: '490–520', critical: '>540', desc: 'Temperatura de los gases de escape despues de pasar por la turbina de baja presion. Refleja la eficiencia de expansion de la turbina.' },
        sensor_7:  { name: 'Presion total a la salida de la HPC (P30)', unit: 'psia', nominal: '550–558', critical: '<530', desc: 'Presion del flujo de aire comprimido. Una caida de presion indica perdida de eficiencia del HPC, posiblemente por dano en sellos o alabes.' },
        sensor_9:  { name: 'Velocidad fisica del nucleo (Nf)', unit: 'rpm', nominal: '9000–9100', critical: '<8800', desc: 'Velocidad de rotacion del nucleo del motor (eje de alta presion N2). Caidas indican perdida de potencia o problemas en la camara de combustion.' },
        sensor_11: { name: 'Presion estatica del HPC (Ps30)', unit: 'psia', nominal: '47–48', critical: '<44', desc: 'Presion estatica medida en el difusor del HPC. Junto con P30 se calcula la eficiencia politropica del compresor.' },
        sensor_14: { name: 'Velocidad corregida del nucleo (NRc)', unit: 'rpm', nominal: '8100–8200', critical: '<7800', desc: 'Velocidad del nucleo corregida por temperatura de entrada. Parametro clave para el performance deck del motor.' },
        sensor_15: { name: 'Relacion de bypass (BPR)', unit: 'adimensional', nominal: '8.4–8.5', critical: '<8.0', desc: 'Flujo de aire que bypasea el nucleo vs flujo que pasa por el. Motores turbofan modernos tienen BPR de 8-12. Un valor bajo indica problemas en el fan o sus alabes.' },
        sensor_17: { name: 'Entalpia de sangrado (hbleed)', unit: 'BTU/lb', nominal: 'variable', critical: 'anomalia', desc: 'Calor extraido del flujo del compresor para uso en anti-hielo, cabina y otros sistemas. Cambios bruscos pueden indicar una valvula de sangrado atascada.' },
        sensor_20: { name: 'Flujo de refrigeracion HPT (W31)', unit: 'lb/s', nominal: '11–13', critical: '<10', desc: 'Flujo de aire de refrigeracion de la turbina de alta presion (HPT). Crucial para proteger los alabes de las temperaturas extremas de la camara de combustion.' },
        sensor_21: { name: 'Flujo de refrigeracion LPT (W32)', unit: 'lb/s', nominal: '8–10', critical: '<7', desc: 'Flujo de aire de refrigeracion de la turbina de baja presion. Su reduccion puede indicar obstrucciones en los canales de refrigeracion.' },
    },

    // Procedimientos de mantenimiento estandar
    procedures: {
        borescope: `
**Inspeccion Borescope del HPC (Procedimiento CMMS-HPC-001)**

Frecuencia recomendada: cada 3000 ciclos o si sensor_3 supera el umbral critico.

Pasos:
1. Asegurar que el motor este frio (minimo 4 horas post-apagado).
2. Acceder por los puertos de inspeccion en los stages 2, 4, 6 y 9 del HPC.
3. Verificar estado de alabes: buscar erosion, dano por objeto extraño (FOD), grietas en raices.
4. Inspeccionar recubrimientos abrasivos del casing (shroud).
5. Documentar hallazgos con fotografia endoscopica y comparar con limites del SRM (Structural Repair Manual).
6. Si se detecta dano en mas del 15% de los alabes de un stage, programar apertura de motor.
        `,
        oil_analysis: `
**Analisis de Aceite del Motor (Procedimiento CMMS-OIL-002)**

Se realiza cada 500 horas o ante vibraciones anormales.

Pasos:
1. Extraer muestra de 100ml del sistema de aceite principal durante shutdown caliente.
2. Enviar al laboratorio para analisis espectrometrico (SOAP: Spectrometric Oil Analysis Program).
3. Verificar presencia de metales: Fe (acero), Cu (bronce), Ag (plateado), Al (aluminio), Si (silicona/sellos).
4. Niveles de alarma: Fe >50ppm, Cu >20ppm por encima de baseline.
5. Complementar con lectura del chip detector de particulas magneticas.
        `,
        performance_trending: `
**Tendencia de Performance del Motor (EGT Margin Monitoring)**

EGT Margin = diferencia entre EGT limite y EGT en condicion de referencia (takeoff, ISA, SL).

Interpretacion:
- Margen >50°C: Motor en buen estado
- Margen 30-50°C: Monitoreo estrecho, planear work scope en proximo taller
- Margen <30°C: Accion correctiva requerida, consultar MCC (Maintenance Control Center)
- Margen <10°C: Retirar del servicio, programar shop visit inmediato

La tasa de degradacion tipica es de 1-2°C por 100 ciclos en condiciones normales.
        `,
        compressor_wash: `
**Lavado del Compresor (Water Wash)**

Recomendado si sensor_3 (T30) supera baseline en >3% o cada 300 ciclos en ambientes salinos/contaminados.

Tipos:
- Crank wash (en tierra, motor girado sin ignicion): maxima efectividad de limpieza
- Online wash (en vuelo, a bajos regimenes): mantenimiento preventivo rutinario

Efecto esperado: reduccion de 5-15°C en EGT, recuperacion de 0.3-0.8% de eficiencia SFC.
        `
    },

    // Codigos de alerta y su interpretacion
    alert_codes: {
        'P50_HIGH': { meaning: 'Temperatura de gases de escape (EGT) elevada', cause: 'Degradacion HPC, problemas en combustion, valvulas de sangrado mal calibradas', action: 'Iniciar tendencia de EGT, revisar sensor_3 y sensor_4, considerar water wash' },
        'NF_LOW':   { meaning: 'Velocidad de fan baja', cause: 'Dano en alabes del fan (FOD), problema en FADEC, desequilibrio rotacional', action: 'Inspeccion visual del fan, verificar parametros FADEC, chequeo de vibracion N1' },
        'OIL_CHIP': { meaning: 'Deteccion de particulas metalicas en aceite', cause: 'Dano en rodamientos, engranajes o sellos internos', action: 'SOAP inmediato, no operar hasta obtener resultados, posible shop visit' },
        'HPC_STALL': { meaning: 'Surge/Stall del compresor de alta presion', cause: 'Contaminacion de alabes, operacion fuera de envelop, falla en actuador VBV', action: 'Revision urgente del HPC, inspeccion borescope prioritaria, check del sistema de control de sangrado' }
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Base de Conocimiento en Ingles (English RAG KB)
// ─────────────────────────────────────────────────────────────────────────────
const TURBOFAN_KB_EN = {
    procedures: {
        borescope: `
**HPC Borescope Inspection (CMMS-HPC-001)**

Recommended frequency: every 3000 cycles or if sensor_3 exceeds critical threshold.

Steps:
1. Ensure engine is cool (minimum 4 hours post-shutdown).
2. Access via inspection ports on HPC stages 2, 4, 6, and 9.
3. Check blade condition: look for erosion, foreign object damage (FOD), root cracks.
4. Inspect abrasive case coatings (shroud).
5. Document findings with endoscopic photos and compare with SRM limits.
6. If >15% of blades in a stage are damaged, schedule engine shop visit.
        `,
        oil_analysis: `
**Engine Oil Analysis (CMMS-OIL-002)**

Performed every 500 hours or due to abnormal vibrations.

Steps:
1. Extract 100ml sample from main oil system during hot shutdown.
2. Send to lab for SOAP (Spectrometric Oil Analysis Program).
3. Check for metals: Fe (steel), Cu (bronze), Ag (silver), Al (aluminum), Si (silicon).
4. Alarm levels: Fe >50ppm, Cu >20ppm above baseline.
        `,
        compressor_wash: `
**Compressor Water Wash**

Recommended if sensor_3 (T30) exceeds baseline by >3% or every 300 cycles in saline environments.
Expected effect: 5-15°C EGT reduction, 0.3-0.8% SFC recovery.
        `
    },
    alert_codes: {
        'P50_HIGH': { meaning: 'Elevated Exhaust Gas Temperature (EGT)', cause: 'HPC degradation, combustion issues, miscalibrated bleed valves', action: 'Start EGT trending, check sensor_3 and sensor_4, consider water wash' },
        'HPC_STALL': { meaning: 'High Pressure Compressor Surge/Stall', cause: 'Blade contamination, out of envelope operation, VBV actuator failure', action: 'Urgent HPC review, priority borescope inspection, check bleed control system' },
        'OIL_CHIP': { meaning: 'Magnetic chip detector alert (metal in oil)', cause: 'Bearing, gear or seal damage', action: 'Immediate SOAP analysis, do not operate until results, possible shop visit' }
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Motor RAG mejorado
// ─────────────────────────────────────────────────────────────────────────────
function buildRagResponse(message, context, lang) {
    if (lang === 'en') {
        return buildRagResponseEN(message, context);
    }
    const msgL = message.toLowerCase();

    // --- Saludo / Identificacion ---
    if (msgL.match(/^(hola|hello|hi|hey|buenos|buenas|quie[nr]|who are)/)) {
        return `hola, soy el **ai maintenance copilot** del sistema predictivo. tengo acceso a la base de conocimiento de motores turbofan CFM56/LEAP y a la telemetria en tiempo real del motor **${context?.engineName || 'seleccionado'}**. preguntame sobre el estado del motor, sensores especificos, procedimientos de mantenimiento o por que el modelo hizo una prediccion.`;
    }

    // --- Pregunta sobre un sensor especifico (ej: "que es el sensor 3", "sensor_11") ---
    for (const [key, def] of Object.entries(TURBOFAN_KB.sensor_definitions)) {
        const sensorNum = key.replace('sensor_', '');
        if (msgL.includes(key) || msgL.includes(`sensor ${sensorNum}`)) {
            const currentVal = context?.sensorData?.[key] || context?.[key];
            let valueStr = currentVal ? `\n\n**valor actual:** ${parseFloat(currentVal).toFixed(2)} ${def.unit} (nominal: ${def.nominal})` : '';
            
            const shapImpact = context?.shap_values?.[key];
            let shapStr = '';
            if (shapImpact !== undefined) {
                const sign = shapImpact > 0 ? '+' : '';
                shapStr = `\n**impacto SHAP en RUL:** ${sign}${shapImpact.toFixed(2)} ciclos ${shapImpact > 0 ? '(positivo)' : '(negativo — restando vida util)'}`;
            }

            return `**${def.name}**\n\n${def.desc}${valueStr}${shapStr}\n\n**umbral critico:** ${def.critical}`;
        }
    }

    // --- Procedimientos de mantenimiento ---
    if (msgL.includes('borescope') || msgL.includes('borescopio') || msgL.includes('inspeccion hpc') || msgL.includes('inspection')) {
        return TURBOFAN_KB.procedures.borescope.trim();
    }

    if (msgL.includes('aceite') || msgL.includes('oil') || msgL.includes('soap') || msgL.includes('lubric')) {
        return TURBOFAN_KB.procedures.oil_analysis.trim();
    }

    if (msgL.includes('lavado') || msgL.includes('water wash') || msgL.includes('compressor wash') || msgL.includes('wash')) {
        return TURBOFAN_KB.procedures.compressor_wash.trim();
    }

    if (msgL.includes('egt') || msgL.includes('tendencia') || msgL.includes('performance') || msgL.includes('margen')) {
        return TURBOFAN_KB.procedures.performance_trending.trim();
    }

    // --- Codigos de alerta ---
    if (msgL.includes('p50') || msgL.includes('egt alto') || msgL.includes('temperatura alta')) {
        const code = TURBOFAN_KB.alert_codes['P50_HIGH'];
        return `**alerta P50_HIGH — ${code.meaning}**\n\n**causa probable:** ${code.cause}\n\n**accion recomendada:** ${code.action}`;
    }

    if (msgL.includes('stall') || msgL.includes('surge') || msgL.includes('hpc stall') || msgL.includes('compresor')) {
        const code = TURBOFAN_KB.alert_codes['HPC_STALL'];
        return `**alerta HPC_STALL — ${code.meaning}**\n\n**causa probable:** ${code.cause}\n\n**accion recomendada:** ${code.action}`;
    }

    if (msgL.includes('chip') || msgL.includes('particulas') || msgL.includes('metal') || msgL.includes('rodamiento')) {
        const code = TURBOFAN_KB.alert_codes['OIL_CHIP'];
        return `**alerta OIL_CHIP — ${code.meaning}**\n\n**causa probable:** ${code.cause}\n\n**accion recomendada:** ${code.action}`;
    }

    // --- Estado general del motor ---
    if (msgL.match(/estado|status|resumen|summary|como esta|como va|como est/)) {
        const rul = context?.last_prediction_rul;
        const isAnomaly = context?.multivariate_anomaly || false;
        const shap = context?.shap_values || {};
        
        let response = `**resumen de telemetria — ${context?.engineName || 'motor'}**\n\n`;
        
        if (rul !== undefined) {
            response += `- **vida util restante (RUL):** ${rul} ciclos`;
            if (rul <= 15)       response += ` — **critico. accion inmediata requerida.**`;
            else if (rul <= 30)  response += ` — advertencia, planificar intervencion proxima.`;
            else if (rul <= 60)  response += ` — precaucion, monitoreo estrecho recomendado.`;
            else                 response += ` — nivel saludable.`;
            response += '\n';
        }

        if (isAnomaly) {
            response += `- **isolation forest:** anomalia multivariante detectada. el patron de sensores actual no fue visto durante el entrenamiento. recomiendo inspeccion fisica.\n`;
        } else {
            response += `- **isolation forest:** comportamiento dentro del envelope de vuelo historico.\n`;
        }

        // Top sensor by SHAP impact
        if (Object.keys(shap).length > 0) {
            const worstEntry = Object.entries(shap).sort((a, b) => a[1] - b[1])[0];
            if (worstEntry && worstEntry[1] < 0) {
                const sensorDef = TURBOFAN_KB.sensor_definitions[worstEntry[0]];
                const sensorName = sensorDef ? sensorDef.name : worstEntry[0];
                response += `- **sensor mas critico (SHAP):** ${sensorName} con impacto de ${worstEntry[1].toFixed(2)} ciclos en el RUL.\n`;
            }
        }

        response += `\npuedes preguntarme sobre sensores especificos, procedimientos borescope, analisis de aceite o por que el modelo tomo esta decision.`;
        return response;
    }

    // --- Por que / SHAP / factores ---
    if (msgL.match(/por qu[eé]|porque|shap|factores|sensores critic|why|drivers|causa|degrada/)) {
        const shap = context?.shap_values || {};
        if (Object.keys(shap).length === 0) {
            return 'no tengo datos SHAP para este motor en este momento. el motor puede no haber generado una prediccion reciente con el modelo XGBoost. espera al siguiente ciclo de telemetria.';
        }

        const entries = Object.entries(shap).sort((a, b) => a[1] - b[1]);
        const worst = entries.slice(0, 3).filter(s => s[1] < 0);
        const best  = entries.slice(-3).reverse().filter(s => s[1] > 0);

        let response = `basado en el modelo de **ia explicable (shap)**, aqui esta por que el motor tiene una vida util de ${context?.last_prediction_rul || '?'} ciclos:\n\n`;

        if (worst.length > 0) {
            response += `**factores que reducen vida util:**\n`;
            worst.forEach(([key, val]) => {
                const def = TURBOFAN_KB.sensor_definitions[key];
                const name = def ? def.name : key;
                response += `- ${name}: impacto de **${val.toFixed(2)} ciclos** (degradando)\n`;
            });
        }

        if (best.length > 0) {
            response += `\n**factores que aportan estabilidad:**\n`;
            best.forEach(([key, val]) => {
                const def = TURBOFAN_KB.sensor_definitions[key];
                const name = def ? def.name : key;
                response += `- ${name}: +${val.toFixed(2)} ciclos (estabilizando)\n`;
            });
        }

        return response;
    }

    // --- Recomendaciones de mantenimiento ---
    if (msgL.match(/recomiend|que hago|que hacer|maintenance|mantenimiento|accion|siguiente paso/)) {
        const rul = context?.last_prediction_rul;
        const isAnomaly = context?.multivariate_anomaly || false;

        if (rul <= 15 || isAnomaly) {
            return `**recomendacion urgente (nivel 1):**\nel motor esta en estado critico (RUL: ${rul} ciclos${isAnomaly ? ' + anomalia detectada' : ''}). acciones recomendadas por el manual:\n\n1. crear orden de trabajo de inspeccion en el calendario de mantenimiento\n2. ejecutar inspeccion borescope del hpc (ver procedimiento CMMS-HPC-001)\n3. tomar muestra de aceite para analisis SOAP\n4. revisar historico de vibraciones N1/N2\n5. si el margen egt es <30°C, programar shop visit`;
        } else if (rul <= 30) {
            return `**recomendacion preventiva (nivel 2):**\nel motor entrara en zona critica en aproximadamente ${rul - 15} ciclos. acciones sugeridas:\n\n1. programar water wash del compresor para recuperar eficiencia\n2. iniciar tendencia de egt para calcular degradacion semanal\n3. agendar borescope en proximo slot de hangar disponible\n4. verificar que el aceite este dentro de especificaciones`;
        } else if (rul <= 60) {
            return `**monitoreo estrecho (nivel 3):**\nel motor esta en rango de precaucion (${rul} ciclos). sugerencias:\n\n1. incrementar frecuencia de lectura de tendencia de performance\n2. considerar water wash si t30 (sensor_3) esta por encima de baseline\n3. verificar proxima inspeccion programada en el calendario`;
        } else {
            return `**motor en buen estado:**\ncon ${rul} ciclos de vida util restante, no hay acciones urgentes requeridas. continuar con plan de mantenimiento preventivo programado y monitoreo de tendencias.`;
        }
    }

    // --- Fallback tecnico (contexto-aware) ---
    const rul = context?.last_prediction_rul;
    return `he analizado tu consulta. el motor **${context?.engineName || ''}** tiene actualmente **${rul ?? 'desconocidos'} ciclos** de vida util restante.\n\npuedes preguntarme cosas como:\n- "estado general"\n- "por que falla"\n- "que es el sensor 3"\n- "procedimiento borescope"\n- "que recomiendas hacer"\n- "analisis de aceite"`;
}

// ─────────────────────────────────────────────────────────────────────────────
// English RAG Logic
// ─────────────────────────────────────────────────────────────────────────────
function buildRagResponseEN(message, context) {
    const msgL = message.toLowerCase();

    // Greeting
    if (msgL.match(/^(hello|hi|hey|who are)/)) {
        return `hello, I am the **ai maintenance copilot**. I have access to the CFM56/LEAP turbofan knowledge base and real-time telemetry for engine **${context?.engineName || 'selected'}**. Ask me about the engine status, specific sensors, maintenance procedures, or why the model made a prediction.`;
    }

    // Procedures
    if (msgL.includes('borescope') || msgL.includes('inspection')) {
        return TURBOFAN_KB_EN.procedures.borescope.trim();
    }
    if (msgL.includes('oil') || msgL.includes('soap') || msgL.includes('lubric')) {
        return TURBOFAN_KB_EN.procedures.oil_analysis.trim();
    }
    if (msgL.includes('wash') || msgL.includes('clean')) {
        return TURBOFAN_KB_EN.procedures.compressor_wash.trim();
    }

    // Alerts
    if (msgL.includes('p50') || msgL.includes('high egt')) {
        const code = TURBOFAN_KB_EN.alert_codes['P50_HIGH'];
        return `**Alert P50_HIGH — ${code.meaning}**\n\n**Probable cause:** ${code.cause}\n\n**Recommended action:** ${code.action}`;
    }

    // Status
    if (msgL.match(/status|summary|how is/)) {
        const rul = context?.last_prediction_rul;
        const isAnomaly = context?.multivariate_anomaly || false;
        const shap = context?.shap_values || {};
        
        let response = `**telemetry summary — ${context?.engineName || 'engine'}**\n\n`;
        
        if (rul !== undefined) {
            response += `- **remaining useful life (RUL):** ${rul} cycles`;
            if (rul <= 15)       response += ` — **critical. immediate action required.**`;
            else if (rul <= 30)  response += ` — warning, plan intervention soon.`;
            else if (rul <= 60)  response += ` — caution, strict monitoring recommended.`;
            else                 response += ` — healthy level.`;
            response += '\n';
        }

        if (isAnomaly) {
            response += `- **isolation forest:** multivariate anomaly detected. current sensor pattern was not seen during training. recommend physical inspection.\n`;
        } else {
            response += `- **isolation forest:** behavior is within historical flight envelope.\n`;
        }

        if (Object.keys(shap).length > 0) {
            const worstEntry = Object.entries(shap).sort((a, b) => a[1] - b[1])[0];
            if (worstEntry && worstEntry[1] < 0) {
                response += `- **most critical sensor (SHAP):** ${worstEntry[0]} impacting RUL by ${worstEntry[1].toFixed(2)} cycles.\n`;
            }
        }

        response += `\nyou can ask me about specific procedures, oil analysis, or why the model made this decision.`;
        return response;
    }

    // SHAP
    if (msgL.match(/why|shap|factors|critical|cause|degrading/)) {
        const shap = context?.shap_values || {};
        if (Object.keys(shap).length === 0) {
            return 'I do not have SHAP data for this engine at the moment. Wait for the next telemetry cycle.';
        }

        const entries = Object.entries(shap).sort((a, b) => a[1] - b[1]);
        const worst = entries.slice(0, 3).filter(s => s[1] < 0);
        const best  = entries.slice(-3).reverse().filter(s => s[1] > 0);

        let response = `Based on the **explainable AI (SHAP)** model, here is why the engine has an RUL of ${context?.last_prediction_rul || '?'} cycles:\n\n`;

        if (worst.length > 0) {
            response += `**factors reducing useful life:**\n`;
            worst.forEach(([key, val]) => {
                response += `- ${key}: impact of **${val.toFixed(2)} cycles** (degrading)\n`;
            });
        }
        return response;
    }

    // Recommendation
    if (msgL.match(/recommend|what to do|action|next step|maintenance/)) {
        const rul = context?.last_prediction_rul;
        const isAnomaly = context?.multivariate_anomaly || false;

        if (rul <= 15 || isAnomaly) {
            return `**urgent recommendation (level 1):**\nThe engine is in critical state (RUL: ${rul} cycles${isAnomaly ? ' + anomaly detected' : ''}). Actions:\n\n1. create inspection work order\n2. execute HPC borescope inspection (CMMS-HPC-001)\n3. take oil sample for SOAP analysis\n4. review N1/N2 vibration history`;
        } else if (rul <= 30) {
            return `**preventive recommendation (level 2):**\nThe engine will enter critical zone in approx ${rul - 15} cycles. Suggested actions:\n\n1. schedule compressor water wash\n2. start EGT trending\n3. schedule borescope in next hangar slot`;
        } else {
            return `**engine in good condition:**\nWith ${rul} cycles remaining, no urgent actions required. Continue with scheduled preventive maintenance.`;
        }
    }

    const rul = context?.last_prediction_rul;
    return `I have analyzed your request. Engine **${context?.engineName || ''}** currently has **${rul ?? 'unknown'} cycles** of remaining useful life.\n\nYou can ask me things like:\n- "general status"\n- "why is it failing"\n- "borescope procedure"\n- "what do you recommend"\n- "oil analysis"`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Endpoint principal del chat
// ─────────────────────────────────────────────────────────────────────────────
router.post('/ask', async (req, res) => {
    try {
        const { message, context, language } = req.body;
        if (!message) return res.status(400).json({ error: 'message es requerido' });

        // Simular latencia de inferencia LLM para realismo
        const delay = 800 + Math.random() * 900;
        await new Promise(resolve => setTimeout(resolve, delay));

        const responseText = buildRagResponse(message, context, language);
        res.json({ response: responseText });

    } catch (error) {
        console.error('Error in chat API:', error);
        res.status(500).json({ error: 'Failed to process AI response' });
    }
});

module.exports = router;
