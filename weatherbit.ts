/**
 * Functions to operate the weather:bit
 */




let numRainDumps = 0
let numWindTurns = 0
let windMPH = 0

//% color=#f44242 icon="\u26C8"
namespace weatherbit {
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
    //Compensation Parameter Storage
    const digT1 = 0x88
    const digT2 = 0x8A
    const digT3 = 0x8C
    const digP1 = 0x8E
    const digP2 = 0x90
    const digP3 = 0x92
    const digP4 = 0x94
    const digP5 = 0x96
    const digP6 = 0x98
    const digP7 = 0x9A
    const digP8 = 0x9C
    const digP9 = 0x9E
    const digH1 = 0xA1
    const digH2 = 0xE1
    const digH3 = 0xE3
    const digH4 = 0xE4
    const digH5 = 0xE5
    const digH6 = 0xE7

    /**
    * Reads the Moisture Level from the Soil Moisture Sensor, displays the
    * value and recommends watering as needed. Must be placed in an event
    *block (e.g. button A)
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

    // Do a write on the requested BME register
    function WriteBMEReg(reg: number, val: number): void {
        pins.i2cWriteNumber(bmeAddr, reg << 8 | val, NumberFormat.Int16BE)
    }

    // Do a read on the reqeusted BME register
    function ReadBMEReg(reg: number) {
        pins.i2cWriteNumber(bmeAddr, reg, NumberFormat.UInt8LE, false)
        let val = pins.i2cReadNumber(bmeAddr, NumberFormat.UInt8LE, false)
        return val
    }

    // Sets up BME for in Weather Monitoring Mode.
    //% blockId="S" block="Set up the BME Sensor"
    export function GetWeatherData(): void {
        WriteBMEReg(ctrlHum, 0x01)
        let hum = ReadBMEReg(ctrlHum)
        WriteBMEReg(ctrlMeas, 0x25)
        let meas = ReadBMEReg(ctrlMeas)
        WriteBMEReg(config, 0)
        let cfg = ReadBMEReg(config)
    }
}

/*
// Returns temperature in DegC, resolution is 0.01 DegC. Output value of “5123” equals 51.23 DegC.
// t_fine carries fine temperature as global value
BME280_S32_t t_fine;
BME280_S32_t BME280_compensate_T_int32(BME280_S32_t adc_T)
{
BME280_S32_t var1, var2, T;
var1 = ((((adc_T>>3) – ((BME280_S32_t)dig_T1<<1))) * ((BME280_S32_t)dig_T2)) >> 11;
var2 = (((((adc_T>>4) – ((BME280_S32_t)dig_T1)) * ((adc_T>>4) – ((BME280_S32_t)dig_T1))) >> 12) *
((BME280_S32_t)dig_T3)) >> 14;
t_fine = var1 + var2;
T = (t_fine * 5 + 128) >> 8;
return T;
}
BME280_U32_t BME280_compensate_P_int64(BME280_S32_t adc_P)
{
BME280_S64_t var1, var2, p;
var1 = ((BME280_S64_t)t_fine) – 128000;
var2 = var1 * var1 * (BME280_S64_t)dig_P6;
var2 = var2 + ((var1*(BME280_S64_t)dig_P5)<<17);
var2 = var2 + (((BME280_S64_t)dig_P4)<<35);
var1 = ((var1 * var1 * (BME280_S64_t)dig_P3)>>8) + ((var1 * (BME280_S64_t)dig_P2)<<12);
var1 = (((((BME280_S64_t)1)<<47)+var1))*((BME280_S64_t)dig_P1)>>33;
if (var1 == 0)
{
return 0; // avoid exception caused by division by zero
}
p = 1048576-adc_P;
p = (((p<<31)-var2)*3125)/var1;
var1 = (((BME280_S64_t)dig_P9) * (p>>13) * (p>>13)) >> 25;
var2 = (((BME280_S64_t)dig_P8) * p) >> 19;
p = ((p + var1 + var2) >> 8) + (((BME280_S64_t)dig_P7)<<4);
return (BME280_U32_t)p;
}
// Returns humidity in %RH as unsigned 32 bit integer in Q22.10 format (22 integer and 10 fractional bits).
// Output value of “47445” represents 47445/1024 = 46.333 %RH
BME280_U32_t bme280_compensate_H_int32(BME280_S32_t adc_H)
{
BME280_S32_t v_x1_u32r;
v_x1_u32r = (t_fine – ((BME280_S32_t)76800));
v_x1_u32r = (((((adc_H << 14) – (((BME280_S32_t)dig_H4) << 20) – (((BME280_S32_t)dig_H5) * v_x1_u32r)) +
((BME280_S32_t)16384)) >> 15) * (((((((v_x1_u32r * ((BME280_S32_t)dig_H6)) >> 10) * (((v_x1_u32r *((BME280_S32_t)dig_H3)) >> 11) + ((BME280_S32_t)32768))) >> 10) + ((BME280_S32_t)2097152)) *
((BME280_S32_t)dig_H2) + 8192) >> 14));
v_x1_u32r = (v_x1_u32r – (((((v_x1_u32r >> 15) * (v_x1_u32r >> 15)) >> 7) * ((BME280_S32_t)dig_H1)) >> 4));
v_x1_u32r = (v_x1_u32r < 0 ? 0 : v_x1_u32r);
v_x1_u32r = (v_x1_u32r > 419430400 ? 419430400 : v_x1_u32r);
return (BME280_U32_t)(v_x1_u32r>>12);
}

*/
