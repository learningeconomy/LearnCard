import { Client } from "discord.js";
import { Commands } from "../Commands";
import { Tally, constructTallyMessage } from "../commands/Tally";

export default async (client: Client): Promise<void> => {
  client.on("ready", async () => {
    if (!client.user || !client.application) {
      return;
    }
    await client.application.commands.set(Commands);

    // console.log(await constructTallyMessage(client, "944320393169215498"));

    console.log(`${client.user.username} is online`);
  });
};
