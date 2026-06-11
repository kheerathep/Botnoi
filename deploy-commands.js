// ==============================================
// deploy-commands.js — ลงทะเบียน Slash Commands กับ Discord API
// รันคำสั่ง: node deploy-commands.js
// ==============================================

require("dotenv").config();

const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");


// ตรวจสอบค่า config ที่จำเป็น
const { TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!TOKEN || !CLIENT_ID) {
    console.error("❌ กรุณาตั้งค่า TOKEN และ CLIENT_ID ในไฟล์ .env");
    console.error("   CLIENT_ID คือ Application ID จาก Discord Developer Portal");
    process.exit(1);
}


// ========================================
// อ่านข้อมูล commands ทั้งหมดจากโฟลเดอร์ commands/
// ========================================
const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ("data" in command) {
        commands.push(command.data.toJSON());
        console.log(`📦 พบคำสั่ง: /${command.data.name}`);
    }
}

console.log(`\n🔄 กำลังลงทะเบียน ${commands.length} คำสั่ง...\n`);


// ========================================
// ลงทะเบียนกับ Discord API
// ========================================
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    try {
        if (GUILD_ID) {
            // ลงทะเบียนแบบ Guild-specific (อัปเดตทันที — เหมาะสำหรับ dev)
            const data = await rest.put(
                Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
                { body: commands }
            );
            console.log(`✅ ลงทะเบียนสำเร็จ! (${data.length} คำสั่ง — Guild: ${GUILD_ID})`);
            console.log("📝 หมายเหตุ: ลงทะเบียนแบบ Guild — อัปเดตทันที");
        } else {
            // ลงทะเบียนแบบ Global (อาจใช้เวลา ~1 ชั่วโมงกว่าจะอัปเดต)
            const data = await rest.put(
                Routes.applicationCommands(CLIENT_ID),
                { body: commands }
            );
            console.log(`✅ ลงทะเบียนสำเร็จ! (${data.length} คำสั่ง — Global)`);
            console.log("⚠️  หมายเหตุ: ลงทะเบียนแบบ Global — อาจใช้เวลาถึง 1 ชั่วโมงกว่าจะเห็นในเซิร์ฟเวอร์");
        }
    } catch (error) {
        console.error("❌ เกิดข้อผิดพลาดในการลงทะเบียนคำสั่ง:");
        console.error(error);
    }
})();
