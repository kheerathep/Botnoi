// ==============================================
// commands/ping.js — คำสั่ง /ping
// เช็คว่าบอทยังทำงานอยู่ไหม + แสดง latency
// ==============================================

const { SlashCommandBuilder } = require("discord.js");
const { createPingEmbed } = require("../utils/embeds");


module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("🏓 เช็คสถานะบอท — แสดง Latency"),

    async execute(interaction) {
        const latency = interaction.client.ws.ping;
        const embed = createPingEmbed(latency);

        await interaction.reply({ embeds: [embed] });
    },
};
