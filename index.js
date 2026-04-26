const connectBot = require("./connect")
const handler = require("./handler")
const buyModule = require("./command/user/buy")

async function start() {
  const sock = await connectBot()

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg?.message) return

    await handler(sock, msg)
  })

  sock.ev.on("group-participants.update", async (update) => {
    await handler.handleGroupParticipantsUpdate(sock, update)
  })
}

start()