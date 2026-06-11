const { SlashCommandBuilder } = require("discord.js");
const { findIntern } = require("../utils/csv");
const { createProfileEmbed, createErrorEmbed } = require("../utils/embeds");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("profile")
        .setDescription("👤 ดูข้อมูลส่วนตัวที่คุณได้ลงทะเบียนไว้"),

    async execute(interaction) {
        // ค้นหาข้อมูลจาก CSV โดยใช้ Discord ID
        const internData = findIntern(interaction.user.id);

        if (!internData) {
            const errorEmbed = createErrorEmbed(
                "ไม่พบข้อมูลของคุณ",
                "คุณยังไม่ได้ลงทะเบียน หรือข้อมูลยังไม่ถูกเชื่อมโยงกับบัญชี Discord นี้\n\nโปรดพิมพ์คำสั่ง `/register` เพื่อลงทะเบียนใหม่ครับ"
            );
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }

        // แสดงการ์ด Profile
        const profileEmbed = createProfileEmbed(internData, interaction.user);
        await interaction.reply({ embeds: [profileEmbed], ephemeral: true });
    },
};
