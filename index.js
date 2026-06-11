// ==============================================
// index.js — Entry Point ของบอท Academy
// โหลด Commands + Events อัตโนมัติจากโฟลเดอร์
// ==============================================

// โหลดค่า config จากไฟล์ .env
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const {
    Client,
    Collection,
    GatewayIntentBits,
} = require("discord.js");


// ========================================
// สร้าง Client พร้อม Intents ที่จำเป็น
// ========================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,           // เข้าถึงเซิร์ฟเวอร์
        GatewayIntentBits.GuildMessages,    // เข้าถึงข้อความ
        GatewayIntentBits.GuildMembers,     // จัดการสมาชิก + Role
        GatewayIntentBits.MessageContent,   // อ่านเนื้อหาข้อความ
    ],
});


// ========================================
// โหลด Slash Commands จากโฟลเดอร์ commands/
// ========================================
client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    // ตรวจสอบว่าไฟล์มี data และ execute ครบ
    if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
        console.log(`📦 โหลดคำสั่ง: /${command.data.name}`);
    } else {
        console.warn(`⚠️  ไฟล์ ${file} ไม่มี "data" หรือ "execute" — ข้าม`);
    }
}


// ========================================
// โหลด Event Handlers จากโฟลเดอร์ events/
// ========================================
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    // ผูก event กับ client — once หรือ on ตาม property
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }

    console.log(`🔗 โหลด event: ${event.name} (${event.once ? "once" : "on"})`);
}


// ========================================
// Graceful Shutdown — ปิดบอทอย่างสมบูรณ์
// ========================================
function gracefulShutdown(signal) {
    console.log(`\n⏹️  ได้รับ ${signal} — กำลังปิดบอท...`);
    client.destroy();
    console.log("👋 บอทปิดเรียบร้อย");
    process.exit(0);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));


// ========================================
// ล็อกอินบอทด้วย TOKEN
// ========================================
client.login(process.env.TOKEN);
