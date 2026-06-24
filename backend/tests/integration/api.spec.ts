import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/utils/db';
import bcrypt from 'bcrypt';

describe('CMMS Backend Full API Integration Testing', () => {
  // Test context variables
  let testRefId: string;
  const testEmail = 'new_test_user@example.com';
  const testMachineName = 'TestMachineX';

  const MACHINES_DEFAULT: Record<string, Record<string, string[]>> = {
    "PRINTING": {
      "PrintKBA1": ["Feeder","PU1","PU2","PU3","PU4","PU5","PU6","Coating","Uvlights / IR light","Delivery","Technotrans","Compressor"],
      "PrintKBA2": ["Feeder","PU1","PU2","PU3","PU4","PU5","PU6","Coating","Uvlights / IR light","Delivery","Technotrans","Compressor"],
      "PrintKBA3": ["Feeder","PU1","PU2","PU3","PU4","PU5","PU6","PU7","Coating","Uvlights / IR light","Delivery","Technotrans","Compressor"],
      "HeidelbergCX1": ["Feeder","PU1","PU2","PU3","PU4","PU5","PU6","PU7","Coating","Uvlights / IR light","Delivery","Technotrans","Compressor"],
      "HeidelbergCX2": ["Feeder","PU1","PU2","PU3","PU4","PU5","PU6","PU7","Coating","Uvlights / IR light","Delivery","Technotrans","Compressor"],
      "Roland": ["Feeder","PU1","PU2","Coating","Uvlights / IR light","Delivery","Technotrans","Compressor"],
      "GRAVIER": ["Feeder","PU1","Coating","Uvlights / IR light","Delivery","Compressor"],
      "Albo": ["Comapctor","Turner","Blower"],
      "UVcoater": ["Feeder","Infeedunit","Conveyor","Uvlights","Delivery","Coating unit"],
      "Sheeter": ["Reelstand","Helicalcutter","Conveyor","Delivery","Suctionblower","Ductcollector"],
      "CTP": ["Plateexposer","Plateprocessor"],
      "Printingplant_KBA": ["Electricity Down","Compressor","Chiller water supply","Technotrans water","DG set"],
      "Samplemaking": ["cuuting head","Travel motor","Bed","Compressor"]
    },
    "CORRUGATION": {
      "Champion": ["MillRollstand","Splicer","Singlefacer","Steamsupply","Feeder","Helicalcutter","Stacker"],
      "BHSCORRU": ["MillRollstand","Splicer","Singlefacer","Steamsupply","Feeder","Helicalcutter","Stacker"],
      "Lamify1Old": ["Sheetfeeder","Flutefeeder","Laminationunit","Belttransfer","Stacker"],
      "Lamify2New": ["Sheetfeeder","Flutefeeder","Laminationunit","Belttransfer","Stacker"],
      "Gluekitchen": ["Mixing tank","Cuastic tank","supply pump"],
      "Nflute": ["MillRollstand","Splicer","Singlefacer","Steamsupply","Feeder","Helicalcutter"]
    },
    "NFDIECUTTING": {
      "Blanker1": ["Feeder","Die platten","Delivery","Gripperbar","Stripping","Blanking"],
      "Blanker2": ["Feeder","Die platten","Delivery","Gripperbar","Stripping","Blanking"],
      "BMFOIL": ["Feeder","Die platten","Delivery","Gripperbar","Foilstamping","Blanking"],
      "BMAFOIL": ["Feeder","Die platten","Delivery","Gripperbar","Foilstamping","Blanking"],
      "YOKO": ["Feeder","Die platten","Delivery","Gripperbar","Foilstamping","Blanking"],
      "DIECUTTING8": ["Feeder","Die platten","Delivery","Gripperbar","Stripping","Blanking"],
      "NOVA1": ["Feeder","Die platten","Delivery","Gripperbar","Stripping","Blanking"],
      "NOVA2": ["Feeder","Die platten","Delivery","Gripperbar","Stripping","Blanking"],
      "NOVA5": ["Feeder","Die platten","Delivery","Gripperbar","Stripping","Blanking"],
      "NOVA6": ["Feeder","Die platten","Delivery","Gripperbar","Stripping","Blanking"],
      "Spanthera1": ["Feeder","Die platten","Delivery","Gripperbar","Stripping","Blanking"],
      "Spanthera2": ["Feeder","Die platten","Delivery","Gripperbar","Stripping","Blanking"]
    },
    "NFPASTING": {
      "Alpina": ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer","Delivery"],
      "Expertfold": ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer","Delivery"],
      "Media68": ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer","Delivery"],
      "VisionFold": ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer","Delivery"],
      "Fuego": ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer","Delivery"],
      "Mistral": ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer","Delivery"],
      "Blankwiser": ["Feeder","Alingmentunit","Glueunit","Folder","Delivery"],
      "Other": ["Airalunit"]
    },
    "LAMINATION": {
      "YILI": ["Feeder","Heating roller","Pressing","Knifecutter","Delivery"],
      "SLITTER": ["Unwinder","Rewinder","Cutter","Crane motor"],
      "PERFECTA": ["Feedingtable","CuttingKnife","Pressing","BackGauge","HydrualicPump","MainDriveClutch"],
      "FAIDA": ["Feedingtable","CuttingKnife","Pressing","BackGauge","HydrualicPump","MainDriveClutch"]
    },
    "FLDIECUTTING": {
      "NOVACUT3": ["Feeder","Dieplatten","Delivery","Gripperbar","Stripping"],
      "NOVACUT4": ["Feeder","Dieplatten","Delivery","Gripperbar","Stripping"],
      "SP102Diecut": ["Feeder","Dieplatten","Delivery","Gripperbar","Stripping"],
      "SP102": ["Feeder","Dieplatten","Delivery","Gripperbar","Stripping"]
    },
    "FLPASTING": {
      "LILA1": ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer"],
      "LILA2": ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer"],
      "PAKTEK1": ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer"],
      "PAKTEK2": ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer"],
      "LaminaGlueline": ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer"]
    },
    "HANDPUNCING": {
      "ACME": ["Maindriveclutch","DiePlatten"],
      "BHARAT": ["Maindriveclutch","DiePlatten"],
      "HEIDO": ["Maindriveclutch","DiePlatten"],
      "Robus": ["Sensor"],
      "Autostrapping": ["Strapping head","Heater"]
    },
    "LIQUIDLINE": {
      "Fortuna": ["Feeder","Blower","Scaving","Chiller","Burner","Folder","Transfer","Metaldetector","Tapping","Register unit"],
      "Sheeter_Liq": ["Reelstand","Helicalcutter","Conveyor","Delivery","Suctionblower","Ductcollector"],
      "Slitter_Liq": ["Unwinder","Rewinder","Cutter"],
      "Blanker1_Liq": ["Feeder","Die platten","Delivery","Gripperbar","Stripping"]
    },
    "OTHERS": {
      "WindowPatching1": ["Machine"],"WindowPatching2": ["Machine"],
      "OfflineBlanker": ["Machine"],"BatchCounter": ["Machine"],
      "AutoPrintSorting1": ["Machine"],"AutoPrintSorting2": ["Machine"],
      "PokerCard": ["Machine"],"LablePasting1": ["Machine"],
      "LablePasting2": ["Machine"],"LablePasting3": ["Machine"],
      "InkmatchingMixt1": ["Machine"],"InkmatchingMixt2": ["Machine"]
    },
    "Convertingplant": {
      "Compressor_Conv": ["Main compressor","Backup compressor"],
      "Electricitydown_Conv": ["Main supply","DG Set","Transformer"]
    },
    "Printingplant": {
      "Utility": ["Electricity Down","Compressor","Chiller water supply","Technotrans water","DG set"],
      "Electricitydown": ["Main supply","DG Set"],
      "Compressor": ["Main compressor","Backup compressor"]
    },
    "SCRAP": {
      "ScrapCutting1": ["Machine"],"ScrapCutting2": ["Machine"],"ScrapCutting3": ["Machine"]
    }
  };

  beforeAll(async () => {
    // Ensure clean test environment by removing test-prefixed records
    await prisma.rawData.deleteMany({
      where: {
        OR: [
          { Machine_Name: testMachineName },
          { Ref_ID: { startsWith: 'PKS-TEST' } }
        ]
      }
    });

    await prisma.machineData.deleteMany({});
    await prisma.adminUsers.deleteMany({});


    // Populate MachineData with deduplicated values from our list to bypass constraint failures
    const seenNames = new Set<string>();
    const dataToInsert = [];
    for (const type of Object.keys(MACHINES_DEFAULT)) {
      for (const name of Object.keys(MACHINES_DEFAULT[type])) {
        if (!seenNames.has(name)) {
          seenNames.add(name);
          dataToInsert.push({
            machine_type: type,
            machine_name: name,
            units: MACHINES_DEFAULT[type][name].join(',')
          });
        }
      }
    }
    await prisma.machineData.createMany({ data: dataToInsert });
  });

  afterAll(async () => {
    // Clean up test records
    await prisma.rawData.deleteMany({
      where: {
        OR: [
          { Machine_Name: testMachineName },
          { Ref_ID: { startsWith: 'PKS-TEST' } }
        ]
      }
    });

    await prisma.machineData.deleteMany({
      where: { machine_name: testMachineName }
    });

    await prisma.adminUsers.deleteMany({
      where: { email: testEmail }
    });

    await prisma.$disconnect();
  });

  // =========================================================================
  // 1. BREAKDOWN API TESTS
  // =========================================================================
  describe('Breakdown Module Endpoints', () => {
    
    it('POST /api/breakdowns/create - Positive: should successfully create a breakdown log', async () => {
      const payload = {
        date: '2026-06-20',
        shift: 'SHIFT_1',
        machineType: 'PRINTING',
        machineName: 'PrintKBA1',
        unit: 'Feeder',
        problemType: 'Electrical',
        category: 'Breakdown',
        description: 'Feeder sensor failure',
        actionTaken: 'Replaced proximity sensor',
        rootCause: 'Normal Wear & Tear',
        timeStart: '08:00:00',
        timeEnd: '09:15:00',
        durationMin: '75',
        attendedBy: 'Ashish',
        submittedBy: 'YogeshK',
        remarks: 'Test breakdown log creation'
      };

      const res = await request(app)
        .post('/api/breakdowns/create')
        .send(payload);

      console.log('POST /api/breakdowns/create response:', JSON.stringify(res.body));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.refId).toBeDefined();
      expect(res.body.data.refId).toMatch(/^PKS-\d{8}-\d{6}$/);
      testRefId = res.body.data.refId;
    });

    it('POST /api/breakdowns/create - Negative: should still create record with missing parameters but verify return structure (passing explicit unique refId to avoid same-second collision)', async () => {
      const payload = {
        refId: 'PKS-TEST-NEG-001',
        machineName: 'PrintKBA1'
      };

      const res = await request(app)
        .post('/api/breakdowns/create')
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.refId).toBeDefined();
    });

    it('GET /api/breakdowns/pending - Positive: should retrieve all pending reviews', async () => {
      const res = await request(app)
        .get('/api/breakdowns/pending');

      console.log('GET /api/breakdowns/pending response:', JSON.stringify(res.body));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('success');
      expect(Array.isArray(res.body.data.all)).toBe(true);
      expect(typeof res.body.data.pendingCount).toBe('number');
    });

    it('PUT /api/breakdowns/update - Positive: should successfully update the entry details', async () => {
      const payload = {
        refId: testRefId,
        description: 'Updated sensor description for testing',
        duration: '90',
        attendedBy: 'Shivaji'
      };

      const res = await request(app)
        .put('/api/breakdowns/update')
        .send(payload);

      console.log('PUT /api/breakdowns/update response:', JSON.stringify(res.body));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('success');
      expect(res.body.data.message).toBe('Saved (still pending)');
      expect(res.body.data.refId).toBe(testRefId);

      // Verify DB change
      const record = await prisma.rawData.findUnique({ where: { Ref_ID: testRefId } });
      expect(record?.Description).toBe('Updated sensor description for testing');
      expect(record?.Duration_Min).toBe(90);
      expect(record?.Attended_By).toBe('Shivaji');
    });

    it('PUT /api/breakdowns/update - Negative: should return 400 when refId is missing', async () => {
      const payload = {
        description: 'Missing refId test'
      };

      const res = await request(app)
        .put('/api/breakdowns/update')
        .send(payload);

      console.log('PUT /api/breakdowns/update missing refId response:', JSON.stringify(res.body));
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Missing refId');
    });

    it('PUT /api/breakdowns/status - Positive / GAS parity check: should change status or handle log mapping', async () => {
      const payload = {
        refId: testRefId,
        status: 'APPROVED'
      };

      const res = await request(app)
        .put('/api/breakdowns/status')
        .send(payload);

      console.log('PUT /api/breakdowns/status response:', JSON.stringify(res.body));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Saved (still pending)');
    });
  });

  // =========================================================================
  // 2. MACHINE API TESTS
  // =========================================================================
  describe('Machine Module Endpoints', () => {

    it('POST /api/machines/init - Positive: should initialize machine list', async () => {
      const res = await request(app)
        .post('/api/machines/init');

      console.log('POST /api/machines/init response:', JSON.stringify(res.body));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Machines initialized');
    });

    it('GET /api/machines - Positive: should get the complete machines list and hierarchy', async () => {
      const res = await request(app)
        .get('/api/machines');

      console.log('GET /api/machines response summary:', `Keys found: ${Object.keys(res.body.data.machines || {}).join(', ')}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('success');
      expect(res.body.data.machines).toBeDefined();
    });

    it('POST /api/machines/save - Positive: should save a new machine successfully', async () => {
      const payload = {
        machineType: 'PRINTING',
        machineName: testMachineName,
        units: 'Feeder, PU1, Coating, Delivery'
      };

      const res = await request(app)
        .post('/api/machines/save')
        .send(payload);

      console.log('POST /api/machines/save response:', JSON.stringify(res.body));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('success');

      // Verify DB
      const record = await prisma.machineData.findUnique({ where: { machine_name: testMachineName } });
      expect(record).toBeDefined();
      expect(record?.machine_type).toBe('PRINTING');
      expect(record?.units).toBe('Feeder, PU1, Coating, Delivery');
    });

    it('POST /api/machines/save - Negative: should fail if machineType or machineName is missing', async () => {
      const payload = {
        units: 'Only units specified'
      };

      const res = await request(app)
        .post('/api/machines/save')
        .send(payload);

      console.log('POST /api/machines/save missing params response:', JSON.stringify(res.body));
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('machineType and machineName required');
    });

    it('DELETE /api/machines/:name - Positive: should successfully delete a machine by name', async () => {
      const res = await request(app)
        .delete(`/api/machines/${testMachineName}`);

      console.log('DELETE /api/machines/:name response:', JSON.stringify(res.body));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('success');

      // Verify DB deletion
      const record = await prisma.machineData.findUnique({ where: { machine_name: testMachineName } });
      expect(record).toBeNull();
    });
  });

  // =========================================================================
  // 3. USER/AUTH API TESTS
  // =========================================================================
  describe('User/Auth Module Endpoints', () => {

    it('POST /api/users/init - Positive: should initialize default admin users', async () => {
      const res = await request(app)
        .post('/api/users/init');

      console.log('POST /api/users/init response:', JSON.stringify(res.body));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Admin users initialized');
    });

    it('POST /api/auth/login - Positive: should login with correct credentials', async () => {
      const payload = {
        email: 'yogeshkp85@gmail.com',
        password: 'PKS@2026'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(payload);

      console.log('POST /api/auth/login positive response:', JSON.stringify(res.body));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('success');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('yogeshkp85@gmail.com');
      expect(res.body.data.user.level).toBe('superadmin');
    });

    it('POST /api/auth/login - Negative: should reject login with wrong password', async () => {
      const payload = {
        email: 'yogeshkp85@gmail.com',
        password: 'wrongpassword'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(payload);

      console.log('POST /api/auth/login wrong password response:', JSON.stringify(res.body));
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('GET /api/users - Positive: should list all admin users', async () => {
      const res = await request(app)
        .get('/api/users');

      console.log('GET /api/users response:', JSON.stringify(res.body));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('success');
      expect(Array.isArray(res.body.data.users)).toBe(true);
    });

    it('POST /api/users/create - Positive: should create a new admin user', async () => {
      const payload = {
        name: 'Test Temp User',
        email: testEmail,
        password: 'tempPassword123',
        level: 'supervisor'
      };

      const res = await request(app)
        .post('/api/users/create')
        .send(payload);

      console.log('POST /api/users/create response:', JSON.stringify(res.body));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('success');

      // Verify in DB
      const user = await prisma.adminUsers.findUnique({ where: { email: testEmail } });
      expect(user).toBeDefined();
      expect(user?.name).toBe('Test Temp User');
      expect(user?.level).toBe('supervisor');
    });

    it('POST /api/users/create - Negative: should reject user creation if missing password', async () => {
      const payload = {
        name: 'No Password User',
        email: 'nopass@example.com',
        level: 'viewer'
      };

      const res = await request(app)
        .post('/api/users/create')
        .send(payload);

      console.log('POST /api/users/create missing password response:', JSON.stringify(res.body));
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('name and password required');
    });

    it('DELETE /api/users/:email - Negative (Boundary): should prevent deletion of super admin', async () => {
      const res = await request(app)
        .delete('/api/users/yogeshkp85@gmail.com');

      console.log('DELETE /api/users/:email superadmin response:', JSON.stringify(res.body));
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Cannot delete super admin');
    });

    it('DELETE /api/users/:email - Positive: should successfully delete a non-superadmin user', async () => {
      const res = await request(app)
        .delete(`/api/users/${testEmail}`);

      console.log('DELETE /api/users/:email regular response:', JSON.stringify(res.body));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('success');

      // Verify in DB
      const user = await prisma.adminUsers.findUnique({ where: { email: testEmail } });
      expect(user).toBeNull();
    });
  });

  // =========================================================================
  // 4. REPORT API TESTS
  // =========================================================================
  describe('Report Module Endpoints', () => {

    beforeAll(async () => {
      // Clean up any left-over test records first to prevent constraint violations
      await prisma.finalData.deleteMany({
        where: {
          Ref_ID: {
            in: ['PKS-TEST-001', 'PKS-TEST-SCH-01']
          }
        }
      });
      await prisma.historicalKPI.deleteMany({
        where: {
          FY: '2026-2027'
        }
      });

      // Insert some sample final data to ensure query returns values
      await prisma.finalData.createMany({
        data: [
          {
            Ref_ID: 'PKS-TEST-001',
            Month_Year: 'Jun-26',
            Date: '20/06/2026',
            Shift: 'First Shift',
            Machine_Type: 'PRINTING',
            Machine_Name: 'PrintKBA1',
            Unit: 'Feeder',
            Problem_Type: 'Electrical',
            Category: 'Breakdown',
            Description: 'Sample test log',
            Action_Taken: 'Sensor adjusted',
            Time_Start: '08:00 AM',
            Time_End: '09:00 AM',
            Minutes: 60,
            BD_Flag: 1,
            Available_Time_Min: 44640,
            Attended_By: 'Ashish'
          }
        ]
      });

      await prisma.historicalKPI.createMany({
        data: [
          {
            FY: '2026-2027',
            Month: 'Jun',
            Machine: 'PrintKBA1',
            Available_Time: 44640,
            Breakdown_Time: 120,
            Breakdown_Count: 2,
            Uptime: 44520,
            MTTR: 60,
            MTBF: 22260,
            Availability: 99.73
          }
        ]
      });
    });

    afterAll(async () => {
      await prisma.finalData.deleteMany({ where: { Ref_ID: 'PKS-TEST-001' } });
      await prisma.historicalKPI.deleteMany({ where: { FY: '2026-2027' } });
    });

    it('GET /api/reports/dashboard - Positive: should return dashboard report data', async () => {
      const res = await request(app)
        .get('/api/reports/dashboard');

      console.log('GET /api/reports/dashboard response:', JSON.stringify(res.body));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rows).toBeDefined();
      expect(Array.isArray(res.body.data.rows)).toBe(true);
      expect(res.body.data.rows.length).toBeGreaterThan(0);
    });

    it('GET /api/reports/kpi - Positive: should return KPI calculations', async () => {
      const res = await request(app)
        .get('/api/reports/kpi');

      console.log('GET /api/reports/kpi response:', JSON.stringify(res.body));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rows).toBeDefined();
      expect(Array.isArray(res.body.data.rows)).toBe(true);
      expect(res.body.data.rows.length).toBeGreaterThan(0);
    });

    it('GET /api/reports/historical - Positive: should return historical performance metrics', async () => {
      const res = await request(app)
        .get('/api/reports/historical');

      console.log('GET /api/reports/historical response:', JSON.stringify(res.body));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rows).toBeDefined();
    });
  });

  // =========================================================================
  // 5. APPROVAL API TESTS
  // =========================================================================
  describe('Approval Module Endpoints', () => {

    it('GET /api/approvals/pending - Positive: should list entries waiting for approval', async () => {
      const res = await request(app)
        .get('/api/approvals/pending');

      console.log('GET /api/approvals/pending response:', JSON.stringify(res.body));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('success');
      expect(typeof res.body.data.pendingCount).toBe('number');
    });

    it('POST /api/approvals/approve - Positive: should approve a breakdown entry', async () => {
      const payload = {
        refId: testRefId
      };

      const res = await request(app)
        .post('/api/approvals/approve')
        .send(payload);

      console.log('POST /api/approvals/approve response:', JSON.stringify(res.body));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('success');
      expect(res.body.data.message).toBe('APPROVED');
      expect(res.body.data.refId).toBe(testRefId);

      // Verify status in DB
      const record = await prisma.rawData.findUnique({ where: { Ref_ID: testRefId } });
      expect(record?.Status).toBe('APPROVED');
    });

    it('POST /api/approvals/reject - Positive: should reject a breakdown entry', async () => {
      const payload = {
        refId: testRefId
      };

      const res = await request(app)
        .post('/api/approvals/reject')
        .send(payload);

      console.log('POST /api/approvals/reject response:', JSON.stringify(res.body));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('success');
      expect(res.body.data.message).toBe('REJECTED');
      expect(res.body.data.refId).toBe(testRefId);

      // Verify status in DB
      const record = await prisma.rawData.findUnique({ where: { Ref_ID: testRefId } });
      expect(record?.Status).toBe('REJECTED');
    });

    it('POST /api/approvals/approve - Negative: should fail to approve if refId is missing', async () => {
      const res = await request(app)
        .post('/api/approvals/approve')
        .send({});

      console.log('POST /api/approvals/approve missing refId response:', JSON.stringify(res.body));
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid row');
    });

    it('PUT /api/approvals/status - Positive: should dynamically update the status', async () => {
      const payload = {
        refId: testRefId,
        statusValue: 'RE-REVIEW'
      };

      const res = await request(app)
        .put('/api/approvals/status')
        .send(payload);

      console.log('PUT /api/approvals/status response:', JSON.stringify(res.body));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('RE-REVIEW');

      const record = await prisma.rawData.findUnique({ where: { Ref_ID: testRefId } });
      expect(record?.Status).toBe('RE-REVIEW');
    });
  });

  // =========================================================================
  // 6. SCHEDULER API TESTS
  // =========================================================================
  describe('Scheduler Module Endpoints', () => {

    beforeAll(async () => {
      // Ensure yesterday has a final data record to trigger calculations
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateStr = `${pad(yesterday.getDate())}/${pad(yesterday.getMonth() + 1)}/${yesterday.getFullYear()}`;

      await prisma.finalData.create({
        data: {
          Ref_ID: 'PKS-TEST-SCH-01',
          Month_Year: 'Jun-26',
          Date: dateStr,
          Shift: 'First Shift',
          Machine_Type: 'PRINTING',
          Machine_Name: 'PrintKBA1',
          Unit: 'Feeder',
          Problem_Type: 'Electrical',
          Category: 'Breakdown',
          Description: 'Scheduler test log',
          Action_Taken: 'Sensor cleaned',
          Time_Start: '08:00 AM',
          Time_End: '09:00 AM',
          Minutes: 60,
          BD_Flag: 1,
          Available_Time_Min: 44640,
          Attended_By: 'Ashish'
        }
      });
    });

    afterAll(async () => {
      await prisma.finalData.deleteMany({ where: { Ref_ID: 'PKS-TEST-SCH-01' } });
    });

    it('POST /api/scheduler/daily-reports - Positive: should compile maintenance metrics and format legacy GAS HTML template', async () => {
      const res = await request(app)
        .post('/api/scheduler/daily-reports');

      console.log('POST /api/scheduler/daily-reports response:', JSON.stringify(res.body));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.to).toBe('yogeshkp85@gmail.com');
      expect(res.body.data.subject).toContain('Daily Maintenance Report');
      expect(res.body.data.htmlBody).toContain('PARKSONS MAINTENANCE REPORT');
      expect(res.body.data.htmlBody).toContain('Total Entries');
    });

    it('POST /api/scheduler/triggers - Positive: should execute general scheduler triggers', async () => {
      const res = await request(app)
        .post('/api/scheduler/triggers');

      console.log('POST /api/scheduler/triggers response:', JSON.stringify(res.body));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Triggers executed successfully');
    });

    it('POST /api/scheduler/run - Positive: should trigger full scheduler pipeline execution', async () => {
      const res = await request(app)
        .post('/api/scheduler/run');

      expect(res.body.message).toBe('Scheduled jobs triggered successfully');
    });
  });

  // =========================================================================
  // RBAC ACCESS CONTROL TESTS
  // =========================================================================
  describe('RBAC Authorization Rules', () => {
    let superadminToken: string;
    let adminToken: string;
    let supervisorToken: string;
    let technicianToken: string;
    let viewerToken: string;

    beforeAll(async () => {
      // Initialize default users first to make sure they exist
      await request(app).post('/api/users/init');
      
      // Let's create users for different levels
      const salt = await bcrypt.hash('pass123', 10);
      await prisma.adminUsers.upsert({
        where: { email: 'admin@test.com' },
        update: {},
        create: { name: 'Admin User', email: 'admin@test.com', password: salt, level: 'admin' }
      });
      await prisma.adminUsers.upsert({
        where: { email: 'supervisor@test.com' },
        update: {},
        create: { name: 'Supervisor User', email: 'supervisor@test.com', password: salt, level: 'supervisor' }
      });
      await prisma.adminUsers.upsert({
        where: { email: 'technician@test.com' },
        update: {},
        create: { name: 'Technician User', email: 'technician@test.com', password: salt, level: 'technician' }
      });
      await prisma.adminUsers.upsert({
        where: { email: 'viewer@test.com' },
        update: {},
        create: { name: 'Viewer User', email: 'viewer@test.com', password: salt, level: 'viewer' }
      });

      // Login to get tokens
      const login = async (email: string) => {
        const res = await request(app).post('/api/auth/login').send({ email, password: 'pass123' });
        return res.body.data.token;
      };
      
      const superadminRes = await request(app).post('/api/auth/login').send({ email: 'yogeshkp85@gmail.com', password: 'PKS@2026' });
      superadminToken = superadminRes.body.data.token;

      adminToken = await login('admin@test.com');
      supervisorToken = await login('supervisor@test.com');
      technicianToken = await login('technician@test.com');
      viewerToken = await login('viewer@test.com');
    });

    afterAll(async () => {
      await prisma.adminUsers.deleteMany({
        where: {
          email: {
            in: ['admin@test.com', 'supervisor@test.com', 'technician@test.com', 'viewer@test.com']
          }
        }
      });
    });

    it('Technician cannot approve (Approve permission)', async () => {
      const res = await request(app)
        .post('/api/approvals/approve')
        .set('Authorization', `Bearer ${technicianToken}`)
        .send({ refId: 'PKS-TEST-SCH-01' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access denied');
    });

    it('Viewer cannot create breakdown (Create permission)', async () => {
      const res = await request(app)
        .post('/api/breakdowns/create')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          date: '2026-06-21',
          shift: 'SHIFT_1',
          machineType: 'PRINTING',
          machineName: 'PrintKBA1',
          unit: 'Feeder',
          problemType: 'Electrical',
          category: 'Breakdown',
          description: 'Failed breakdown attempt',
          actionTaken: 'No action taken',
          timeStart: '08:00',
          timeEnd: '09:00',
          durationMin: '60',
          attendedBy: 'Ashish',
          submittedBy: 'Ashish'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access denied');
    });

    it('Supervisor cannot manage users (Users permission)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access denied');
    });

    it('Admin can access everything', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Superadmin can access everything', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
