#include "pxt.h"
#include <cstdint>

using namespace pxt;

namespace weatherbit {
    /*
    * Compensates the pressure value read from the register.  This done in C++ because
    * it requires the use of 64-bit signed integers which isn't provided in TypeScript
    */
    //%
    uint32_t compensatePressure(int32_t pressRegVal, int32_t tFine, Buffer compensation) {
        // Create a managed buffer out of the packet compensation data
        ManagedBuffer comp(compensation);

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

        // Unpack the compensation dat
        comp.readBytes((uint8_t *) &digP1, 0, 2);
        comp.readBytes((uint8_t *) &digP2, 2, 2);
        comp.readBytes((uint8_t *) &digP3, 4, 2);
        comp.readBytes((uint8_t *) &digP4, 6, 2);
        comp.readBytes((uint8_t *) &digP5, 8, 2);
        comp.readBytes((uint8_t *) &digP6, 10, 2);
        comp.readBytes((uint8_t *) &digP7, 12, 2);
        comp.readBytes((uint8_t *) &digP8, 14, 2);
        comp.readBytes((uint8_t *) &digP9, 16, 2);

        // Do the compensation
        int64_t firstConv = ((int64_t) tFine) - 12800;
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
}
