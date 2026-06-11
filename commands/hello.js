// ==============================================
// commands/hello.js — คำสั่ง /hello
// ทักทายผู้ใช้พร้อมแนะนำให้ลงทะเบียน
// ==============================================

const { SlashCommandBuilder } = require("discord.js");
const { createHelloEmbed } = require("../utils/embeds");


module.exports = {
    data: new SlashCommandBuilder()
        .setName("hello")
        .setDescription("👋 ทักทายบอท — ยินดีต้อนรับสู่ Academy"),

    async execute(interaction) {
        const embed = createHelloEmbed(interaction.user);

        await interaction.reply({ embeds: [embed] });
    },
};
