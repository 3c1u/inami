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
 * %raw (0) | %rash (0) %rasl (1) | _ _ %rah (0) %ral (1) 
 * %rbw (1) | %rbsh (2) %rbsl (3) | _ _ %rbh (2) %rbl (3) 
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
 *  - LWZ  reg32,  offset(reg32)                  すす すすす すn すn
 *  - SWZ  reg32,  offset(reg32)                  すす すすすす すn すn
 *  - LCZ  reg8,   offset(reg32)                  すす すす すn すn
 *  - SCZ  reg8,   offset(reg32)                  すす す すn すn
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
 *  - CALL reg32                                  すすすすす すす すn すすすす
 *  - RET                                         すすすすす すす すn すすすすす
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
 * 0x04  CharDraw(x: i32, y: i32, c: u8)
 * 0x05  SwapScreen(src: *const u8)
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
 * 
 * more obfuscated:
 * スス子っス！
 * バナさん私のこと好きなんすか？ このままスッススしてもいいっスよね？
 * スッスス！スッスス！パイセン，スス子のことすきっすか？
 * そ，そうっスよね...．すきじゃないっスよね...．すぐにドスケベするのはいやっすか？
 * あたしはパイセンのこと...すきっすよ...．ってアタシになにいわせてるんすか！
 * そういう鈍感なところが嫌いっす！こんなにもススがすきって言ってるのに！
 * ススのこともっと見て欲しいっス！ススはバナさんのことが好きっす．
 * スッススがいやなら，別に手つなぎデートでもいいっスよ．
 * ス す ス す ススススス すすすすすす スス すす

 */
