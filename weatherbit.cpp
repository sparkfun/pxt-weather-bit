/**
* Mary West @ SparkFun Electronics 
* Ryan Mortenson https://github.com/ryanjmortenson
* Harry Fairhead @ IoT-Programmer 
* June 13, 2017
* https://github.com/sparkfun/pxt-weather-bit
*
* Development environment specifics:
* Written in Microsoft PXT
* Tested with a SparkFun weather:bit for micro:bit
*
* This code is released under the [MIT License](http://opensource.org/licenses/MIT).
* Please review the LICENSE.md file included with this example. If you have any questions 
* or concerns with licensing, please contact techsupport@sparkfun.com.
* Distributed as-is; no warranty is given.
*/


#include "pxt.h"
#include <cstdint>
#include <math.h>

using namespace pxt;

// v0 backward compat support
#ifndef PXT_BUFFER_DATA
#define PXT_BUFFER_DATA(buffer) buffer->payload
#endif

namespace weatherbit {    
	MicroBitPin P12(MICROBIT_ID_IO_P12, MICROBIT_PIN_P12, PIN_CAPABILITY_DIGITAL); 
    MicroBitPin P13(MICROBIT_ID_IO_P13, MICROBIT_PIN_P13, PIN_CAPABILITY_DIGITAL); 

    uint8_t init() {
        P12.setDigitalValue(0);
        for (volatile uint16_t i = 0; i < 600; i++);
        P12.setDigitalValue(1);
        for (volatile uint8_t i = 0; i < 30; i++);
        int b = P13.getDigitalValue();
        for (volatile uint16_t i = 0; i < 600; i++);
        return b;
    }

    void sendZero() {
        P12.setDigitalValue(0);
        for (volatile uint8_t i = 1; i < 75; i++);
        P12.setDigitalValue(1);
        for (volatile uint8_t i = 1; i < 6; i++);
    }

    void sendOne() {
        P12.setDigitalValue(0);
        for (volatile uint8_t i = 1; i < 1; i++);
        P12.setDigitalValue(1);
        for (volatile uint8_t i = 1; i < 80; i++);
    }

    void writeBit(int b) {
        int delay1, delay2;
        if (b == 1) {
            delay1 = 1;
            delay2 = 80;
        } else {
            delay1 = 75;
            delay2 = 6;
        }
        P12.setDigitalValue(0);
        for (uint8_t i = 1; i < delay1; i++);
        P12.setDigitalValue(1);
        for (uint8_t i = 1; i < delay2; i++);
    }

    void sendskip() {
        writeBit(0);
        writeBit(0);
        writeBit(1);
        writeBit(1);
        writeBit(0);
        writeBit(0);
        writeBit(1);
        writeBit(1);
    }

    void writeByte(int byte) {
        int i;
        for (i = 0; i < 8; i++) {
            if (byte & 1) {
                writeBit(1);
            } else {
                writeBit(0);
            }
            byte = byte >> 1;
        }
    }

    int readBit() {
        volatile int i;
        P12.setDigitalValue(0);
        P12.setDigitalValue(1);
        for (i = 1; i < 20; i++);
        int b = P13.getDigitalValue();
        for (i = 1; i < 60; i++);
        return b;
    }

    int convert() {
        volatile int i;
        int j;
        writeByte(0x44);
        for (j = 1; j < 1000; j++) {
            for (i = 1; i < 900; i++) {
        };
        if (readBit() == 1)
            break;
        };
        return (j);
    }

    int readByte() {
        int byte = 0;
        int i;
        for (i = 0; i < 8; i++) {
            byte = byte | readBit() << i;
        };
        return byte;
    }

    //%
    int16_t soilTemp() {
        init();
        writeByte(0xCC);
        convert();
        init();
        writeByte(0xCC);
        writeByte(0xBE);
        int b1 = readByte();
        int b2 = readByte();

        int16_t temp = (b2 << 8 | b1);
        return temp * 100 / 16;
    }


    /*
    * Compensates the pressure value read from the register.  This done in C++ because
    * it requires the use of 64-bit signed integers which isn't provided in TypeScript
    */
    //%
    uint32_t compensatePressure(int32_t pressRegVal, int32_t tFine, Buffer compensation) {
        // Compensation Values
        uint16_t digP1;
        int16_t digP2;
        int16_t digP3;
        int16_t digP4;
        int16_t digP5;
        int16_t digP6;
        int16_t digP7;
        int16_t digP8;
        int16_t digP9;

        // Unpack the compensation data        
        auto ptr = PXT_BUFFER_DATA(compensation);
        memcpy((uint8_t *) &digP1, ptr + 0, 2);
        memcpy((uint8_t *) &digP2, ptr + 2, 2);
        memcpy((uint8_t *) &digP3, ptr + 4, 2);
        memcpy((uint8_t *) &digP4, ptr + 6, 2);
        memcpy((uint8_t *) &digP5, ptr + 8, 2);
        memcpy((uint8_t *) &digP6, ptr + 10, 2);
        memcpy((uint8_t *) &digP7, ptr + 12, 2);
        memcpy((uint8_t *) &digP8, ptr + 14, 2);
        memcpy((uint8_t *) &digP9, ptr + 16, 2);

        // Do the compensation
        int64_t firstConv = ((int64_t) tFine) - 128000;
        int64_t secondConv = firstConv * firstConv * (int64_t)digP6;
        secondConv = secondConv + ((firstConv*(int64_t)digP5)<<17);
        secondConv = secondConv + (((int64_t)digP4)<<35);
        firstConv = ((firstConv * firstConv * (int64_t)digP3)>>8) + ((firstConv * (int64_t)digP2)<<12);
        firstConv = (((((int64_t)1)<<47)+firstConv))*((int64_t)digP1)>>33;
        if (firstConv == 0) {
            return 0; // avoid exception caused by division by zero
        }
        int64_t p = 1048576-pressRegVal;
        p = (((p<<31)-secondConv)*3125)/firstConv;
        firstConv = (((int64_t)digP9) * (p>>13) * (p>>13)) >> 25;
        secondConv = (((int64_t)digP8) * p) >> 19;
        p = ((p + firstConv + secondConv) >> 8) + (((int64_t)digP7)<<4);
        return (uint32_t)p;
    }

    /*
    * calculates the Altitude based on pressure. 
    */
    //%    
    uint32_t calcAltitude(int32_t pressRegVal, int32_t tFine, Buffer compensation) {
       
        return 44330*(1-pow(((compensatePressure(pressRegVal, tFine, compensation)/25600)/1013.25), 0.1903));
    }
}
