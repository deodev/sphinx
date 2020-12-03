const log = require("../../Internals/handlers/log"),
	Emojis = require("../../Utils/emojis.json"),
	{ colors } = require("../../Utils/config.json"),
	{ findMember, sendWarning } = require("../../Utils/util"),
	Profile = require("../../Internals/handlers/profileHandler");

module.exports = {
	commands: ["ban"],
	example: "ban abdoul",
	description: "Ban a user",
	args: [
		{
			name: "user",
			description: "The user you're muting"
		}, {
			name: "time",
			description: "The time they're going to be banned for",
			optional: true
		}
	],
	execute: async (bot, msg, args) => {
		let m = await msg.channel.createMessage(`${Emojis.loading} Grabbing user information...`),
			user = await Profile.search(bot, args[0], msg.author, m),
			warning,
			member,
			reason,
			time;

		if (!user) return m.edit(`${Emojis.x} I could not find a user called \`${args[0]}\``);

		member = findMember(msg.guild, user.id);

		try {
			warning = await sendWarning(m, msg.author);
			if (!warning) return m.edit(`${Emojis.x} User cancelled operation.`);
			m.edit(`${Emojis.warning.yellow} What do you want the reason to be?`);

			reason = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { time: 30000, maxMatches: 1 });
			if (!reason.length || /cancel/gi.test(reason[0].content)) return m.edit(`${Emojis.warning.red} Cancelled.`);
			m.edit(`${Emojis.loading} Banning user...`);
			user.createMessage({
				embed: {
					title: "You have been banned",
					description: "You have been banned from sphinx.",
					fields: [
						{
							name: "Moderator",
							value: msg.author.tag
						}, {
							name: "Reason",
							value: reason[0].content ? reason[0].content : null
						}
					],
					color: colors.ban
				}
			});
			setTimeout(async () => {
				await msg.guild.banMember(member.id, 0, reason[0].content);
				time = args[1] && !isNaN(args[1].slice(0, -1)) ? time = args[1] : time = null;
				await log.add(bot, member, msg.member, "ban", time, reason[0].content);
				await Profile.archive(bot, user);
			}, 1000);
		} catch (e) {
			m.edit(`${Emojis.x} An error occurred.`);
			throw new Error(e);
		}

		m.edit(`${Emojis.tick} Successfully banned \`${member.tag}\` for \`${reason}.\``);
	}
};