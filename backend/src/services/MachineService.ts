import { MachineRepository } from '../repositories/MachineRepository';

const machineRepo = new MachineRepository();

export class MachineService {
  /**
   * Replaces `seedMachineDataIfEmpty()` from Code.gs.
   * GAS logic: Ensures the base machine hierarchy is seeded.
   */
  async initializeMachines() {
    await machineRepo.seedIfEmpty();
  }

  /**
   * Replaces `getMachineData()` from Code.gs.
   * GAS logic: Seeds default hierarchy if empty, and returns the nested format.
   */
  async getMachineHierarchy() {
    // 1. Replicate GAS seed check before fetching
    await this.initializeMachines();

    // 2. Fetch data via Repository
    // Note: The MachineRepository acts as the adapter, translating the flat DB rows
    // exactly into the complex `{ TYPE: { MACHINE: ["unit"] } }` object expected.
    const machines = await machineRepo.getAll();

    // 3. Return identical GAS JSON response
    return {
      status: 'success',
      machines: machines
    };
  }

  /**
   * Replaces `saveMachineData(params)` from Code.gs.
   * GAS logic: Validates inputs and creates/updates a machine row.
   */
  async saveMachineData(params: any) {
    // 1. Replicate GAS seed check before saving
    await this.initializeMachines();

    const type = String(params.machineType || '').trim();
    const name = String(params.machineName || '').trim();
    const units = String(params.units || '').trim();

    // 2. Replicate exact GAS validation logic
    if (!type || !name) {
      return { status: 'error', message: 'machineType and machineName required' };
    }

    // 3. Delegate to repository
    await machineRepo.upsert({
      machineType: type,
      machineName: name,
      units: units
    });

    return { status: 'success' };
  }

  /**
   * Replaces `deleteMachineData(params)` from Code.gs.
   * GAS logic: Deletes a machine if it matches exactly by name.
   */
  async deleteMachine(machineName: string) {
    const name = String(machineName || '').trim();
    
    if (name) {
      // Delegate to repository
      await machineRepo.deleteByName(name);
    }

    // GAS strictly returned success regardless of whether the machine was actually found or not
    return { status: 'success' };
  }
}
