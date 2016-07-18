'use strict'


const BleService = require ('./base')
const util = require('../util/util')
const commands = require('../command-definitions')
const buffer = require('buffer')


const BLE_MAX_PACKET_LENGTH = 20
const UUID_SERVICE_SERIAL_TRANSPORT = util.normalizeUUID('a495ff10c5b14b44b5121370f02d74de', 16)
const UUID_CHAR_SERIAL_TRANSPORT = util.normalizeUUID('A495FF11C5B14B44B5121370F02D74DE', 16)


class LightBluePacket {
  constructor(first, packetCount, packetsRemaining, payload) {
    if (payload.length > 19) {
      console.log("Payload length cannot be greater than 19")
    }
    this._first = first
    this._packetCount = packetCount
    this._packetsRemaining = packetsRemaining
    this._payload = payload
  }

  pack() {
    let headerBuf = new buffer.Buffer(1)
    let header = (this._first ? 0x80 : 0) | ((this._packetCount << 5) & 0x60) | ((this._packetsRemaining & 0x1f))
    headerBuf.writeUInt8(header, 0)
    return buffer.Buffer.concat([headerBuf, this._payload], headerBuf.length + this._payload.length)
  }

}


class SerialTransportService extends BleService {
  /**
   * Custom LightBlue Serial Transport Service
   *
   * @param characteristics
   * @param nobleService
   */

  constructor(characteristics, nobleService) {
    super(characteristics, nobleService)

    this._packetCount = 0
  }

  _sendLightBluePacket(packet) {
    let packed = packet.pack()
    console.log(`Sending LightBlue Packet: ${packed.toString()}`)
    this._characteristics[UUID_CHAR_SERIAL_TRANSPORT].write(packed, true, (err)=> {
      if (err) {
        console.log(`Error sending LightBlue Packet: ${err}`)
      }
    })
  }

  getName() {
    return 'Serial Transport Service'
  }

  sendCommand(commandId, payloadArguments, completedCallback) {
    /**
     * Send a LightBlue Command
     *
     * @param commandId int command ID
     * @param payloadArguments list of command arguments
     * @param completedCallback function called back when command is sent
     */

    let defn = commands.definitionForCommand(commandId)
    let command = new commands.Command(commandId, defn)
    let packetPayload = command.pack.apply(command, payloadArguments)

    if (packetPayload.length < (BLE_MAX_PACKET_LENGTH - 1)) {
      this._packetCount = (this._packetCount + 1) % 4
      this._sendLightBluePacket(new LightBluePacket(true, this._packetCount, 0, packetPayload))
    }
  }

}


module.exports = {
  SerialTransportService: SerialTransportService,
  UUID: UUID_SERVICE_SERIAL_TRANSPORT,
  characteristics: {
    UUID_CHAR_SERIAL_TRANSPORT: UUID_CHAR_SERIAL_TRANSPORT
  },
  commandIds: commands.commandIds,
}