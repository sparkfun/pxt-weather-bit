//% deprecated
namespace weatherbit { }

namespace modules {
    /**
     * Rain gauge from the weather:bit
     */
    //% fixedInstance whenUsed block="weatherbit rain"
    export const weatherbitRain = new modules.RainGaugeClient(
        "weatherbit rain?device=self"
    )

    /**
     * Wind speed from weather:bit
     */
    //% fixedInstance whenUsed block="weatherbit wind speed"
    export const weatherbitWindSpeed = new modules.WindSpeedClient("weatherbit wind speed?device=self")
}

namespace servers {
    function start() {
        jacdac.startSelfServers(() => {
            weatherbit.startRainMonitoring()
            weatherbit.startWindMonitoring()
            const servers: jacdac.Server[] = [
                jacdac.createSimpleSensorServer(
                    jacdac.SRV_RAIN_GAUGE,
                    jacdac.RainGaugeRegPack.Precipitation,
                    () => weatherbit.rain() / 25.4, // inches -> mm
                    {
                        streamingInterval: 30000,
                        readingError: () => 25.4,
                    }
                ),
                jacdac.createSimpleSensorServer(
                    jacdac.SRV_WIND_SPEED,
                    jacdac.WindSpeedRegPack.WindSpeed,
                    () => weatherbit.windSpeed() * 1.60934,
                    {
                        streamingInterval: 2000,
                        readingError: () => 3,
                    }
                ),
            ]
            return servers
        })
    }
    start()
}
