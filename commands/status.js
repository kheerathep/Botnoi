const { SlashCommandBuilder } = require("discord.js");
const { countInterns } = require("../utils/csv");
const { getInternCountFromSheets } = require("../utils/sheets");
const { createStatusEmbed } = require("../utils/embeds");


module.exports = {
    data: new SlashCommandBuilder()
        .setName("status")
        .setDescription("📊 แสดงสเตตัสบอท — Uptime, จำนวนสมาชิก, Ping"),

    async execute(interaction) {
        // ให้บอทขึ้นสถานะ "กำลังคิด..." ก่อนเพื่อมีเวลาไปดึงข้อมูลจากเว็บ
        await interaction.deferReply();

        // ดึงจำนวนคนลงทะเบียนจาก Google Sheets
        let internCount = await getInternCountFromSheets();

        // ถ้าดึงจาก Google Sheets ไม่สำเร็จ/ช้า ให้ดึงจาก CSV ในเครื่องแทน (Fallback)
        if (internCount === null) {
            internCount = countInterns();
            console.log("⚠️ ดึงข้อมูลสเตตัสจาก Google Sheets ล้มเหลว — ใช้ข้อมูลจาก CSV แทน");
        }

        // สร้าง Embed สเตตัส
        const embed = createStatusEmbed(interaction.client, internCount);

        // แก้ไขข้อความตอบกลับ
        await interaction.editReply({ embeds: [embed] });
    },
};
