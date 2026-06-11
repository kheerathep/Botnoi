const { ActivityType } = require("discord.js");
const { countInterns } = require("../utils/csv");
const { getInternCountFromSheets } = require("../utils/sheets");


module.exports = {
    name: "ready",
    once: true, // ทำงานครั้งเดียว

    execute(client) {
        console.log("═══════════════════════════════════════");
        console.log(`🤖 BOT ONLINE: ${client.user.tag}`);
        console.log(`📡 Ping: ${client.ws.ping} ms`);
        console.log(`🖥️  Servers: ${client.guilds.cache.size}`);
        console.log(`📋 Commands: ${client.commands.size}`);
        console.log("═══════════════════════════════════════");

        // ตั้ง Activity Status — แสดงจำนวนสมาชิกที่ลงทะเบียนแล้ว
        updateActivity(client);

        // อัปเดต Activity ทุก 5 นาที (เพราะจำนวน intern อาจเปลี่ยน)
        setInterval(() => updateActivity(client), 5 * 60 * 1000);
    },
};


/**
 * อัปเดต Activity Status ของบอท
 * แสดง "ดูแล X สมาชิก | /register"
 */
async function updateActivity(client) {
    let count = await getInternCountFromSheets();

    // Fallback เป็น CSV หากดึงจาก Sheets ไม่ได้
    if (count === null) {
        count = countInterns();
    }

    client.user.setActivity(
        `ดูแล ${count} สมาชิก`,
        { type: ActivityType.Watching }
    );
}
