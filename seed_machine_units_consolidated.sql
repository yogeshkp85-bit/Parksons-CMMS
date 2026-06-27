-- ============================================================
-- PARKSONS CMMS — COMPLETE MACHINE UNITS SEED DATA
-- Single consolidated file (Part 1 + Part 2 + Form.html gap-fill)
--
-- Run this AFTER running the Plant, Dept, Machine Type, and Machine
-- seed scripts. Covers every machine (IDs 1..81) in the architecture.
--
-- Source of truth for unit lists: Form.html (MACHINES object)
-- ============================================================

BEGIN;

-- ============================================================
-- PRINTING DEPARTMENT (Machines 1 to 13)
-- ============================================================

-- 1. PrintKBA1
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 1, 1), ('PU1', 'Printing Unit 1', 1, 2), ('PU2', 'Printing Unit 2', 1, 3), ('PU3', 'Printing Unit 3', 1, 4), ('PU4', 'Printing Unit 4', 1, 5), ('PU5', 'Printing Unit 5', 1, 6), ('PU6', 'Printing Unit 6', 1, 7), ('COATING', 'Coating', 1, 8), ('UV_IR', 'UV lights / IR light', 1, 9), ('DELIVERY', 'Delivery', 1, 10), ('TECHNOTRANS', 'Technotrans', 1, 11), ('COMPRESSOR', 'Compressor', 1, 12);

-- 2. PrintKBA2
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 2, 1), ('PU1', 'Printing Unit 1', 2, 2), ('PU2', 'Printing Unit 2', 2, 3), ('PU3', 'Printing Unit 3', 2, 4), ('PU4', 'Printing Unit 4', 2, 5), ('PU5', 'Printing Unit 5', 2, 6), ('PU6', 'Printing Unit 6', 2, 7), ('COATING', 'Coating', 2, 8), ('UV_IR', 'UV lights / IR light', 2, 9), ('DELIVERY', 'Delivery', 2, 10), ('TECHNOTRANS', 'Technotrans', 2, 11), ('COMPRESSOR', 'Compressor', 2, 12);

-- 3. PrintKBA3
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 3, 1), ('PU1', 'Printing Unit 1', 3, 2), ('PU2', 'Printing Unit 2', 3, 3), ('PU3', 'Printing Unit 3', 3, 4), ('PU4', 'Printing Unit 4', 3, 5), ('PU5', 'Printing Unit 5', 3, 6), ('PU6', 'Printing Unit 6', 3, 7), ('PU7', 'Printing Unit 7', 3, 8), ('COATING', 'Coating', 3, 9), ('UV_IR', 'UV lights / IR light', 3, 10), ('DELIVERY', 'Delivery', 3, 11), ('TECHNOTRANS', 'Technotrans', 3, 12), ('COMPRESSOR', 'Compressor', 3, 13);

-- 4. HeidelbergCX1
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 4, 1), ('PU1', 'Printing Unit 1', 4, 2), ('PU2', 'Printing Unit 2', 4, 3), ('PU3', 'Printing Unit 3', 4, 4), ('PU4', 'Printing Unit 4', 4, 5), ('PU5', 'Printing Unit 5', 4, 6), ('PU6', 'Printing Unit 6', 4, 7), ('PU7', 'Printing Unit 7', 4, 8), ('COATING', 'Coating', 4, 9), ('UV_IR', 'UV lights / IR light', 4, 10), ('DELIVERY', 'Delivery', 4, 11), ('TECHNOTRANS', 'Technotrans', 4, 12), ('COMPRESSOR', 'Compressor', 4, 13);

-- 5. HeidelbergCX2
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 5, 1), ('PU1', 'Printing Unit 1', 5, 2), ('PU2', 'Printing Unit 2', 5, 3), ('PU3', 'Printing Unit 3', 5, 4), ('PU4', 'Printing Unit 4', 5, 5), ('PU5', 'Printing Unit 5', 5, 6), ('PU6', 'Printing Unit 6', 5, 7), ('PU7', 'Printing Unit 7', 5, 8), ('COATING', 'Coating', 5, 9), ('UV_IR', 'UV lights / IR light', 5, 10), ('DELIVERY', 'Delivery', 5, 11), ('TECHNOTRANS', 'Technotrans', 5, 12), ('COMPRESSOR', 'Compressor', 5, 13);

-- 6. Roland
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 6, 1), ('PU1', 'Printing Unit 1', 6, 2), ('PU2', 'Printing Unit 2', 6, 3), ('COATING', 'Coating', 6, 4), ('UV_IR', 'UV lights / IR light', 6, 5), ('DELIVERY', 'Delivery', 6, 6), ('TECHNOTRANS', 'Technotrans', 6, 7), ('COMPRESSOR', 'Compressor', 6, 8);

-- 7. GRAVIER
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 7, 1), ('PU1', 'Printing Unit 1', 7, 2), ('COATING', 'Coating', 7, 3), ('UV_IR', 'UV lights / IR light', 7, 4), ('DELIVERY', 'Delivery', 7, 5), ('COMPRESSOR', 'Compressor', 7, 6);

-- 8. Albo
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('COMPACTOR', 'Comapctor', 8, 1), ('TURNER', 'Turner', 8, 2), ('BLOWER', 'Blower', 8, 3);

-- 9. UVcoater
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 9, 1), ('INFEED', 'Infeedunit', 9, 2), ('CONVEYOR', 'Conveyor', 9, 3), ('UV_LIGHTS', 'Uvlights', 9, 4), ('DELIVERY', 'Delivery', 9, 5), ('COATING_UNIT', 'Coating unit', 9, 6);

-- 10. Sheeter
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('REELSTAND', 'Reelstand', 10, 1), ('HELICAL_CUT', 'Helicalcutter', 10, 2), ('CONVEYOR', 'Conveyor', 10, 3), ('DELIVERY', 'Delivery', 10, 4), ('SUCTION', 'Suctionblower', 10, 5), ('DUCT_COLLECT', 'Ductcollector', 10, 6);

-- 11. CTP
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('PLATE_EXPOSER', 'Plateexposer', 11, 1), ('PLATE_PROC', 'Plateprocessor', 11, 2);

-- 12. Printingplant
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('ELEC_DOWN', 'Electricity Down', 12, 1), ('COMPRESSOR', 'Compressor', 12, 2), ('CHILLER', 'Chiller water supply', 12, 3), ('TECHNOTRANS_W', 'Technotrans water', 12, 4), ('DG_SET', 'DG set', 12, 5);

-- 13. Samplemaking
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('CUT_HEAD', 'cuuting head', 13, 1), ('TRAVEL_MOTOR', 'Travel motor', 13, 2), ('BED', 'Bed', 13, 3), ('COMPRESSOR', 'Compressor', 13, 4);


-- ============================================================
-- CORRUGATION DEPARTMENT (Machines 14 to 19)
-- ============================================================

-- 14. Champion
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('MILL_ROLL', 'MillRollstand', 14, 1), ('SPLICER', 'Splicer', 14, 2), ('SINGLE_FACER', 'Singlefacer', 14, 3), ('STEAM', 'Steamsupply', 14, 4), ('FEEDER', 'Feeder', 14, 5), ('HELICAL_CUT', 'Helicalcutter', 14, 6), ('STACKER', 'Stacker', 14, 7);

-- 15. BHSCORRU
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('MILL_ROLL', 'MillRollstand', 15, 1), ('SPLICER', 'Splicer', 15, 2), ('SINGLE_FACER', 'Singlefacer', 15, 3), ('STEAM', 'Steamsupply', 15, 4), ('FEEDER', 'Feeder', 15, 5), ('HELICAL_CUT', 'Helicalcutter', 15, 6), ('STACKER', 'Stacker', 15, 7);

-- 16. Lamify1Old
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('SHEET_FEED', 'Sheetfeeder', 16, 1), ('FLUTE_FEED', 'Flutefeeder', 16, 2), ('LAM_UNIT', 'Laminationunit', 16, 3), ('BELT_TRANS', 'Belttransfer', 16, 4), ('STACKER', 'Stacker', 16, 5);

-- 17. Lamify2New
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('SHEET_FEED', 'Sheetfeeder', 17, 1), ('FLUTE_FEED', 'Flutefeeder', 17, 2), ('LAM_UNIT', 'Laminationunit', 17, 3), ('BELT_TRANS', 'Belttransfer', 17, 4), ('STACKER', 'Stacker', 17, 5);

-- 18. Gluekitchen
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('MIX_TANK', 'Mixing tank', 18, 1), ('CAUSTIC_TANK', 'Cuastic tank', 18, 2), ('SUPPLY_PUMP', 'supply pump', 18, 3);

-- 19. Nflute
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('MILL_ROLL', 'MillRollstand', 19, 1), ('SPLICER', 'Splicer', 19, 2), ('SINGLE_FACER', 'Singlefacer', 19, 3), ('STEAM', 'Steamsupply', 19, 4), ('FEEDER', 'Feeder', 19, 5), ('HELICAL_CUT', 'Helicalcutter', 19, 6);


-- ============================================================
-- NF DIE CUTTING DEPARTMENT (Machines 20 to 31)
-- ============================================================

-- 20. Blanker1
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 20, 1), ('DIE_PLATTEN', 'Die platten', 20, 2), ('DELIVERY', 'Delivery', 20, 3), ('GRIPPER_BAR', 'Gripperbar', 20, 4), ('STRIPPING', 'Stripping', 20, 5), ('BLANKING', 'Blanking', 20, 6);

-- 21. Blanker2
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 21, 1), ('DIE_PLATTEN', 'Die platten', 21, 2), ('DELIVERY', 'Delivery', 21, 3), ('GRIPPER_BAR', 'Gripperbar', 21, 4), ('STRIPPING', 'Stripping', 21, 5), ('BLANKING', 'Blanking', 21, 6);

-- 22. BMFOIL
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 22, 1), ('DIE_PLATTEN', 'Die platten', 22, 2), ('DELIVERY', 'Delivery', 22, 3), ('GRIPPER_BAR', 'Gripperbar', 22, 4), ('FOIL_STAMP', 'Foilstamping', 22, 5), ('BLANKING', 'Blanking', 22, 6);

-- 23. BMAFOIL
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 23, 1), ('DIE_PLATTEN', 'Die platten', 23, 2), ('DELIVERY', 'Delivery', 23, 3), ('GRIPPER_BAR', 'Gripperbar', 23, 4), ('FOIL_STAMP', 'Foilstamping', 23, 5), ('BLANKING', 'Blanking', 23, 6);

-- 24. YOKO
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 24, 1), ('DIE_PLATTEN', 'Die platten', 24, 2), ('DELIVERY', 'Delivery', 24, 3), ('GRIPPER_BAR', 'Gripperbar', 24, 4), ('FOIL_STAMP', 'Foilstamping', 24, 5), ('BLANKING', 'Blanking', 24, 6);

-- 25. DIECUTTING8
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 25, 1), ('DIE_PLATTEN', 'Die platten', 25, 2), ('DELIVERY', 'Delivery', 25, 3), ('GRIPPER_BAR', 'Gripperbar', 25, 4), ('STRIPPING', 'Stripping', 25, 5), ('BLANKING', 'Blanking', 25, 6);

-- 26. NOVA1
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 26, 1), ('DIE_PLATTEN', 'Die platten', 26, 2), ('DELIVERY', 'Delivery', 26, 3), ('GRIPPER_BAR', 'Gripperbar', 26, 4), ('STRIPPING', 'Stripping', 26, 5), ('BLANKING', 'Blanking', 26, 6);

-- 27. NOVA2
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 27, 1), ('DIE_PLATTEN', 'Die platten', 27, 2), ('DELIVERY', 'Delivery', 27, 3), ('GRIPPER_BAR', 'Gripperbar', 27, 4), ('STRIPPING', 'Stripping', 27, 5), ('BLANKING', 'Blanking', 27, 6);

-- 28. NOVA5
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 28, 1), ('DIE_PLATTEN', 'Die platten', 28, 2), ('DELIVERY', 'Delivery', 28, 3), ('GRIPPER_BAR', 'Gripperbar', 28, 4), ('STRIPPING', 'Stripping', 28, 5), ('BLANKING', 'Blanking', 28, 6);

-- 29. NOVA6
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 29, 1), ('DIE_PLATTEN', 'Die platten', 29, 2), ('DELIVERY', 'Delivery', 29, 3), ('GRIPPER_BAR', 'Gripperbar', 29, 4), ('STRIPPING', 'Stripping', 29, 5), ('BLANKING', 'Blanking', 29, 6);

-- 30. Spanthera1
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 30, 1), ('DIE_PLATTEN', 'Die platten', 30, 2), ('DELIVERY', 'Delivery', 30, 3), ('GRIPPER_BAR', 'Gripperbar', 30, 4), ('STRIPPING', 'Stripping', 30, 5), ('BLANKING', 'Blanking', 30, 6);

-- 31. Spanthera2
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 31, 1), ('DIE_PLATTEN', 'Die platten', 31, 2), ('DELIVERY', 'Delivery', 31, 3), ('GRIPPER_BAR', 'Gripperbar', 31, 4), ('STRIPPING', 'Stripping', 31, 5), ('BLANKING', 'Blanking', 31, 6);


-- ============================================================
-- NF PASTING DEPARTMENT (Machines 32 to 39)
-- ============================================================

-- 32. Alpina
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 32, 1), ('ALIGNMENT', 'Alingmentunit', 32, 2), ('PREBREAKER', 'Prebreaker', 32, 3), ('GLUE', 'Glueunit', 32, 4), ('HSS', 'HSSsystem', 32, 5), ('FOLDER', 'Folder', 32, 6), ('TRANSFER', 'Transfer', 32, 7), ('DELIVERY', 'Delivery', 32, 8);

-- 33. Expertfold
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 33, 1), ('ALIGNMENT', 'Alingmentunit', 33, 2), ('PREBREAKER', 'Prebreaker', 33, 3), ('GLUE', 'Glueunit', 33, 4), ('HSS', 'HSSsystem', 33, 5), ('FOLDER', 'Folder', 33, 6), ('TRANSFER', 'Transfer', 33, 7), ('DELIVERY', 'Delivery', 33, 8);

-- 34. Media68
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 34, 1), ('ALIGNMENT', 'Alingmentunit', 34, 2), ('PREBREAKER', 'Prebreaker', 34, 3), ('GLUE', 'Glueunit', 34, 4), ('HSS', 'HSSsystem', 34, 5), ('FOLDER', 'Folder', 34, 6), ('TRANSFER', 'Transfer', 34, 7), ('DELIVERY', 'Delivery', 34, 8);

-- 35. VisionFold
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 35, 1), ('ALIGNMENT', 'Alingmentunit', 35, 2), ('PREBREAKER', 'Prebreaker', 35, 3), ('GLUE', 'Glueunit', 35, 4), ('HSS', 'HSSsystem', 35, 5), ('FOLDER', 'Folder', 35, 6), ('TRANSFER', 'Transfer', 35, 7), ('DELIVERY', 'Delivery', 35, 8);

-- 36. Fuego
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 36, 1), ('ALIGNMENT', 'Alingmentunit', 36, 2), ('PREBREAKER', 'Prebreaker', 36, 3), ('GLUE', 'Glueunit', 36, 4), ('HSS', 'HSSsystem', 36, 5), ('FOLDER', 'Folder', 36, 6), ('TRANSFER', 'Transfer', 36, 7), ('DELIVERY', 'Delivery', 36, 8);

-- 37. Mistral
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 37, 1), ('ALIGNMENT', 'Alingmentunit', 37, 2), ('PREBREAKER', 'Prebreaker', 37, 3), ('GLUE', 'Glueunit', 37, 4), ('HSS', 'HSSsystem', 37, 5), ('FOLDER', 'Folder', 37, 6), ('TRANSFER', 'Transfer', 37, 7), ('DELIVERY', 'Delivery', 37, 8);

-- 38. Blankwiser
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 38, 1), ('ALINGMENTUNIT', 'Alingmentunit', 38, 2), ('GLUEUNIT', 'Glueunit', 38, 3), ('FOLDER', 'Folder', 38, 4), ('DELIVERY', 'Delivery', 38, 5);

-- 39. Other
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('AIRAL', 'Airalunit', 39, 1);


-- ============================================================
-- LAMINATION DEPARTMENT (Machines 40 to 43)
-- ============================================================

-- 40. YILI
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 40, 1), ('HEAT_ROLLER', 'Heating roller', 40, 2), ('PRESSING', 'Pressing', 40, 3), ('KNIFE_CUT', 'Knifecutter', 40, 4), ('DELIVERY', 'Delivery', 40, 5);

-- 41. SLITTER
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('UNWINDER', 'Unwinder', 41, 1), ('REWINDER', 'Rewinder', 41, 2), ('CUTTER', 'Cutter', 41, 3), ('CRANE_MOTOR', 'Crane motor', 41, 4);

-- 42. PERFECTA
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEED_TABLE', 'Feedingtable', 42, 1), ('CUT_KNIFE', 'CuttingKnife', 42, 2), ('PRESSING', 'Pressing', 42, 3), ('BACK_GAUGE', 'BackGauge', 42, 4), ('HYDRAULIC', 'HydrualicPump', 42, 5), ('MAIN_CLUTCH', 'MainDriveClutch', 42, 6);

-- 43. FAIDA
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEED_TABLE', 'Feedingtable', 43, 1), ('CUT_KNIFE', 'CuttingKnife', 43, 2), ('PRESSING', 'Pressing', 43, 3), ('BACK_GAUGE', 'BackGauge', 43, 4), ('HYDRAULIC', 'HydrualicPump', 43, 5), ('MAIN_CLUTCH', 'MainDriveClutch', 43, 6);


-- ============================================================
-- FL DIE CUTTING DEPARTMENT (Machines 44 to 47)
-- ============================================================

-- 44. NOVACUT3
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 44, 1), ('DIE_PLATTEN', 'Dieplatten', 44, 2), ('DELIVERY', 'Delivery', 44, 3), ('GRIPPER_BAR', 'Gripperbar', 44, 4), ('STRIPPING', 'Stripping', 44, 5);

-- 45. NOVACUT4
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 45, 1), ('DIE_PLATTEN', 'Dieplatten', 45, 2), ('DELIVERY', 'Delivery', 45, 3), ('GRIPPER_BAR', 'Gripperbar', 45, 4), ('STRIPPING', 'Stripping', 45, 5);

-- 46. SP102Diecut
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 46, 1), ('DIE_PLATTEN', 'Dieplatten', 46, 2), ('DELIVERY', 'Delivery', 46, 3), ('GRIPPER_BAR', 'Gripperbar', 46, 4), ('STRIPPING', 'Stripping', 46, 5);

-- 47. SP102
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 47, 1), ('DIE_PLATTEN', 'Dieplatten', 47, 2), ('DELIVERY', 'Delivery', 47, 3), ('GRIPPER_BAR', 'Gripperbar', 47, 4), ('STRIPPING', 'Stripping', 47, 5);


-- ============================================================
-- FL PASTING DEPARTMENT (Machines 48 to 52)
-- ============================================================

-- 48. LILA1
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 48, 1), ('ALIGNMENT', 'Alingmentunit', 48, 2), ('PREBREAKER', 'Prebreaker', 48, 3), ('GLUE', 'Glueunit', 48, 4), ('HSS', 'HSSsystem', 48, 5), ('FOLDER', 'Folder', 48, 6), ('TRANSFER', 'Transfer', 48, 7);

-- 49. LILA2
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 49, 1), ('ALIGNMENT', 'Alingmentunit', 49, 2), ('PREBREAKER', 'Prebreaker', 49, 3), ('GLUE', 'Glueunit', 49, 4), ('HSS', 'HSSsystem', 49, 5), ('FOLDER', 'Folder', 49, 6), ('TRANSFER', 'Transfer', 49, 7);

-- 50. PAKTEK1
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 50, 1), ('ALIGNMENT', 'Alingmentunit', 50, 2), ('PREBREAKER', 'Prebreaker', 50, 3), ('GLUE', 'Glueunit', 50, 4), ('HSS', 'HSSsystem', 50, 5), ('FOLDER', 'Folder', 50, 6), ('TRANSFER', 'Transfer', 50, 7);

-- 51. PAKTEK2
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 51, 1), ('ALIGNMENT', 'Alingmentunit', 51, 2), ('PREBREAKER', 'Prebreaker', 51, 3), ('GLUE', 'Glueunit', 51, 4), ('HSS', 'HSSsystem', 51, 5), ('FOLDER', 'Folder', 51, 6), ('TRANSFER', 'Transfer', 51, 7);

-- 52. LaminaGlueline
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 52, 1), ('ALIGNMENT', 'Alingmentunit', 52, 2), ('PREBREAKER', 'Prebreaker', 52, 3), ('GLUE', 'Glueunit', 52, 4), ('HSS', 'HSSsystem', 52, 5), ('FOLDER', 'Folder', 52, 6), ('TRANSFER', 'Transfer', 52, 7);


-- ============================================================
-- HAND PUNCING DEPARTMENT (Machines 53 to 57)
-- ============================================================

-- 53. ACME
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('MAIN_CLUTCH', 'Maindriveclutch', 53, 1), ('DIE_PLATTEN', 'DiePlatten', 53, 2);

-- 54. BHARAT
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('MAIN_CLUTCH', 'Maindriveclutch', 54, 1), ('DIE_PLATTEN', 'DiePlatten', 54, 2);

-- 55. HEIDO
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('MAIN_CLUTCH', 'Maindriveclutch', 55, 1), ('DIE_PLATTEN', 'DiePlatten', 55, 2);

-- 56. Robus
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('SENSOR', 'Sensor', 56, 1);

-- 57. Autostrapping
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('STRAP_HEAD', 'Strapping head', 57, 1), ('HEATER', 'Heater', 57, 2);


-- ============================================================
-- LIQUID LINE DEPARTMENT (Machines 58 to 61)
-- ============================================================

-- 58. Fortuna
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 58, 1), ('BLOWER', 'Blower', 58, 2), ('SCAVENGING', 'Scaving', 58, 3), ('CHILLER', 'Chiller', 58, 4), ('BURNER', 'Burner', 58, 5), ('FOLDER', 'Folder', 58, 6), ('TRANSFER', 'Transfer', 58, 7), ('METAL_DET', 'Metaldetector', 58, 8), ('TAPPING', 'Tapping', 58, 9), ('REGISTER', 'Register unit', 58, 10);

-- 59. Sheeter
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('REELSTAND', 'Reelstand', 59, 1), ('HELICAL_CUT', 'Helicalcutter', 59, 2), ('CONVEYOR', 'Conveyor', 59, 3), ('DELIVERY', 'Delivery', 59, 4), ('SUCTION', 'Suctionblower', 59, 5), ('DUCT_COLLECT', 'Ductcollector', 59, 6);

-- 60. Slitter
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('UNWINDER', 'Unwinder', 60, 1), ('REWINDER', 'Rewinder', 60, 2), ('CUTTER', 'Cutter', 60, 3);

-- 61. Blanker1
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('FEEDER', 'Feeder', 61, 1), ('DIE_PLATTEN', 'Die platten', 61, 2), ('DELIVERY', 'Delivery', 61, 3), ('GRIPPERBAR', 'Gripperbar', 61, 4), ('STRIPPING', 'Stripping', 61, 5);


-- ============================================================
-- OTHERS DEPARTMENT (Machines 62 to 73)
-- ============================================================

-- 62. WindowPatching1
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('MACHINE', 'Machine', 62, 1);

-- 63. WindowPatching2
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('MACHINE', 'Machine', 63, 1);

-- 64. OfflineBlanker
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('MACHINE', 'Machine', 64, 1);

-- 65. BatchCounter
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('MACHINE', 'Machine', 65, 1);

-- 66. AutoPrintSorting1
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('MACHINE', 'Machine', 66, 1);

-- 67. AutoPrintSorting2
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('MACHINE', 'Machine', 67, 1);

-- 68. PokerCard
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('MACHINE', 'Machine', 68, 1);

-- 69. LablePasting1
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('MACHINE', 'Machine', 69, 1);

-- 70. LablePasting2
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('MACHINE', 'Machine', 70, 1);

-- 71. LablePasting3
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('MACHINE', 'Machine', 71, 1);

-- 72. InkmatchingMixt1
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('MACHINE', 'Machine', 72, 1);

-- 73. InkmatchingMixt2
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('MACHINE', 'Machine', 73, 1);


-- ============================================================
-- CONVERTING PLANT (Machines 74 to 75)
-- ============================================================

-- 74. Compressor
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('MAIN_COMP', 'Main compressor', 74, 1), ('BACKUP_COMP', 'Backup compressor', 74, 2);

-- 75. Electricitydown
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('MAIN_SUPPLY', 'Main supply', 75, 1), ('DG_SET', 'DG Set', 75, 2), ('TRANSFORMER', 'Transformer', 75, 3);


-- ============================================================
-- PRINTING PLANT UTILITIES (Machines 76 to 78)
-- ============================================================

-- 76. Utility
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('ELEC_DOWN', 'Electricity Down', 76, 1), ('COMPRESSOR', 'Compressor', 76, 2), ('CHILLER', 'Chiller water supply', 76, 3), ('TECHNOTRANS_W', 'Technotrans water', 76, 4), ('DG_SET', 'DG set', 76, 5);

-- 77. Electricitydown
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('MAIN_SUPPLY', 'Main supply', 77, 1), ('DG_SET', 'DG Set', 77, 2);

-- 78. Compressor
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('MAIN_COMP', 'Main compressor', 78, 1), ('BACKUP_COMP', 'Backup compressor', 78, 2);


-- ============================================================
-- SCRAP DEPARTMENT (Machines 79 to 81)
-- ============================================================

-- 79. ScrapCutting1
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('MACHINE', 'Machine', 79, 1);

-- 80. ScrapCutting2
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('MACHINE', 'Machine', 80, 1);

-- 81. ScrapCutting3
INSERT INTO mst_machine_unit (unit_code, unit_name, machine_id, position) VALUES
('MACHINE', 'Machine', 81, 1);


COMMIT;

-- ============================================================
-- END OF SEED DATA  —  81 machines, 400 units
-- ============================================================