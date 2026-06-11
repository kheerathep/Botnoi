// ==============================================
// utils/embeds.js — สร้าง Embed messages สวยๆ สำหรับบอท Academy
// ==============================================

const { EmbedBuilder } = require("discord.js");


// 🎨 สี Theme ของทีม Academy
const COLORS = {
    PRIMARY: 0x5865F2,    // Discord Blurple
    SUCCESS: 0x57F287,    // เขียว
    ERROR: 0xED4245,      // แดง
    WARNING: 0xFEE75C,    // เหลือง
    INFO: 0x5865F2,       // น้ำเงิน
    INTRO: 0xEB459E,      // ชมพู — สำหรับแนะนำตัว
};


/**
 * สร้าง Embed แนะนำตัวสมาชิกใหม่ — ส่งไปที่ Intro Channel
 * @param {object} data - ข้อมูล intern
 * @param {import("discord.js").User} user - Discord User object
 * @returns {EmbedBuilder}
 */
function createIntroEmbed(data, user) {
    return new EmbedBuilder()
        .setColor(COLORS.INTRO)
        .setTitle("🎉 สมาชิกใหม่เข้าร่วมทีม Academy!")
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
            { name: "👤 ชื่อจริง", value: data.name, inline: true },
            { name: "🏷️ ชื่อเล่น", value: data.nickname, inline: true },
            { name: "🎂 อายุ", value: data.age, inline: true },
            { name: "💼 ตำแหน่ง", value: data.position, inline: true },
            { name: "⏳ ระยะเวลาฝึกงาน", value: data.duration, inline: true },
            { name: "🎓 มหาวิทยาลัย", value: data.university, inline: true }
        )
        .setFooter({ text: `ลงทะเบียนโดย ${user.tag}`, iconURL: user.displayAvatarURL() })
        .setTimestamp();
}


/**
 * สร้าง Embed สเตตัสบอท
 * @param {import("discord.js").Client} client - Discord Client
 * @param {number} internCount - จำนวน intern ที่ลงทะเบียนแล้ว
 * @returns {EmbedBuilder}
 */
function createStatusEmbed(client, internCount) {
    // คำนวณ Uptime
    const uptime = client.uptime;
    const hours = Math.floor(uptime / 3600000);
    const minutes = Math.floor((uptime % 3600000) / 60000);
    const seconds = Math.floor((uptime % 60000) / 1000);
    const uptimeStr = `${hours} ชั่วโมง ${minutes} นาที ${seconds} วินาที`;

    // Memory usage
    const memUsage = process.memoryUsage();
    const memMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);

    return new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle("📊 สเตตัสบอท Academy")
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
            { name: "🟢 สถานะ", value: "ออนไลน์", inline: true },
            { name: "⏰ Uptime", value: uptimeStr, inline: true },
            { name: "🏓 Ping", value: `${client.ws.ping} ms`, inline: true },
            { name: "👥 สมาชิกลงทะเบียน", value: `${internCount} คน`, inline: true },
            { name: "🖥️ เซิร์ฟเวอร์", value: `${client.guilds.cache.size} เซิร์ฟเวอร์`, inline: true },
            { name: "💾 Memory", value: `${memMB} MB`, inline: true }
        )
        .setFooter({ text: `Bot: ${client.user.tag}` })
        .setTimestamp();
}


/**
 * สร้าง Embed ข้อความสำเร็จ
 * @param {string} title - หัวข้อ
 * @param {string} description - รายละเอียด
 * @returns {EmbedBuilder}
 */
function createSuccessEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setTitle(`✅ ${title}`)
        .setDescription(description)
        .setTimestamp();
}


/**
 * สร้าง Embed ข้อความ Error
 * @param {string} title - หัวข้อ
 * @param {string} description - รายละเอียด
 * @returns {EmbedBuilder}
 */
function createErrorEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(COLORS.ERROR)
        .setTitle(`❌ ${title}`)
        .setDescription(description)
        .setTimestamp();
}


/**
 * สร้าง Embed สำหรับคำสั่ง /ping
 * @param {number} latency - WebSocket latency (ms)
 * @returns {EmbedBuilder}
 */
function createPingEmbed(latency) {
    return new EmbedBuilder()
        .setColor(COLORS.INFO)
        .setTitle("🏓 Pong!")
        .addFields(
            { name: "📡 WebSocket Latency", value: `${latency} ms`, inline: true }
        )
        .setTimestamp();
}


/**
 * สร้าง Embed สำหรับคำสั่ง /hello
 * @param {import("discord.js").User} user - Discord User
 * @returns {EmbedBuilder}
 */
function createHelloEmbed(user) {
    return new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(`👋 สวัสดีครับ ${user.displayName}!`)
        .setDescription("ยินดีต้อนรับสู่ทีม **Academy** 🎓\nพิมพ์ `/register` เพื่อลงทะเบียนฝึกงานได้เลย!")
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setTimestamp();
}


/**
 * สร้าง Embed สำหรับคำสั่ง /profile
 * @param {object} data - ข้อมูล intern
 * @param {import("discord.js").User} user - Discord User
 * @returns {EmbedBuilder}
 */
function createProfileEmbed(data, user) {
    return new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle("👤 ข้อมูลส่วนตัว (Profile)")
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
            { name: "ชื่อจริง", value: data.name, inline: true },
            { name: "ชื่อเล่น", value: data.nickname, inline: true },
            { name: "อายุ", value: data.age, inline: true },
            { name: "ตำแหน่ง", value: data.position, inline: true },
            { name: "ระยะเวลาฝึกงาน", value: data.duration, inline: true },
            { name: "มหาวิทยาลัย", value: data.university, inline: true }
        )
        .setFooter({ text: "หากต้องการแก้ไขข้อมูล พิมพ์ /edit-profile" })
        .setTimestamp();
}


/**
 * สร้าง Embed แจ้งเตือนแอดมิน (Admin Logs)
 * @param {string} action - เช่น "สมัครใหม่" หรือ "อัปเดตข้อมูล"
 * @param {object} data - ข้อมูล
 * @param {import("discord.js").User} user 
 * @returns {EmbedBuilder}
 */
function createAdminLogEmbed(action, data, user) {
    const color = action === "สมัครใหม่" ? COLORS.SUCCESS : COLORS.WARNING;
    return new EmbedBuilder()
        .setColor(color)
        .setTitle(`📝 ระบบบันทึกข้อมูล: ${action}`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setDescription(`**ผู้ใช้:** <@${user.id}> (${user.tag})`)
        .addFields(
            { name: "ชื่อ", value: `${data.name} (${data.nickname})`, inline: true },
            { name: "ตำแหน่ง", value: data.position, inline: true }
        )
        .setTimestamp();
}


module.exports = {
    COLORS,
    createIntroEmbed,
    createStatusEmbed,
    createSuccessEmbed,
    createErrorEmbed,
    createPingEmbed,
    createHelloEmbed,
    createProfileEmbed,
    createAdminLogEmbed,
};
