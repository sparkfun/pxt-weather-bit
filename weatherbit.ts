/**
* Mary West @ SparkFun Electronics 
* Ryan Mortenson https://github.com/ryanjmortenson
* June 13, 2017
* https://github.com/sparkfun/pxt-weather-bit

* Development environment specifics:
* Written in Microsoft PXT
* Tested with a SparkFun weather:bit for micro:bit
*
* This code is released under the [MIT License](http://opensource.org/licenses/MIT).
* Please review the LICENSE.md file included with this example. If you have any questions 
* or concerns with licensing, please contact techsupport@sparkfun.com.
* Distributed as-is; no warranty is given.
*/


/**
 * Functions to operate the weather:bit
 */

//% color=#f44242 icon="\u26C8"
namespace weatherbit {
    // keep track of services
    let rainMonitorStarted = false;
    let windMonitorStarted = false;
    let weatherMonitorStarted = false;
    // Keep Track of weather monitoring variables
    let numRainDumps = 0
    let numWindTurns = 0
    let windMPH = 0

    // BME280 Addresses
    const bmeAddr = 0x76
    const ctrlHum = 0xF2
    const ctrlMeas = 0xF4
    const config = 0xF5
    const pressMSB = 0xF7
    const pressLSB = 0xF8
    const pressXlsb = 0xF9
    const tempMSB = 0xFA
    const tempLSB = 0xFB
    const tempXlsb = 0xFC
    const humMSB = 0xFD
    const humLSB = 0xFE

    // Stores compensation values for Temperature (must be read from BME280 NVM)
    let digT1Val = 0
    let digT2Val = 0
    let digT3Val = 0

    // Stores compensation values for humidity (must be read from BME280 NVM)
    let digH1Val = 0
    let digH2Val = 0
    let digH3Val = 0
    let digH4Val = 0
    let digH5Val = 0
    let digH6Val = 0

    // Buffer to hold pressure compensation values to pass to the C++ compensation function
    let digPBuf: Buffer

    // BME Compensation Parameter Addresses for Temperature
    const digT1 = 0x88
    const digT2 = 0x8A
    const digT3 = 0x8C

    // BME Compensation Parameter Addresses for Pressure
    const digP1 = 0x8E
    const digP2 = 0x90
    const digP3 = 0x92
    const digP4 = 0x94
    const digP5 = 0x96
    const digP6 = 0x98
    const digP7 = 0x9A
    const digP8 = 0x9C
    const digP9 = 0x9E

    // BME Compensation Parameter Addresses for Humidity
    const digH1 = 0xA1
    const digH2 = 0xE1
    const digH3 = 0xE3
    const e5Reg = 0xE5
    const e4Reg = 0xE4
    const e6Reg = 0xE6
    const digH6 = 0xE7

    // Functions for interfacing with the Weather Meters
    function init(): number {
        pins.digitalWritePin(DigitalPin.P12, 0)
        for (let i = 0; i < 600; i++) {

        }
        pins.digitalWritePin(DigitalPin.P12, 1)
        for (let i = 0; i < 30; i++) {

        }
        let returnValue = pins.digitalReadPin(DigitalPin.P13)
        for (let i = 0; i < 600; i++) {

        }
        return returnValue
    }

    function writeBit(bit: number) {
        let delay1, delay2
        if (bit == 1) {
            delay1 = 1
            delay2 = 80
        }
        else {
            delay1 = 75
            delay2 = 6
        }
        pins.digitalWritePin(DigitalPin.P12, 0)
        for (let i = 0; i < delay1; i++) {

        }
        pins.digitalWritePin(DigitalPin.P12, 1)
        for (let i = 0; i < delay2; i++) {

        }
    }

    function writeByte(byte: number) {
        for (let i = 0; i < 8; i++) {
            if (byte & 1) {
                writeBit(1) //This doesn't seem like it will work at all
            } else {
                writeBit(0)
            }
            byte = byte >> 1
        }
    }

    function readBit(): number {
        pins.digitalWritePin(DigitalPin.P12, 0)
        pins.digitalWritePin(DigitalPin.P12, 1)
        for (let i = 0; i < 20; i++) {

        }
        let returnValue = pins.digitalReadPin(DigitalPin.P13)
        for (let i = 0; i < 60; i++) {

        }
        return returnValue
    }

    function readByte(): number {
        let byte = 0
        for (let i = 0; i < 8; i++) {
            byte |= (readBit() << i);
        }
        return byte;
    }

    function convert(): number {
        writeByte(0x44)
        let j
        for (let i = 0; i < 1000; i++) {
            for (j = 0; j < 900; j++) {

            }
            if (readBit() == 1)
                break;
        }
        return j
    }

    /**
    * Reads the number of times the rain gauge has filled and emptied
	* Returns inches of rain. 
    */
    //% weight=30 blockId="weatherbit_rain" block="rain"
    export function rain(): number {
        startRainMonitoring();
        // Will be zero until numRainDumps is greater than 90 = 1"
        let inchesOfRain = ((numRainDumps * 11) / 1000)
        return inchesOfRain
    }

    /**
    * Sets up an event on pin 2 pulse high and event handler to increment rain
    * numRainDumps on said event.
    */
    //% weight=31 blockGap=8  blockId="weatherbit_startRainMonitoring" block="start rain monitoring"
    export function startRainMonitoring(): void {
        if (rainMonitorStarted) return;

        pins.setPull(DigitalPin.P2, PinPullMode.PullUp)

        // Watch pin 2 for a high pulse and send an event
        pins.onPulsed(DigitalPin.P2, PulseValue.High, () => {
            control.raiseEvent(
                EventBusSource.MICROBIT_ID_IO_P2,
                EventBusValue.MICROBIT_PIN_EVT_RISE
            )
        })

        // Register event handler for a pin 2 high pulse
        control.onEvent(EventBusSource.MICROBIT_ID_IO_P2, EventBusValue.MICROBIT_PIN_EVT_RISE, () => {
            numRainDumps++
        })

        // only init once
        rainMonitorStarted = true;
    }

    /**
    * Read the wind direction from the wind vane.  
	* Retuns a string representing the direction (N, E, S, W, NE, NW, SE, SW)
    */
    //% weight=20 blockId="weatherbit_windDir" block="wind direction"
    export function windDirection(): string {
        startWindMonitoring();

        let windDir = 0
        windDir = pins.analogReadPin(AnalogPin.P1)
        if (windDir < 906 && windDir > 886)
            return "N"
        else if (windDir < 712 && windDir > 692)
            return "NE"
        else if (windDir < 415 && windDir > 395)
            return "E"
        else if (windDir < 498 && windDir > 478)
            return "SE"
        else if (windDir < 584 && windDir > 564)
            return "S"
        else if (windDir < 819 && windDir > 799)
            return "SW"
        else if (windDir < 988 && windDir > 968)
            return "W"
        else if (windDir < 959 && windDir > 939)
            return "NW"
        else
            return "???"
    }

    /**
    * Read the instaneous wind speed form the Anemometer. Starting the wind
    * speed monitoring updates the wind in MPH every 2 seconds.
    */
    //% weight=21 blockGap=8 blockId="weatherbit_windSpeed" block="wind speed"
    export function windSpeed(): number {
        startWindMonitoring();

        return windMPH
    }

    /**
    * Sets up an event on pin 8 pulse high and event handler to increment
    * numWindTurns on said event.  Starts background service to reset
    * numWindTurns every 2 seconds and calculate MPH.
    */
    //% weight=22 blockGap=8 blockId="weatherbit_startWindMonitoring" block="start wind monitoring"
    export function startWindMonitoring(): void {
        if (windMonitorStarted) return;

        pins.setPull(DigitalPin.P8, PinPullMode.PullUp)

        // Watch pin 8 for a high pulse and send an event
        pins.onPulsed(DigitalPin.P8, PulseValue.High, () => {
            control.raiseEvent(
                EventBusSource.MICROBIT_ID_IO_P8,
                EventBusValue.MICROBIT_PIN_EVT_RISE
            )
        })

        // Register event handler for a pin 8 high pulse
        control.onEvent(EventBusSource.MICROBIT_ID_IO_P8, EventBusValue.MICROBIT_PIN_EVT_RISE, () => {
            numWindTurns++
        })

        // Update MPH value every 2 seconds
        control.inBackground(() => {
            while (true) {
                basic.pause(2000)
                windMPH = (numWindTurns / 2) / (1492 / 1000)
                numWindTurns = 0
            }
        })

        windMonitorStarted = true;
    }

    /***************************************************************************************
     * Functions for interfacing with the BME280
     ***************************************************************************************/

    /**
     * Writes a value to a register on the BME280
     */
    function WriteBMEReg(reg: number, val: number): void {
        pins.i2cWriteNumber(bmeAddr, reg << 8 | val, NumberFormat.Int16BE)
    }

    /**
     * Reads a value from a register on the BME280
     */
    function readBMEReg(reg: number, format: NumberFormat) {
        pins.i2cWriteNumber(bmeAddr, reg, NumberFormat.UInt8LE, false)
        let val = pins.i2cReadNumber(bmeAddr, format, false)
        return val
    }

    /**
     * Reads the temp from the BME sensor and uses compensation for calculator temperature.
     * Returns 4 digit number. Value should be devided by 100 to get DegC
     */
    //% weight=43 blockGap=8 blockId="weatherbit_temperature" block="temperature(C)"
    export function temperature(): number {
        // Read the temperature registers
        let tempRegM = readBMEReg(tempMSB, NumberFormat.UInt16BE)
        let tempRegL = readBMEReg(tempXlsb, NumberFormat.UInt8LE)

        // Use compensation formula and return result
        return compensateTemp((tempRegM << 4) | (tempRegL >> 4))
    }

    /**
     * Reads the humidity from the BME sensor and uses compensation for calculating humidity.
     * returns a 5 digit number. Value should be divided by 1024 to get % relative humidity. 
     */
    //% weight=41 blockGap=8 blockId="weatherbit_humidity" block="humidity"
    export function humidity(): number {
        // Read the pressure registers
        let humReg = readBMEReg(humMSB, NumberFormat.UInt16BE)

        // Compensate and return humidity
        return compensateHumidity(humReg)
    }

    /**
     * Reads the pressure from the BME sensor and uses compensation for calculating pressure.
     * Returns an 8 digit number. Value should be divided by 25600 to get hPa. 
     */
    //% weight=42 blockGap=8 blockId="pressure" block="pressure"
    export function pressure(): number {
        // Read the temperature registers
        let pressRegM = readBMEReg(pressMSB, NumberFormat.UInt16BE)
        let pressRegL = readBMEReg(pressXlsb, NumberFormat.UInt8LE)

        // Compensate and return pressure
        return compensatePressure((pressRegM << 4) | (pressRegL >> 4), tFine, digPBuf)
    }

    /**
     * Sets up BME for in Weather Monitoring Mode.
     */
    //% weight=44 blockGap=8 blockId="weatherbit_setupBME280" block="start weather monitoring"
    export function startWeatherMonitoring(): void {
        if (weatherMonitorStarted) return;

        // The 0xE5 register is 8 bits where 4 bits go to one value and 4 bits go to another
        let e5Val = 0

        // Instantiate buffer that holds the pressure compensation values
        digPBuf = pins.createBuffer(18)

        // Set up the BME in weather monitoring mode
        WriteBMEReg(ctrlHum, 0x01)
        WriteBMEReg(ctrlMeas, 0x27)
        WriteBMEReg(config, 0)

        // Read the temperature registers to do a calculation and set tFine
        let tempRegM = readBMEReg(tempMSB, NumberFormat.UInt16BE)
        let tempRegL = readBMEReg(tempXlsb, NumberFormat.UInt8LE)

        // Get the NVM digital compensations numbers from the device for temp
        digT1Val = readBMEReg(digT1, NumberFormat.UInt16LE)
        digT2Val = readBMEReg(digT2, NumberFormat.Int16LE)
        digT3Val = readBMEReg(digT3, NumberFormat.Int16LE)

        // Get the NVM digital compensation number from the device for pressure and pack into
        // a buffer to pass to the C++ implementation of the compensation formula
        digPBuf.setNumber(NumberFormat.UInt16LE, 0, readBMEReg(digP1, NumberFormat.UInt16LE))
        digPBuf.setNumber(NumberFormat.Int16LE, 2, readBMEReg(digP2, NumberFormat.Int16LE))
        digPBuf.setNumber(NumberFormat.Int16LE, 4, readBMEReg(digP3, NumberFormat.Int16LE))
        digPBuf.setNumber(NumberFormat.Int16LE, 6, readBMEReg(digP4, NumberFormat.Int16LE))
        digPBuf.setNumber(NumberFormat.Int16LE, 8, readBMEReg(digP5, NumberFormat.Int16LE))
        digPBuf.setNumber(NumberFormat.Int16LE, 10, readBMEReg(digP6, NumberFormat.Int16LE))
        digPBuf.setNumber(NumberFormat.Int16LE, 12, readBMEReg(digP7, NumberFormat.Int16LE))
        digPBuf.setNumber(NumberFormat.Int16LE, 14, readBMEReg(digP8, NumberFormat.Int16LE))
        digPBuf.setNumber(NumberFormat.Int16LE, 16, readBMEReg(digP9, NumberFormat.Int16LE))

        // Get the NVM digital compensation number from device for humidity
        e5Val = readBMEReg(e5Reg, NumberFormat.Int8LE)
        digH1Val = readBMEReg(digH1, NumberFormat.UInt8LE)
        digH2Val = readBMEReg(digH2, NumberFormat.Int16LE)
        digH3Val = readBMEReg(digH3, NumberFormat.UInt8LE)
        digH4Val = (readBMEReg(e4Reg, NumberFormat.Int8LE) << 4) | (e5Val & 0xf)
        digH5Val = (readBMEReg(e6Reg, NumberFormat.Int8LE) << 4) | (e5Val >> 4)
        digH6Val = readBMEReg(digH6, NumberFormat.Int8LE)

        // Compensate the temperature to calcule the tFine variable for use in other
        // measurements
        let temp = compensateTemp((tempRegM << 4) | (tempRegL >> 4))

        weatherMonitorStarted = true;
    }

    // Global variable used in all calculations for the BME280
    let tFine = 0

    /**
     * Returns temperature in DegC, resolution is 0.01 DegC. Output value of “5123” equals 51.23 DegC.
     * tFine carries fine temperature as global value
     */
    function compensateTemp(tempRegVal: number): number {
        let firstConv: number = (((tempRegVal >> 3) - (digT1Val << 1)) * digT2Val) >> 11
        let secConv: number = (((((tempRegVal >> 4) - digT1Val) * ((tempRegVal >> 4) - (digT1Val))) >> 12) * (digT3Val)) >> 14
        tFine = firstConv + secConv
        return (tFine * 5 + 128) >> 8
    }

    /**
     * Returns humidity in %RH as unsigned 32 bit integer in Q22.10 format (22 integer and 10 fractional bits).
     * Output value of “47445” represents 47445/1024 = 46.333 %RH
     */
    function compensateHumidity(humRegValue: number): number {
        let hum: number = (tFine - 76800)
        hum = (((((humRegValue << 14) - (digH4Val << 20) - (digH5Val * hum)) + 16384) >> 15) * (((((((hum * digH6Val) >> 10) * (((hum * digH3Val) >> 11) + 32768)) >> 10) + 2097152) * digH2Val + 8192) >> 14))
        hum = hum - (((((hum >> 15) * (hum >> 15)) >> 7) * digH1Val) >> 4)
        hum = (hum < 0 ? 0 : hum)
        hum = (hum > 419430400 ? 419430400 : hum)
        return (hum >> 12)
    }

    /**
     * Function used for simulator, actual implementation is in weatherbit.cpp
     */
    //%
    function compensatePressure(pressRegVal: number, tFine: number, compensation: Buffer) {
        let digP1: number = (compensation[0] << 8) | compensation[1];
        let digP2: number = (compensation[2] << 8) | compensation[3];
        let digP3: number = (compensation[4] << 8) | compensation[5];
        let digP4: number = (compensation[6] << 8) | compensation[7];
        let digP5: number = (compensation[8] << 8) | compensation[9];
        let digP6: number = (compensation[10] << 8) | compensation[11];
        let digP7: number = (compensation[12] << 8) | compensation[13];
        let digP8: number = (compensation[14] << 8) | compensation[15];
        let digP9: number = (compensation[16] << 8) | compensation[17];

        let firstConv: number = tFine - 128000;
        let secondConv: number = firstConv * firstConv * digP6;
        secondConv += firstConv * digP5 << 17;
        secondConv += digP4 << 35;
        firstConv = ((firstConv * firstConv * digP3) >> 8) + ((firstConv * digP2) << 12);
        firstConv = ((1 << 47) + firstConv) * (digP1 >> 33);
        if (firstConv == 0) {
            return 69; //avoid exception caused by divide by 0
        }
        let pressureReturn = 1048576 - pressRegVal;
        pressureReturn = (((pressureReturn << 31) - secondConv) * 3125) / firstConv;
        firstConv = (digP9 * (pressureReturn << 13) * (pressureReturn << 13)) >> 25;
        secondConv = (digP8 * pressureReturn) >> 19;
        pressureReturn = ((pressureReturn + firstConv + secondConv) >> 8) + (digP7 << 4);
        return pressureReturn;
    }

    /**
   * Reads the pressure from the BME sensor and uses compensation for calculating pressure.
   * Returns altitude in meters based on pressure at sea level. (absolute altitude)
   */
    //% weight=40 blockGap=28 blockId="weatherbit_altitude" block="altitude(M)"
    export function altitude(): number {
        startWeatherMonitoring();

        let pressRegM = readBMEReg(pressMSB, NumberFormat.UInt16BE)
        let pressRegL = readBMEReg(pressXlsb, NumberFormat.UInt8LE)
        return calcAltitude((pressRegM << 4) | (pressRegL >> 4), tFine, digPBuf)
    }

    /** 
     * Function used for simulator, actual implementation is in weatherbit.cpp
     */
    //%
    function calcAltitude(pressRegVal: number, tFine: number, compensation: Buffer): number {
        let returnValue = compensatePressure(pressRegVal, tFine, compensation);
        returnValue /= 25600.0;
        returnValue /= 1013.25;
        returnValue = returnValue ** 0.1903;
        returnValue = 1 - returnValue;
        returnValue *= 44330;
        return returnValue;
    }


    // Functions for interfacing with the soil moisture and soil temperature (aquaponics)


    /**
     * Reads the Moisture Level from the Soil Moisture Sensor.
	 * Returns a value between 0 and 1023. 0 being dry and 1023 being wet.     
     */
    //% weight=11 blockGap=8 blockId="weatherbit_soilMoisture" block="soil moisture"
    export function soilMoisture(): number {
        let soilMoisture = 0
        pins.digitalWritePin(DigitalPin.P16, 1)
        basic.pause(10)
        soilMoisture = pins.analogReadPin(AnalogPin.P0)
        basic.pause(1000)
        pins.digitalWritePin(DigitalPin.P16, 0)
        return soilMoisture
    }
    /**
     * Reads the temperature from the one-wire temperature sensor.
	 * Returns a 4 digit number. value should be divided by 100 to get 
	 * temperature in hudnreths of a degree centigrade. 
     */
    //% weight=10 blockId="weahterbit_soilTemp" block="soil temperature(C)"
    //%
    export function soilTemperature(): number {
        init();
        writeByte(0xCC);
        convert();
        init();
        writeByte(0xCC);
        writeByte(0xBE);
        let soilTempLSB = readByte();
        let soilTempMSB = readByte();
        let temp = ((soilTempMSB << 8) | soilTempLSB);
        temp *= (100 / 16);
        return temp;
    }
}
