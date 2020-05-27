import susuko from '../img/susuko.png'

/*
 * memory layout (0x400000; 4 MiB)
 * ---------------------------------
 * 0x000000 ~ 0x0000FF -- for communication with graphic accelerator
 * 0x000100 ~ 0x0FFFFF -- program
 * 0x100000 ~ 0x157e40 -- framebuffer
 * 0x157e41 ~ 0x1AFC80 -- susuko (preloaded)
 * 0x1FF000 ~ 0x1FFFFF -- stack
 * 0x200000 ~ 0x399999 -- heap
 * 
 * registers (little endian)
 * ---------------------------------
 * %raw (0)
 * %rbw (1)
 * %rcw (2)
 * %rdw (3)
 * %ipw (4)
 * %spw (5)
 * %fw  (6)
 * 
 * すn -> n == す * (n + 1)
 * す32 -> eg. すスス..す -> 1 0 0..1
 * 
 * instructions
 * ---------------------------------
 * * load & store
 *  - ADDI reg32a, reg32a,       imm32            reg32a <- imm32
 *  - LWZ  reg32,  offset(reg32)                  reg32 <- *(reg32 + offset)
 *  - SWZ  reg32,  offset(reg32)                  *(reg32 + offset) <- reg32
 *  - LCZ  reg8,   offset(reg32)                  reg8 <- *(reg32 + offset)
 *  - SCZ  reg8,   offset(reg32)                  *(reg32 + offset) <- reg8
 * 
 * * arithmetics
 *  - ADD  reg32a, reg32b                         reg32a <- reg32a + reg32b
 *  - SUB  reg32a, reg32b                         reg32a <- reg32a - reg32b
 *  - MUL  reg32a, reg32b                         reg32a <- reg32a * reg32b
 * 
 * * comparison and branching
 *  - CMP  reg32a, reg32b                         fw <- reg32a - reg32b
 *  - BZ   offset(reg32)                          ipw <- reg32 + offset if fw == 0
 *  - BNZ  offset(reg32)                          ipw <- reg32 + offset if fw != 0
 *  - BNG  offset(reg32)                          ipw <- reg32 + offset if fw < 0
 *  - BP   offset(reg32)                          ipw <- reg32 + offset if fw > 0
 * 
 * * call
 *  - CALL reg32
 *  - RET
 * 
 * * stack manipulation
 *  - PUSH reg32
 *  - POP  reg32
 * 
 * * interrupts & I/O
 *  - INT  imm8
 *  - OUT  imm8,   reg32
 *  - IN   imm8,   reg32
 * 
 * encoding
 * ---------------------------------
 * * load & store
 *  - LI   reg32,  imm32                          すすす すn すn す32
 *  - LWZ  reg32,  offset(reg32)                  すす すすす すn すn すn
 *  - SWZ  reg32,  offset(reg32)                  すす すすすす すn すn すn
 *  - LCZ  reg8,   offset(reg32)                  すす すす すn すn すn
 *  - SCZ  reg8,   offset(reg32)                  すす す すn すn すn
 * 
 * * arithmetics
 *  - ADD  reg32a, reg32b                         す す すn すn
 *  - SUB  reg32a, reg32b                         す すす すn すn
 *  - MUL  reg32a, reg32b                         す すすす すn すn
 *  - XOR  reg32a, reg32b                         す すすすす すn すn
 * 
 * * comparison and branching
 *  - CMP  reg32a, reg32b                         すすすす すすすすす すn すn
 *  - BZ   offset(reg32)                          すすすす す すn すn
 *  - BNG  offset(reg32)                          すすすす すす すn すn
 *  - BNZ  offset(reg32)                          すすすす すすす すn すn
 *  - BP   offset(reg32)                          すすすす すすすす すn すn
 * 
 * * call
 *  - CALL reg32                                  すすすすす すn す すすす
 *  - RET                                         すすすすす す  す すすすす
 * 
 * * stack manipulation
 *  - PUSH reg32                                  すすすすす すn す す
 *  - POP  reg32                                  すすすすす すn す すす
 * 
 * * interrupts & I/O
 *  - INT  imm8                                   すすすすす すn すす すす
 *  - OUT  imm8,   reg32                          すすすすす すn すすす すn
 *  - IN   imm8,   reg32                          すすすすす すn すすすす すn
 *
 * interrrupt calls
 * ---------------------------------
 * 0x00  ClearScreen(color: u32)
 * 0x01  BitBlt(
 *          src: *const u8,
 *          w: i32,
 *          h: i32,
 *          srcX: i32,
 *          srcY: i32,
 *          srcW: i32,
 *          srcH: i32,
 *          destX: i32,
 *          destY: i32,
 *       )
 * 0x02  Crop(dest: *mut u8, x1: i32, y1: i32, w: i32, h: i32)
 * 0x03  Scroll(dx: i32, dy: i32)
 * 0x04  CharDraw(x: i32, y: i32, ch: u8, color: u32)
 * 0x05  PushScreen(src: *const u8)
 * 0x06  Halt()
 * 0x07  Sleep(msecs: i32)
 * 0x08  StrDraw(x: i32, y: i32, ch: *const u8, color: u32)
 * i/o layout
 * ---------------------------------
 * TODO
 */

/*
 * ;; スス子を表示するサンプル
 * li   %raw, 0x157e41
 * ススス す ス スススス スススス スススす スすスす スすすす すすすス スすスス スススす
 * push %raw
 * ススススス す ス す
 * int  0x05
 * ススススス すすすすすす スス すす
 * int  0x06
 * ススススス すすすすすすす スス すす
 */

/* Hello world (CharDraw)
_main:
0x100      li %raw, _RODATA_str01
0x100      xor %rcw, %rcw
_main@head:
0x100      lcz %rbw, 0x00 (%raw)
0x100      xor %rdw, %rdw
0x100      cmp %raw, %rdw
0x100      bz _main@end
0x100      li %rdw, 0xFFFFFFFF
0x100      push %rdw             ; color
0x100      push %rbw             ; char
0x100      xor %rdw, %rdw
0x100      push %rdw
0x100      push %rcw
0x100      int 0x04 ; CharDraw
0x100      li %rdw, 0x01
0x100      add %raw, %rdw
0x100      li %rdw, 0x0F
0x100      add %rcw, %rdw
0x100      cmp %raw, %raw
0x100      bz _main@head
_main@end:
0x100      int 0x06 ; HALT
_RODATA_str01:
0x100      .cstr "Hello, world!"
*/

/* Hello world (StrDraw)
0x100      li   %raw, _RODATA_str01
0x100      li   %rcw, 0xFFFFFFFF
0x100      xor  %rbw, %rbw
0x100      push %rcw
0x100      push %rbw
0x100      push %rbw
0x100      push %raw
0x100      int  0x09
0x100      int  0x06
_RODATA_str01:
0x100      .cstr "Hello, world!"
*/

const kSusukoImage = new Promise(
    (resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = (err) => reject(err)
        img.src = susuko
    }
).then((img: HTMLImageElement | any) => {
    const cvs = document.createElement('canvas')
    if (!cvs) {
        return Promise.reject()
    }

    cvs.width = 300
    cvs.height = 300

    const ctx = cvs.getContext('2d')
    if (!ctx) {
        return Promise.reject()
    }

    ctx.drawImage(img, 0, 0)
    return ctx.getImageData(0, 0, 300, 300)
})

const kSusukoProgramEntryPointAddress = 0x000100
const kSusukoFramebufferAddress = 0x100000
const kSusukoSusukoAddress = 0x157e41

const kSusukoRegisterRAW = 0
const kSusukoRegisterRBW = 1
const kSusukoRegisterRCW = 2
const kSusukoRegisterRDW = 3
const kSusukoRegisterIPW = 4
const kSusukoRegisterSPW = 5
const kSusukoRegisterFW = 6

const kSusukoRegisterNameTable = '%raw,%rbw,%rcw,%rdw,%ipw,%spw,%fw'.split(',')

export default class Interpreter {
    private m_memory: Uint8Array
    private m_memsize: number
    private m_ctx: CanvasRenderingContext2D | null = null
    private m_isRunning: boolean = false

    private m_registers: Uint32Array = new Uint32Array(8)

    private m_delay: number = 0

    public constructor(memsize: number) {
        this.m_memory = new Uint8Array(memsize)
        this.m_memsize = memsize

        this.resetRegisters()
    }

    public setCanvas(canvas?: HTMLCanvasElement) {
        if (canvas) {
            this.m_ctx = canvas.getContext('2d')
            this.pushFramebuffer()
        } else {
            this.m_ctx = null
        }
    }

    public resetRegisters() {
        /*
         * %raw (0) : 0
         * %rbw (1) : 0
         * %rcw (2) : 0
         * %rdw (3) : 0
         * %ipw (4) : 0x000100
         * %spw (5) : 0x200000
         * %fw  (6) : 0
         */
        this.m_registers.set([0, 0, 0, 0, 0x000100, 0x200000, 0])
    }

    public reset() {
        this.m_memory = new Uint8Array(this.m_memsize)
        this.m_isRunning = false

        this.resetRegisters()

        this.loadSusuko()
        this.pushFramebuffer()
    }

    async loadSusuko() {
        const susuko = await kSusukoImage
        this.m_memory.set(susuko.data, kSusukoSusukoAddress)
    }

    private pushFramebuffer() {
        if (!this.m_ctx) {
            return
        }

        const buf = this.m_memory.slice(kSusukoFramebufferAddress, kSusukoSusukoAddress - 1)
        const dst = this.m_ctx.createImageData(300, 300)

        dst.data.set(buf, 0)

        this.m_ctx.clearRect(0, 0, 300, 300)
        this.m_ctx.putImageData(dst, 0, 0)
    }

    private popFramebuffer() {
        if (!this.m_ctx) {
            return
        }

        const dst = this.m_ctx.getImageData(0, 0, 300, 300)
        this.m_memory.set(dst.data, kSusukoFramebufferAddress)
    }

    public loadProgram(program: string) {
        // reset interpreter
        this.reset()

        // encode to UTF-8
        const encoder = new TextEncoder()
        const encodedProgram = encoder.encode(program)
            .slice(0, 0x100000 - 0x100)

        // laod program
        this.m_memory.set(encodedProgram, 0x100)
        console.debug(`program loaded with size: ${encodedProgram.byteLength}`)

        this.m_isRunning = true
    }

    public execute() {
        if (!this.m_isRunning
            || (this.m_memsize <= this.m_registers[kSusukoRegisterIPW])) {
            return
        }

        const delay = this.m_delay
        this.m_delay = 0
        this.step()

        setTimeout(() => this.execute(), delay)
    }

    step() {
        if ((this.m_memsize <= this.m_registers[kSusukoRegisterIPW])) {
            return
        }

        const pos = '0x' + this.m_registers[kSusukoRegisterIPW].toString(16).padStart(8, '0')
        const su = this.countSu()

        if (su !== undefined) {
            switch (su[1]) {
                case 0x00: // ADD, SUB, MUL, XOR
                    {
                        const arg1 = this.countSu()
                        const arg2 = this.countSu()
                        const arg3 = this.countSu()

                        if (arg1 === undefined
                            || arg2 === undefined
                            || arg3 === undefined) {
                            throw "illegal instruction"
                        }

                        switch (arg1[1]) {
                            case 0:
                                this.m_registers[arg2[1]] += this.m_registers[arg3[1]]
                                break;
                            case 1:
                                this.m_registers[arg2[1]] -= this.m_registers[arg3[1]]
                                break;
                            case 2:
                                this.m_registers[arg2[1]] *= this.m_registers[arg3[1]]
                                break;
                            case 3:
                                this.m_registers[arg2[1]] ^= this.m_registers[arg3[1]]
                                break;
                            default:
                                throw "unreachable"
                        }
                    }
                    break;
                case 0x01: // LWZ, SWZ, LCZ, SCZ
                    {
                        const arg1 = this.countSu()
                        const arg2 = this.countSu()
                        const arg3 = this.countSu()
                        const arg4 = this.countSu()

                        if (arg1 === undefined
                            || arg2 === undefined
                            || arg3 === undefined
                            || arg4 === undefined) {
                            throw "illegal instruction"
                        }

                        const regDest = arg2[1]
                        const memOffset = arg3[1]
                        const memAddr = this.m_registers[arg4[1]]

                        switch (arg1[1]) {
                            case 0: // SCZ
                                console.log(`${pos}: SCZ 0x${
                                    memAddr.toString(16).padStart(8, '0')
                                    } + 0x${
                                    memOffset.toString(16).padStart(8, '0')
                                    } <- ${kSusukoRegisterNameTable[regDest]}`)
                                this.m_memory[memAddr + memOffset] = this.m_registers[regDest] & 0xFF
                                break;
                            case 1: // LCZ
                                console.log(`${pos}: LCZ ${kSusukoRegisterNameTable[regDest]} <- 0x${
                                    memAddr.toString(16).padStart(8, '0')
                                    } + 0x${
                                    memOffset.toString(16).padStart(8, '0')
                                    }`)
                                const rval = this.m_registers[regDest]
                                this.m_registers[regDest] = this.m_memory[memAddr + memOffset]
                                break;
                            case 2: // SWZ
                                console.log(`${pos}: SWZ 0x${
                                    memAddr.toString(16).padStart(8, '0')
                                    } + 0x${
                                    memOffset.toString(16).padStart(8, '0')
                                    } <- ${kSusukoRegisterNameTable[regDest]}`)
                                this.m_memory[memAddr + memOffset + 3] = (this.m_registers[regDest] >> 24) & 0xFF
                                this.m_memory[memAddr + memOffset + 2] = (this.m_registers[regDest] >> 16) & 0xFF
                                this.m_memory[memAddr + memOffset + 1] = (this.m_registers[regDest] >> 8) & 0xFF
                                this.m_memory[memAddr + memOffset] = this.m_registers[regDest] & 0xFF
                                break;
                            case 3: // LWZ
                                console.log(`${pos}: LWZ ${kSusukoRegisterNameTable[regDest]} <- 0x${
                                    memAddr.toString(16).padStart(8, '0')
                                    } + 0x${
                                    memOffset.toString(16).padStart(8, '0')
                                    }`)
                                this.m_registers[regDest] = (this.m_memory[memAddr + memOffset + 3] << 24)
                                    | (this.m_memory[memAddr + memOffset + 2] << 16)
                                    | (this.m_memory[memAddr + memOffset + 1] << 8)
                                    | (this.m_memory[memAddr + memOffset])
                                break;
                            default:
                                throw "unreachable"
                        }
                    }
                    break;
                case 0x02: // LI
                    {
                        const arg1 = this.countSu()
                        if (arg1 === undefined) {
                            throw "illegal instruction"
                        }

                        // skip
                        for (let i = 0; i <= arg1[1]; i++)
                            while (this.nextSu() === undefined)
                                ;

                        let val = 0 | 0

                        for (let i = 0; i < 32; i++) {
                            const su = this.nextSu()
                            if (su === undefined) {
                                i--
                                continue
                            }

                            val = (val << 1) | (!su ? 1 : 0)
                        }

                        this.m_registers[arg1[1]] = val

                        console.log(`${pos}: LI ${kSusukoRegisterNameTable[arg1[1]]} <- 0x${(val >> 0).toString(16).padStart(8, '0')}`)
                    }
                    break;
                case 0x03: // CMP, BZ, BNG, BNZ, BP
                    {
                        const arg1 = this.countSu()
                        const arg2 = this.countSu()
                        const arg3 = this.countSu()

                        if (arg1 === undefined
                            || arg2 === undefined
                            || arg3 === undefined) {
                            throw "illegal instruction"
                        }

                        const addr = this.m_registers[arg2[1]]
                        const offset = arg3[1]
                        const fw = this.m_registers[kSusukoRegisterFW]

                        switch (arg1[1]) {
                            case 0x0000: // BZ
                                if (fw == 0) {
                                    this.m_registers[kSusukoRegisterIPW] = addr + offset
                                }
                                break;
                            case 0x0001: // BNG
                                if ((fw & 0x80000000) !== 0) {
                                    this.m_registers[kSusukoRegisterIPW] = addr + offset
                                }
                                break;
                            case 0x0002: // BNZ
                                if (fw != 0) {
                                    this.m_registers[kSusukoRegisterIPW] = addr + offset
                                }
                                break;
                            case 0x0003: // BP
                                if ((fw & 0x80000000) === 0) {
                                    this.m_registers[kSusukoRegisterIPW] = addr + offset
                                }
                                break;
                            case 0x0004: // CMP
                                {
                                    const r1 = this.m_registers[arg2[1]]
                                    const r2 = this.m_registers[arg3[1]]
                                    this.m_registers[kSusukoRegisterFW] = r1 - r2
                                }
                                break;
                            default:
                                throw "unimplemented"
                                break;
                        }
                    }
                    break;
                case 0x04: // CALL, RET, PUSH, POP, INT, OUT, IN
                    {
                        const arg1 = this.countSu()
                        const arg2 = this.countSu()
                        const arg3 = this.countSu()

                        if (arg1 === undefined
                            || arg2 === undefined
                            || arg3 === undefined) {
                            throw "illegal instruction"
                        }

                        switch ((arg2[1] << 8) | (arg3[1] & 0xFF)) {
                            case 0x0000: // PUSH
                                console.log(`${pos}: PUSH ${kSusukoRegisterNameTable[arg1[1]]}`)
                                this.push(this.m_registers[arg1[1]])
                                break;
                            case 0x0001: // POP
                                console.log(`${pos}: POP ${kSusukoRegisterNameTable[arg1[1]]}`)
                                this.m_registers[arg1[1]] = this.pop()
                                break;
                            case 0x0002: // CALL
                                let addr = this.m_registers[arg1[1]]
                                console.log(`${pos}: CALL \$0x${addr.toString(16).padStart(2, '0')}`)
                                this.push(this.m_registers[kSusukoRegisterIPW])
                                this.m_registers[kSusukoRegisterIPW] = addr
                                break;
                            case 0x0003: // RET
                                console.log(`${pos}: RET`)
                                this.m_registers[kSusukoRegisterIPW] = this.pop()
                                break;
                            case 0x0101: // INT
                                console.log(`${pos}: INT \$0x${arg1[1].toString(16).padStart(2, '0')}`)
                                this.interrupt(arg1[1])
                                break;
                            default:
                                if (arg2[1] == 0x02) {
                                    // OUT
                                } else if (arg2[1] == 0x02) {
                                    // IN
                                }

                                throw "unimplemented"
                                break;
                        }
                    }
                    break;
                default:
                    throw "illegal instruction"
            }
        }

        this.pushFramebuffer()
    }

    private interrupt(intr: number) {
        console.debug(`INT: \$0x${intr.toString(16).padStart(2, '0')}`)
        switch (intr) {
            case 0x00: // ClearScreen
                {
                    console.debug('ClearScreen')

                    this.m_memory.set(new Uint8Array(kSusukoSusukoAddress - kSusukoFramebufferAddress), kSusukoFramebufferAddress)
                }
                break;
            case 0x01: // BitBlt
                {
                    const src = this.pop()
                    const w = this.pop()
                    const h = this.pop()
                    const srcX = this.pop()
                    const srcY = this.pop()
                    const srcW = this.pop()
                    const srcH = this.pop()
                    const destX = this.pop()
                    const destY = this.pop()

                    console.debug(`ClearScreen(\$0x${
                        src.toString(16).padStart(2, '0')}), ${w}, ${h}\
                        , ${srcX}, ${srcY}, ${srcW}, ${srcH}\
                        , ${destX}, ${destY})`)
                    console.debug("BitBlt not implemented")
                }
                break;
            case 0x02: // Crop
                {
                    const dest = this.pop()
                    const srcX = this.pop()
                    const srcY = this.pop()
                    const srcW = this.pop()
                    const srcH = this.pop()

                    console.debug(`Crop(\$0x${
                        dest.toString(16).padStart(2, '0')})\
                        , ${srcX}, ${srcY}, ${srcW}, ${srcH})`)

                    this.pushFramebuffer()

                    if (!this.m_ctx) {
                        console.debug("screen not present; not implemented")
                    }

                    const buf = this.m_ctx!.getImageData(srcX, srcY, srcW, srcH)
                    this.m_memory.set(buf.data, dest)
                }
                break;
            case 0x03: // Scroll
                {
                    const dx = this.pop()
                    const dy = this.pop()

                    console.debug(`Scroll(${dx}, ${dy})`)

                    if (!this.m_ctx) {
                        console.debug("screen not present; not implemented")
                    }

                    this.pushFramebuffer()

                    const buf = this.m_ctx!.getImageData(0, 0, 300, 300)

                    this.m_ctx?.clearRect(0, 0, 300, 300)

                    // TODO: smarter implementation

                    this.m_ctx?.putImageData(buf, dx + 300, dy)
                    this.m_ctx?.putImageData(buf, dx - 300, dy)

                    this.m_ctx?.putImageData(buf, dx, dy + 300)
                    this.m_ctx?.putImageData(buf, dx, dy - 300)

                    this.m_ctx?.putImageData(buf, dx + 300, dy - 300)
                    this.m_ctx?.putImageData(buf, dx - 300, dy + 300)
                    this.m_ctx?.putImageData(buf, dx + 300, dy + 300)
                    this.m_ctx?.putImageData(buf, dx - 300, dy - 300)

                    this.m_ctx?.putImageData(buf, dx, dy)

                    this.popFramebuffer()
                }
                break;
            case 0x04: // CharDraw
                {
                    // TODO: use other method

                    const x = this.pop()
                    const y = this.pop()
                    const ch = String.fromCharCode(this.pop())
                    const col = this.pop()

                    const r = (col >> 24) & 0xff
                    const g = (col >> 16) & 0xff
                    const b = (col >> 8) & 0xff
                    const a = col & 0xff

                    console.debug(`CharDraw(${x}, ${y}, ${JSON.stringify(ch)}, rgba(${r}, ${g}, ${b}, ${a / 255.0}))`)

                    if (!this.m_ctx) {
                        console.debug("screen not present; not implemented")
                    }

                    this.m_ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255.0})`
                    this.m_ctx!.fillText(ch, x, y)

                    this.popFramebuffer()
                }
                break;
            case 0x05: // PushScreen
                {
                    const addr = this.pop()
                    console.debug(`PushScreen(\$0x${addr.toString(16).padStart(2, '0')})`)

                    const buf = this.m_memory.slice(addr, addr + (kSusukoSusukoAddress - kSusukoFramebufferAddress))
                    this.m_memory.set(buf, kSusukoFramebufferAddress)
                }
                break;
            case 0x06: // HALT
                {
                    console.debug('HALT')
                    this.m_isRunning = false
                }
                break;
            case 0x07: // SLEEP
                {
                    const msecs = this.pop()
                    console.debug(`SLEEP(${msecs} [ms])`)
                    this.m_delay = msecs
                }
                break;
            case 0x08: // CharDraw
                {
                    // TODO: use other method

                    const x = this.pop()
                    const y = this.pop()
                    const strAddr = this.pop()
                    const col = this.pop()

                    const r = (col >> 24) & 0xff
                    const g = (col >> 16) & 0xff
                    const b = (col >> 8) & 0xff
                    const a = col & 0xff

                    console.debug(`CharDraw(${x}, ${y}, \$0x${strAddr.toString(16).padStart(2, '0')}, rgba(${r}, ${g}, ${b}, ${a / 255.0}))`)

                    if (!this.m_ctx) {
                        console.debug("screen not present; not implemented")
                    }

                    let i = 0;
                    for (i = strAddr; this.m_memory[i] != 0; i++)
                        ;

                    const chars = this.m_memory.slice(strAddr, i)
                    const decoder = new TextDecoder()
                    const str = decoder.decode(chars).split('\n')[0]

                    this.m_ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255.0})`
                    this.m_ctx!.font = "24px sans-serif"
                    this.m_ctx!.fillText(str, x, y + 24)

                    this.popFramebuffer()
                }
                break;
            default:
                console.debug('unknown interrupt')
        }
    }

    private push(x: number) {
        this.m_registers[kSusukoRegisterSPW] -= 4
        const sptr = this.m_registers[kSusukoRegisterSPW]

        this.m_memory[sptr + 3] = (x >> 24) & 0xFF
        this.m_memory[sptr + 2] = (x >> 16) & 0xFF
        this.m_memory[sptr + 1] = (x >> 8) & 0xFF
        this.m_memory[sptr] = x & 0xFF
    }

    private pop(): number {
        const sptr = this.m_registers[kSusukoRegisterSPW]
        this.m_registers[kSusukoRegisterSPW] += 4
        return (this.m_memory[sptr + 3] << 24)
            | (this.m_memory[sptr + 2] << 16)
            | (this.m_memory[sptr + 1] << 8)
            | (this.m_memory[sptr])
    }

    countSu(): [boolean, number] | undefined {
        let head = this.m_registers[kSusukoRegisterIPW]
        let count = 0
        let su = this.nextSu()

        while (su === undefined
            && (this.m_registers[kSusukoRegisterIPW] < this.m_memsize)) {
            su = this.nextSu()
        }

        if (su === undefined) {
            return undefined
        }

        let last = this.m_registers[kSusukoRegisterIPW]

        let matchingSu = this.nextSu()
        while (su === matchingSu) {
            count++
            last = this.m_registers[kSusukoRegisterIPW]
            matchingSu = this.nextSu()
        }

        this.m_registers[kSusukoRegisterIPW] = last

        console.log(`fetch: 0x${
            head.toString(16).padStart(8, '0')
            }-0x${
            last.toString(16).padStart(8, '0')
            }; ${su}; ${count + 1}`)

        return [su, count]
    }

    nextSu(): boolean | undefined {
        // ス: 0xE3, 0x82, 0xB9
        // す: 0xE3, 0x81, 0x99

        const ch = this.m_memory[this.m_registers[kSusukoRegisterIPW]++]

        if (ch <= 0x007F) {
            // ASCII
            return undefined
        } else if ((ch & 0xE0) === 0xC0) {
            // 7-bit
            this.m_registers[kSusukoRegisterIPW]++
        } else if ((ch & 0xF0) === 0xE0) {
            // 11-bit
            const ch2 = this.m_memory[this.m_registers[kSusukoRegisterIPW]++]
            const ch3 = this.m_memory[this.m_registers[kSusukoRegisterIPW]++]

            // ス
            const suKatakana = (ch === 0xE3) && (ch2 === 0x82) && (ch3 === 0xB9)
            // す
            const suHiragana = (ch === 0xE3) && (ch2 === 0x81) && (ch3 === 0x99)
            // 「
            const lParen = (ch === 0xE3) && (ch2 === 0x80) && (ch3 === 0x8C)

            if (lParen) {
                this.skipUntilRParen()
                return undefined
            } else if (suHiragana || suKatakana) {
                return suKatakana
            } else {
                return undefined
            }
        } else if ((ch & 0xF8) === 0xF0) {
            // 21-bit
            this.m_registers[kSusukoRegisterIPW] += 3
        }

        return undefined
    }

    skipUntilRParen() {
        while (this.m_memsize > this.m_registers[kSusukoRegisterIPW]) {
            const ch = this.m_memory[this.m_registers[kSusukoRegisterIPW]++]

            if (ch <= 0x007F) {
                continue
            } else if ((ch & 0xE0) === 0xC0) {
                // 7-bit
                this.m_registers[kSusukoRegisterIPW]++
            } else if ((ch & 0xF0) === 0xE0) {
                // 11-bit
                const ch2 = this.m_memory[this.m_registers[kSusukoRegisterIPW]++]
                const ch3 = this.m_memory[this.m_registers[kSusukoRegisterIPW]++]
    
                // 」
                const rParen = (ch === 0xE3) && (ch2 === 0x80) && (ch3 === 0x8D)
    
                if (rParen)
                    return
            } else if ((ch & 0xF8) === 0xF0) {
                // 21-bit
                this.m_registers[kSusukoRegisterIPW] += 3
            }
        }
    }
}
