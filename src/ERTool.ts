// @ts-expect-error
import memoryjs from "memoryjs";
// https://github.com/Rob--/memoryjs
// https://github.com/Rob--/memoryjs#user-content-documentation

const processName = "start_protected_game.exe";

type Process = {
  dwSize: number;
  th32ProcessID: number;
  cntThreads: number;
  th32ParentProcessID: number;
  pcPriClassBase: number;
  szExeFile: string;
  handle: number;
  modBaseAddr: number;
};

const MAX_RUNES = 999999999;
const MAX_RUNE_MEMORY = 0xffffffff;

export class ERTool {
  erProcess: Process | null = null;

  // TODO: Check if these always stay the same
  worldChrManOff = 64380840;
  worldChrManPlayerOff2 = 124168;
  pgDataOffset = 1408;

  constructor() {
    this.findBaseAddress();
  }

  findBaseAddress() {
    try {
      const process = memoryjs.openProcess(processName);

      if (!process) {
        throw new Error(`Process for ${processName} not found`);
      }

      this.erProcess = process;
    } catch (e) {
      console.error("Error in 'findBaseAddress'", e);
    }
  }

  getPlayerInsPtr() {
    if (!this.erProcess) return;
    const handle = this.erProcess.handle;
    const base = this.erProcess.modBaseAddr;

    const ptr1 = Number(memoryjs.readMemory(handle, base + this.worldChrManOff, memoryjs.INT64));
    const ptr2 = Number(memoryjs.readMemory(handle, ptr1 + this.worldChrManPlayerOff2, memoryjs.INT64));
    return ptr2;
  }

  getCharPtrGameData() {
    if (!this.erProcess) return;
    const handle = this.erProcess.handle;

    var ptr3 = this.getPlayerInsPtr();

    if (!ptr3) return;

    var ptr4 = Number(memoryjs.readMemory(handle, ptr3 + this.pgDataOffset, memoryjs.INT64));
    return ptr4;
  }

  addRunes(amount: number = 10000000) {
    if (!this.erProcess) return;
    const handle = this.erProcess.handle;
    const base = this.erProcess.modBaseAddr;

    const charPtrGameData = this.getCharPtrGameData();

    if (!charPtrGameData) return;

    const ptr = charPtrGameData + 0x6c;
    const ptrReachedMaxRuneMemory = charPtrGameData + 0x109;
    const oldRunes = memoryjs.readMemory(handle, ptr, memoryjs.INT32);
    const oldRuneMemory = memoryjs.readMemory(handle, ptr + 4, memoryjs.INT32);

    let newRunes = oldRunes + amount;

    if (newRunes < 0) {
      newRunes = 0;
    } else if (newRunes > MAX_RUNES) {
      newRunes = MAX_RUNES;
    }
    memoryjs.writeMemory(handle, ptr, newRunes, memoryjs.INT32);

    const increase = newRunes - oldRunes;

    if (0 == increase) {
      return increase;
    }

    let newRuneMemory = oldRuneMemory;
    newRuneMemory += increase;

    if (newRuneMemory > MAX_RUNE_MEMORY) {
      newRuneMemory = MAX_RUNE_MEMORY;
    } else if (newRuneMemory < 0) {
      newRuneMemory = newRunes;
    }
    const reachedMaxRuneMemory = MAX_RUNE_MEMORY == newRuneMemory;

    memoryjs.writeMemory(handle, ptr + 4, newRuneMemory, memoryjs.INT32);
    memoryjs.writeMemory(handle, ptr + 8, 0, memoryjs.INT32);
    memoryjs.writeMemory(handle, ptrReachedMaxRuneMemory, reachedMaxRuneMemory ? 1 : 0, memoryjs.INT8);

    return increase;
  }
}
