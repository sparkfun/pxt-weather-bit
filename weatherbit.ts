/**
 * Functions to operate the weather:bit
 */
 
 //Formatting Questions: 
 //1.) Should these variables be within the namespace?
 //2.)  

let num_rain_dumps = 0
let num_wind_turns = 0
let time = 0
const bme_addr = 0x76
const ctrl_hum = 0xf2
const ctrl_meas = 0xf4
const config = 0xf5


//% color=#f44242 icon="\u26C8"
namespace weatherbit {
	/**
	 * Reads the Moisture Level from the Soil Moisture Sensor, displays the value and recommends watering as needed. Must be placed in an event block (e.g. button A)
	 */
    //% blockId="ReadSoilMoisture" block="Read Soil Moisture"
    export function SoilMoisture(): void {
        let Soil_Moisture = 0
        pins.digitalWritePin(DigitalPin.P16, 1)
        basic.pause(10)
        Soil_Moisture = pins.analogReadPin(AnalogPin.P0)
        basic.pause(100)
        basic.showNumber(Soil_Moisture)
        basic.pause(1000)
        pins.digitalWritePin(DigitalPin.P16, 0)
        basic.clearScreen()
        if (Soil_Moisture <= 50) {
            basic.showLeds(`
			. # . # .
			. . . . .
			. # # # .
			# . . . #
			. . . . .
			`)
            basic.pause(5000)
            basic.showString("WATER ME!!")
            basic.pause(5000)
        }
        basic.clearScreen()
        if (Soil_Moisture > 50) {
            basic.showLeds(`
			. # . # .
			. . . . .
			. . . . .
			# . . . #
			. # # # .
			`)
            basic.pause(5000)
        }
        basic.clearScreen()
    }

    /**
    * Reads the number of times the rain gauge has filled and emptied
    */
    //% blockId="ReadRain" block="Read Rain Gauge"
    export function ReadRain(): void {
		let inchesofRain = 0;
        //basic.showNumber(num_rain_dumps)
		inchesofRain=num_rain_dumps*(11/1000) //will be zero until num_rain_dumps is greater than 90 = 1"
		basic.showNumber(inchesofRain)
        basic.clearScreen()
    }

    /**
    * Starts polling the digital pin that the rain gauge is on counting the number of times the gauge has filled
    * and emptied.  This should be done with interrupts, but I can't seem to find a way to use interrupts using pxt
    */
    //% blockId="StartRainPolling" block="Starts the Rain Gauge Monitoring"
    export function StartRainPolling(): void {
        let rain_gauge = 0
        control.inBackground(() => {
            while (true) {
                basic.pause(10)
                rain_gauge = pins.digitalReadPin(DigitalPin.P2)
                if (!rain_gauge) {
                    num_rain_dumps++
                    basic.pause(100)
                }
            }
        })
    }

    /**
     * Read the wind direction form the wind vane.  The mapping is slightly different from the data sheet because the
     * input voltage is 3.3V instead of 5V and the pull up resistor is 4.7K instead of 10K.
     */
    //% blockId="ReadWindDir" block="Read Wind Vane"
    export function ReadWindDir(): void {
        let wind_dir = 0
        wind_dir = pins.analogReadPin(AnalogPin.P1)
        basic.showNumber(wind_dir)
        if (wind_dir < 906 && wind_dir > 886)
            basic.showString("N")
        else if (wind_dir < 712 && wind_dir > 692)
            basic.showString("NE")
        else if (wind_dir < 415 && wind_dir > 395)
            basic.showString("E")
        else if (wind_dir < 498 && wind_dir > 478)
            basic.showString("SE")
        else if (wind_dir < 584 && wind_dir > 564)
            basic.showString("S")
        else if (wind_dir < 819 && wind_dir > 799)
            basic.showString("SW")
        else if (wind_dir < 988 && wind_dir > 968)
            basic.showString("W")
        else if (wind_dir < 959 && wind_dir > 939)
            basic.showString("NW")
        else
            basic.showString("?")
        basic.pause(10)
    }
	/**
     * Read the instaneous wind speed form the Anemometer. This is accomplished by polling the digital Pin that the anemometer is on
	 * coutning the number of times a full rotation occurs in one second - get the number of rotations/second and multiply by 1.492 for MPH. 
     */
	//% blockId="ReadWindSpeed" block="Read Wind Speed"
    export function ReadWindSpeed(): void {
		let wind_speed=0
		//basic.showNumber(num_wind_turns)
		wind_speed = (num_wind_turns)*(1492/1000)
		basic.showNumber(wind_speed)
        basic.clearScreen()
    }
	/**
     * Starts polling the digital pin connected to the Anemometer. 1 count of the switch per second is equal to 1.492MPH
	 * Since we are keeping track of time, best to use this block on a button press so the poll time is accurate. 
     */
	//% blockId="StartWindPolling" block="Start the Wind Anemometer Monitoring"
	export function StartWindPolling(): void {
		time=0
		time=input.runningTime()
		for (time <= 1000)
		{
			let wind_gauge = 0
			control.inBackground(() => 
			{
				while (true) 
				{
					basic.pause(10)
					wind_gauge = pins.digitalReadPin(DigitalPin.P8)
					if (!wind_gauge) 
					{
						num_wind_turns++
						basic.pause(10)
					}
				}
			
			})
			
		}
	time=0
	}

    // Do a write on the requested BME register
    function WriteBMEReg(reg: number, val: number): void {
        pins.i2cWriteNumber(bme_addr, reg << 8 | val, NumberFormat.Int16BE)
    }

    // Do a read on the reqeusted BME register
    function ReadBMEReg(reg: number) {
        let val = 0
        pins.i2cWriteNumber(bme_addr, reg, NumberFormat.UInt8LE, false)
        val = pins.i2cReadNumber(bme_addr, NumberFormat.UInt8LE, false)
        basic.showNumber(val)
        return val
    }

    // Test a read write on the hum register on the BME
    //% blockId="TestBmeFunctions" block="Test the BME i2c read write functionality"
    export function TestBmeFunctions(): void {
        WriteBMEReg(ctrl_hum, 3)
        let data = ReadBMEReg(ctrl_hum)
        basic.showNumber(data)
    }

    // Test a read write on the hum register on the BME
    //% blockId="SetupBMESensor" block="Set up the BME Sensor"
    export function SetupBMESensor(): void {
        WriteBMEReg(ctrl_hum, 0x01)
        let hum = ReadBMEReg(ctrl_hum)
        WriteBMEReg(ctrl_meas, 0x25)
        let meas = ReadBMEReg(ctrl_meas)
        WriteBMEReg(config, 0)
        let cfg = ReadBMEReg(config)
        //basic.showString("h:")
        //basic.showNumber(hum)
        //basic.showString("m:")
        //basic.showNumber(meas)
        //basic.showString("c:")
        //basic.showNumber(cfg)
        let hum_lsb = ReadBMEReg(0xfe)
        let hum_msb = ReadBMEReg(0xfd)
        basic.showNumber(hum_lsb)
        basic.showNumber(hum_msb)
    }
}


