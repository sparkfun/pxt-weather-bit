/**
 * Functions to operate the weather:bit
 */

let numRainDumps = 0
let numWindTurns = 0
let windMPH = 0

//% color=#f44242 icon="\u26C8"
namespace weatherbit {

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

    // Values read from NVM for compensation
    let digT1Val = 0
    let digT2Val = 0
    let digT3Val = 0
    let digP1Val = 0
    let digP2Val = 0
    let digP3Val = 0
    let digP4Val = 0
    let digP5Val = 0
    let digP6Val = 0
    let digP7Val = 0
    let digP8Val = 0
    let digP9Val = 0
    let digH1Val = 0
    let digH2Val = 0
    let digH3Val = 0
    let digH4Val = 0
    let digH5Val = 0
    let digH6Val = 0

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

    /**
     * Function used for simulator, actual implementation is in weatherbit.cpp
     */
    //% shim=weatherbit::compensatePressure
    function compensatePressure(pressRegVal: number, tFine: number, compensation: Buffer) {
        // Fake function for simulator
        return 0
    }

    /**
    * Reads the Moisture Level from the Soil Moisture Sensor, displays the
    * value and recommends watering as needed. Must be placed in an event
    * block (e.g. button A)
    */
    //% blockId="ReadSoilMoisture" block="Read Soil Moisture"
    export function SoilMoisture(): number {
        let soilMoisture = 0
        pins.digitalWritePin(DigitalPin.P16, 1)
        basic.pause(10)
        soilMoisture = pins.analogReadPin(AnalogPin.P0)
        basic.pause(1000)
        pins.digitalWritePin(DigitalPin.P16, 0)
        basic.clearScreen()
        return soilMoisture
    }

    /**
    * Reads the number of times the rain gauge has filled and emptied
    */
    //% blockId="ReadRain" block="Read Rain Gauge"
    export function ReadRain(): number {
        // Will be zero until numRainDumps is greater than 90 = 1"
        let inchesOfRain = ((numRainDumps * 11) / 1000)
        return inchesOfRain
    }

    /**
    * Sets up an event on pin 2 pulse high and event handler to increment rain
    * numRainDumps on said event.
    */
    //% blockId="StartRainPolling" block="Starts the Rain Gauge Monitoring"
    export function StartRainPolling(): void {
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
    }

    /**
    * Read the wind direction from the wind vane.  The mapping is slightly
    * different from the data sheet because the input voltage is 3.3V
    * instead of 5V and the pull up resistor is 4.7K instead of 10K.
    * Returns direction in a string
    */
    //% blockId="ReadWindDir" block="Read Wind Vane"
    export function ReadWindDir(): string {
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
    * speed monitoring updates the wind_mph every 2 seconds.
    */
    //% blockId="ReadWindSpeed" block="Read Wind Speed"
    export function ReadWindSpeed(): number {
        return windMPH
    }

    /**
    * Sets up an event on pin 8 pulse high and event handler to increment
    * num_wind_turns on said event.  Starts background service to reset
    * num_wind_turns every 2 seconds and calculate MPH.
    */
    //% blockId="StartWindPolling" block="Start the Wind Anemometer Monitoring"
    export function StartWindPolling(): void {
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
    }

    /**
     * Writes a value to a register on the BME280
     */
    function WriteBMEReg(reg: number, val: number): void {
        pins.i2cWriteNumber(bmeAddr, reg << 8 | val, NumberFormat.Int16BE)
    }

    /**
     * Reads a value from a register on the BME280
     */
    function ReadBMEReg(reg: number, format: NumberFormat) {
        pins.i2cWriteNumber(bmeAddr, reg, NumberFormat.UInt8LE, false)
        let val = pins.i2cReadNumber(bmeAddr, format, false)
        return val
    }


    /**
     * Reads the temp from the BME sensor and uses compensation for calculator temperature.
     * Value should be devided by 100 to get DegC
     */
    //% blockId="GetTemperature" block="Get the current temperature"
    export function GetTemperature(): number {
        // Read the temperature registers
        let tempRegM = ReadBMEReg(tempMSB, NumberFormat.UInt16BE)
        let tempRegL = ReadBMEReg(tempXlsb, NumberFormat.UInt8LE)

        // Use compensation formula and return result
        return compensateTemp((tempRegM << 4) | (tempRegL >> 4))
    }

    /**
     * Reads the humidity from the BME sensor and uses compensation for calculating humidity.
     * Value should be devided by 100 to get DegC
     */
    //% blockId="GetHumidity" block="Get the current humidity"
    export function GetHumidity(): number {
        // Read the pressure registers
        let humReg = ReadBMEReg(humMSB, NumberFormat.UInt16BE)

        // Compensate and return humidity
        return compensateHumidity(humReg)
    }

    /**
     * Reads the pressure from the BME sensor and uses compensation for calculating pressure.
     * Value should be devided by 100 to get DegC
     */
    //% blockId="GetPressure" block="Get the current pressure"
    export function GetPressure(): number {
        // Read the temperature registers
        let pressRegM = ReadBMEReg(pressMSB, NumberFormat.UInt16BE)
        let pressRegL = ReadBMEReg(pressXlsb, NumberFormat.UInt8LE)

        // Fill out a buffer with compensation values to be unpacked in the
        // C++ implementation of compensatePressure
        let digPBuf = pins.createBuffer(18)
        digPBuf.setNumber(NumberFormat.UInt16LE, 0, digP1Val)
        digPBuf.setNumber(NumberFormat.Int16LE, 2, digP2Val)
        digPBuf.setNumber(NumberFormat.Int16LE, 4, digP3Val)
        digPBuf.setNumber(NumberFormat.Int16LE, 6, digP4Val)
        digPBuf.setNumber(NumberFormat.Int16LE, 8, digP5Val)
        digPBuf.setNumber(NumberFormat.Int16LE, 10, digP6Val)
        digPBuf.setNumber(NumberFormat.Int16LE, 12, digP7Val)
        digPBuf.setNumber(NumberFormat.Int16LE, 14, digP8Val)
        digPBuf.setNumber(NumberFormat.Int16LE, 16, digP9Val)

        // Compensate and return pressure
        return compensatePressure((pressRegM << 4) | (pressRegL >> 4), tFine, digPBuf)
    }

    /**
     * Sets up BME for in Weather Monitoring Mode.
     */
    //% blockId="S" block="Set up the BME Sensor"
    export function GetWeatherData(): void {
        // The 0xE5 register is 8 bits where 4 bits go to one value and 4 bits go to another
        let e5Val = 0

        // Set up the BME in weather monitoring mode
        WriteBMEReg(ctrlHum, 0x01)
        WriteBMEReg(ctrlMeas, 0x25)
        WriteBMEReg(config, 0)

        // Read the temperature registers to do a calculation and set tFine
        let tempRegM = ReadBMEReg(tempMSB, NumberFormat.UInt16BE)
        let tempRegL = ReadBMEReg(tempXlsb, NumberFormat.UInt8LE)

        // Get the NVM digital compensations numbers from the device for temp
        digT1Val = ReadBMEReg(digT1, NumberFormat.UInt16LE)
        digT2Val = ReadBMEReg(digT2, NumberFormat.Int16LE)
        digT3Val = ReadBMEReg(digT3, NumberFormat.Int16LE)

        // Get the NVM digital compensation number from the device for pressure
        digP1Val = ReadBMEReg(digP1, NumberFormat.UInt16LE)
        digP2Val = ReadBMEReg(digP2, NumberFormat.Int16LE)
        digP3Val = ReadBMEReg(digP3, NumberFormat.Int16LE)
        digP4Val = ReadBMEReg(digP4, NumberFormat.Int16LE)
        digP5Val = ReadBMEReg(digP5, NumberFormat.Int16LE)
        digP6Val = ReadBMEReg(digP6, NumberFormat.Int16LE)
        digP7Val = ReadBMEReg(digP7, NumberFormat.Int16LE)
        digP8Val = ReadBMEReg(digP8, NumberFormat.Int16LE)
        digP9Val = ReadBMEReg(digP9, NumberFormat.Int16LE)

        // Get the NVM digital compensation number from device for humidity
        e5Val = ReadBMEReg(e5Reg, NumberFormat.Int8LE)
        digH1Val = ReadBMEReg(digH1, NumberFormat.UInt8LE)
        digH2Val = ReadBMEReg(digH2, NumberFormat.Int16LE)
        digH3Val = ReadBMEReg(digH3, NumberFormat.UInt8LE)
        digH4Val = (ReadBMEReg(e4Reg, NumberFormat.Int8LE) << 4) | (e5Val & 0xf)
        digH5Val = (ReadBMEReg(e6Reg, NumberFormat.Int8LE) << 4) | (e5Val >> 4)
        digH6Val = ReadBMEReg(digH6, NumberFormat.Int8LE)

        // Compensate the temperature to calcule the tFine variable for use in other
        // measurements
        let temp = compensateTemp((tempRegM << 4) | (tempRegL >> 4))
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
}
