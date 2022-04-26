//% deprecated
namespace weatherbit { }

namespace modules {
    /**
     * Rain gauge from the weather:bit
     */
    //% fixedInstance whenUsed block="weatherbit rain"
    export const weatherbitRain = new modules.RainGaugeClient(
        "weatherbit rain?dev=self"
    )

    /**
     * Wind speed from weather:bit
     */
    //% fixedInstance whenUsed block="weatherbit wind speed"
    export const weatherbitWindSpeed = new modules.WindSpeedClient("weatherbit wind speed?dev=self")
}

namespace servers {
    jacdac.productIdentifier = 0x36dccd5c
    function start() {
        jacdac.startSelfServers(() => {
            const servers: jacdac.Server[] = [
                jacdac.createSimpleSensorServer(
                    jacdac.SRV_RAIN_GAUGE,
                    jacdac.RainGaugeRegPack.Precipitation,
                    () => weatherbit.rain() / 25.4, // inches -> mm
                    {
                        streamingInterval: 30000,
                        readingError: () => 25.4,
                        statusCode: jacdac.SystemStatusCodes.Initializing
                    }
                ),
                jacdac.createSimpleSensorServer(
                    jacdac.SRV_WIND_SPEED,
                    jacdac.WindSpeedRegPack.WindSpeed,
                    () => weatherbit.windSpeed() * 1.60934,
                    {
                        streamingInterval: 2000,
                        readingError: () => 3,
                        statusCode: jacdac.SystemStatusCodes.Initializing
                    }
                ),
            ]

            // booting
            control.inBackground(() => {
                weatherbit.startRainMonitoring()
                weatherbit.startWindMonitoring()
                for(const server of servers)
                    server.setStatusCode(jacdac.SystemStatusCodes.Ready)
            })

            // return servers
            return servers
        })
    }
    start()
}
