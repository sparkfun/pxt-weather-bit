//% deprecated
namespace weatherbit {}

namespace servers {
    function startServers() {
        if (!jacdac.isSimulator()) {
            weatherbit.startRainMonitoring()
            weatherbit.startWindMonitoring()
            const servers: jacdac.Server[] = [
                jacdac.createSimpleSensorServer(
                    "rain gauge",
                    jacdac.SRV_RAIN_GAUGE,
                    "u16.16",
                    () => weatherbit.rain() / 25.4, // inches -> mm
                    {
                        streamingInterval: 30000,
                        readingError: () => 25.4,
                    }
                ),
                jacdac.createSimpleSensorServer(
                    "wind speed",
                    jacdac.SRV_WIND_SPEED,
                    "u16.16",
                    () => weatherbit.windSpeed() * 1.60934,
                    {
                        streamingInterval: 2000,
                        readingError: () => 3,
                    }
                ),
            ]
            for (const server of servers) server.start()
        }
        if (jacdac.checkProxy()) jacdac.proxyFinalize()
    }
    startServers()
}

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
