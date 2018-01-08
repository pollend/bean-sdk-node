let lightblue = require("../src/lightblue")
const commandIds = require('../src/command-definitions').commandIds

let sdk = lightblue.sdk()

sdk.on('discover', (scannedDevice)=> {
    // We now have a `ScannedDevice` object, found in src/lightblue/devices.js
    console.log(`\nFound device with name/address: ${scannedDevice.getName()}/${scannedDevice.getAddress()}`)
    sdk.stopScanning()
    sdk.connectScannedDevice(scannedDevice, (err, bean) => {
        // We now have a `LightBlueDevice` object (named bean), found in src/lightblue/devices.js

        if (err) {
            console.log(`Bean connection failed: ${err}`)
        } else {
            bean.lookupServices((err) => {
                // The bean is now ready to be used, you can either call the methods available
                // on the `LightBlueDevice` class, or grab the individual services objects which
                // provide their own API, for example: bean.getDeviceInformationService().

                if (err) {
                    console.log(`Service lookup FAILED: ${err}`)
                } else {
                    bean.getSerialTransportService().registerForCommandNotification(commandIds.SERIAL_DATA, (serialCmd) => {
                        process.stdout.write(`${serialCmd.data}`)
                    })
                }
            })
        }
    })
})

//scan and only filter for bean devices
sdk.startScanning(30,true,(error) =>{
    console.log('');
    if (error) {
        console.log('Command completed with error(s): ' + error);
        quit(1);
    } else {
        console.log('Command completed.');
        quit(0);
    }
})