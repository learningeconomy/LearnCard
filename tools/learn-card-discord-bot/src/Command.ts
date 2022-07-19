import {
  BaseCommandInteraction,
  ChatInputApplicationCommandData,
  Client,
} from "discord.js";

export interface Command extends ChatInputApplicationCommandData {
  run: (client: Client, interaction: BaseCommandInteraction) => void;
}
