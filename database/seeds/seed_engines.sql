-- ============================================================
-- seed_engines.sql
-- ============================================================
-- Datos semilla: Motores de ejemplo para desarrollo.
-- ============================================================

INSERT INTO engines (engine_id, name, type, location, status, total_cycles) VALUES
('ENG-001', 'Turbofan Motor A1', 'turbofan', 'Línea 1 - Planta Saltillo', 'healthy', 150),
('ENG-002', 'Turbofan Motor A2', 'turbofan', 'Línea 1 - Planta Saltillo', 'warning', 280),
('ENG-003', 'Turbofan Motor B1', 'turbofan', 'Línea 2 - Planta Saltillo', 'healthy', 95),
('ENG-004', 'Turbofan Motor B2', 'turbofan', 'Línea 2 - Planta Saltillo', 'critical', 340),
('ENG-005', 'Turbofan Motor C1', 'turbofan', 'Línea 3 - Planta Ramos', 'maintenance', 200),
('ENG-006', 'Turbofan Motor C2', 'turbofan', 'Línea 3 - Planta Ramos', 'healthy', 50),
('ENG-007', 'Turbofan Motor D1', 'turbofan', 'Línea 4 - Planta Ramos', 'warning', 310),
('ENG-008', 'Turbofan Motor D2', 'turbofan', 'Línea 4 - Planta Ramos', 'healthy', 120);
