import {
  BaseCommandInteraction,
  Client,
  Message,
  MessageReaction,
} from "discord.js";
import { Command } from "../Command";

const emojiId = "944775929912229990";

type LmaoReactionWrapper = {
  r: MessageReaction | undefined;
  m: Message<boolean>;
};

const getRankIcon = (ix: number): any => {
  if (ix === 1) {
    return "🥇";
  }
  if (ix === 2) {
    return "🥈";
  }
  if (ix === 3) {
    return "🥉";
  }
  return `${ix}.`;
};

const constructLineItem = (wrapper: LmaoReactionWrapper, ix: number): string =>
  `${getRankIcon(ix + 1)} <@!${wrapper.m.author.id}> \u2014 **"${
    wrapper.m?.content
  }"** \u2014 ${wrapper.r?.count || 0} ${
    wrapper.r?.count === 1 ? "vote" : "votes"
  }`;

export const Tally: Command = {
  name: "tally",
  description: "Outputs current finalists",
  type: "CHAT_INPUT",
  run: async (client: Client, interaction: BaseCommandInteraction) => {
    const content = await constructTallyMessage(client, interaction.channelId);
    console.log(`content: ${content}`);

    await interaction.followUp({
      ephemeral: true,
      content,
    });
  },
};

export const constructTallyMessage = async (
  client: Client,
  channelId: string
): Promise<string> => {
  let content = "Wouldn't you like to know?!";

  const test = await client.channels.fetch(channelId);
  if (test && test.type === "GUILD_TEXT") {
    const lmaoReactionsList: LmaoReactionWrapper[] = [];
    const messages = await test.messages.fetch(
      {},
      { cache: false, force: true }
    );

    messages.forEach((m) => {
      const reactions = m.reactions.cache;
      const lmaoReaction = reactions.filter((r) => r.emoji.id === emojiId);
      if (lmaoReaction?.size > 0) {
        lmaoReactionsList.push({ r: lmaoReaction.at(0), m });
      }
    });

    const finalists = lmaoReactionsList
      .sort((a, b) => (b?.r?.count || 0) - (a?.r?.count || 0))
      .slice(0, 3);

    if (finalists.length > 0) {
      content =
        "*Current finalists*\n\n" +
        finalists
          .map((r, ix) => constructLineItem(r, ix))
          .filter((c) => c.length > 0)
          .join("\n\n");
    } else {
      content = "No messages have been voted on!";
    }
  }

  return content;
};
