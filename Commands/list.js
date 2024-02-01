/**************************************************************************
 *
 *  DLAP Bot: A Discord bot that plays local audio tracks.
 *  (C) Copyright 2022
 *  Programmed by Andrew Lee
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ***************************************************************************/

import { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder } from 'discord.js';
import { readdir } from 'node:fs';

const musicFolder = './music';

function createEmbed(bot, trackList, pages, page, numPages) {
  const embed = new EmbedBuilder();
  embed.setAuthor({ name: `${bot.user.username} List`, iconURL: bot.user.avatarURL() });
  embed.addFields({ name: `Listing ${trackList.length} audio tracks...`, value: `\`\`\`\n${pages[page - 1].join('\n')}\n\`\`\`` });
  embed.setFooter({ text: `Page ${page}/${numPages}` });
  embed.setColor('#0066ff');
  return embed;
}

function createActionRow(page, numPages) {
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('previous')
        .setLabel('Previous')
        .setStyle('Primary')
        .setDisabled(page === 1), // Disable if on the first page
      new ButtonBuilder()
        .setCustomId('next')
        .setLabel('Next')
        .setStyle('Primary')
        .setDisabled(page === numPages), // Disable if on the last page
    );
  return row;
}

export default {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('Lists the available audio tracks')
    .addIntegerOption(option =>
      option.setName('page')
        .setDescription('Input a number to change the page of the list')
    ),
  async execute(interaction, bot) {
    let page = interaction.options.getInteger('page') || 1; // If no page is specified, default to page 1
    readdir(musicFolder, async(err, files) => {
      if (err) {
        console.error(err);
      } else {
        const trackList = files.map((file, i) => `${i}: ${file}`); // Create an array of track names
        const pageSize = 20; // Number of tracks per page
        const numPages = Math.ceil(trackList.length / pageSize); // Total number of pages
        if (page < 1 || page > numPages) { // Check if the page number is valid
          return await interaction.reply({ content: `Invalid page number. Please specify a number between 1 and ${numPages}.`, ephemeral: true });
        }
        // Split the track list into pages
        const pages = [];
        for (let i = 0; i < numPages; i++) {
          const start = i * pageSize;
          const end = start + pageSize;
          pages.push(trackList.slice(start, end));
        }
        // Send the specified page with the page number and total number of pages
        const listEmbed = createEmbed(bot, trackList, pages, page, numPages);
        const row = createActionRow(page, numPages);

        await interaction.reply({ embeds: [listEmbed], components: [row] });

        // Create a message collector to listen for button clicks
        const filter = i => i.customId === 'previous' || i.customId === 'next';
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
          if (i.customId === 'previous' && page !== 1) {
            // Decrease page number and update message
            page--;
          } else if (i.customId === 'next' && page !== numPages) {
            // Increase page number and update message
            page++;
          }

          // Update the embed with the new page
          const updatedEmbed = createEmbed(bot, trackList, pages, page, numPages);
          const updatedRow = createActionRow(page, numPages);

          // Update the message
          await i.update({ embeds: [updatedEmbed], components: [updatedRow] });
        });
      }
    });
  }
};