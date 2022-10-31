#!/usr/bin/env node
'use strict';

var discord_js = require('discord.js');
var dotenv = require('dotenv');
var crypto = require('crypto');
var core = require('@learncard/core');
var Redis = require('ioredis');
var RedisMock = require('ioredis-mock');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var dotenv__default = /*#__PURE__*/_interopDefaultLegacy(dotenv);
var crypto__default = /*#__PURE__*/_interopDefaultLegacy(crypto);
var Redis__default = /*#__PURE__*/_interopDefaultLegacy(Redis);
var RedisMock__default = /*#__PURE__*/_interopDefaultLegacy(RedisMock);

const getWallet = async (seed) => {
  return core.initLearnCard({ seed });
};
const generateRandomSeed = () => crypto__default["default"].randomBytes(32).toString("hex");

const simpleScan = async (redis, pattern) => {
  try {
    return await new Promise((res) => {
      const results = [];
      const stream = redis.scanStream({ match: pattern });
      stream.on("data", (keys) => {
        const dedupedKeys = keys.filter((key) => !results.includes(key));
        results.push(...dedupedKeys);
      });
      stream.on("end", () => res(results));
      stream.on("error", (error) => {
        console.error("Cache simpleScan error", error);
        res([]);
      });
    });
  } catch (error) {
    console.error("Cache simpleScan error", error);
    return [];
  }
};

var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
dotenv__default["default"].config();
const DEFAULT_TTL_SECS = 60 * 60;
const getCache = () => {
  const cache = {
    node: new RedisMock__default["default"](),
    set: async (key, value) => {
      try {
        if (cache == null ? void 0 : cache.redis)
          return await cache.redis.set(key, value);
        if (cache == null ? void 0 : cache.node)
          return await cache.node.set(key, value);
      } catch (e) {
        console.error("Cache set error", e);
      }
    },
    setex: async (key, value, ttl = DEFAULT_TTL_SECS) => {
      try {
        if (cache == null ? void 0 : cache.redis)
          return await cache.redis.setex(key, ttl, value);
        if (cache == null ? void 0 : cache.node)
          return await cache.node.setex(key, ttl, value);
      } catch (e) {
        console.error("Cache setex error", e);
      }
    },
    get: async (key, resetTTL = false, ttl = DEFAULT_TTL_SECS) => {
      try {
        if (resetTTL) {
          if (cache == null ? void 0 : cache.redis)
            return await cache.redis.getex(key, "EX", ttl);
          if (cache == null ? void 0 : cache.node)
            return await cache.node.getex(key, "EX", ttl);
        } else {
          if (cache == null ? void 0 : cache.redis)
            return await cache.redis.get(key);
          if (cache == null ? void 0 : cache.node)
            return await cache.node.get(key);
        }
      } catch (e) {
      }
    },
    keys: async (pattern) => {
      try {
        if (cache == null ? void 0 : cache.redis)
          return await simpleScan(cache.redis, pattern);
        if (cache == null ? void 0 : cache.node)
          return await simpleScan(cache.node, pattern);
      } catch (error) {
        console.error("Cache keys error", error);
      }
    },
    delete: async (keys) => {
      if (keys.length === 0)
        return;
      try {
        if (cache == null ? void 0 : cache.redis)
          return await cache.redis.unlink(keys);
        if (cache == null ? void 0 : cache.node)
          return await cache.node.unlink(keys);
      } catch (e) {
        console.error("Cache delete error", e);
      }
    }
  };
  try {
    const host = process.env.REDIS_HOST;
    const port = process.env.REDIS_PORT;
    const password = process.env.REDIS_PW;
    if (host && port) {
      console.log("Setting up Redis-backed cache");
      cache.redis = new Redis__default["default"](__spreadValues({
        host,
        port,
        retryStrategy: (times) => Math.min(times * 50, 2e3),
        enableAutoPipelining: true
      }, password ? { password } : {}));
    }
  } catch (e) {
    console.log("Could not connect to redis", e);
    delete cache.redis;
  }
  return cache;
};
var cache = getCache();

const IssueCredential = {
  name: "issue_test_credential",
  description: "Issues test credential to DID.",
  type: 1,
  deferReply: true,
  run: async (context, interaction) => {
    const { wallet } = context;
    const unsignedVC = await wallet.getTestVc();
    const vc = await wallet.issueCredential(unsignedVC);
    const stringifiedVC = JSON.stringify(vc);
    const content = "**Test Credential Success** \u{1F389}\u2705\n ```" + stringifiedVC + "```";
    await interaction.followUp({
      ephemeral: true,
      content
    });
  }
};

const PREFIX$3 = "credentialtemplate:";
const createCredentialTemplate = async (template, context, scope) => {
  if (!template._id)
    template._id = crypto.randomUUID();
  return context.cache.set(`${PREFIX$3}${scope || "default"}:${template._id}`, JSON.stringify(template));
};

const PREFIX$2 = "didassociation:";
const CHALLENGE_PREFIX = "didchallenge:";
const createDIDAssociation = async (didAssociation, context) => {
  if (!didAssociation._id)
    didAssociation._id = crypto.randomUUID();
  return context.cache.set(`${PREFIX$2}${didAssociation.source}`, JSON.stringify(didAssociation));
};
const createDIDChallenge = async (didChallenge, context) => {
  if (!didChallenge._id)
    didChallenge._id = crypto.randomUUID();
  return context.cache.set(`${CHALLENGE_PREFIX}${didChallenge.source}`, JSON.stringify(didChallenge), 6e5);
};

const getDIDForSource = async (source, context) => {
  const sourceJSON = await context.cache.get(`${PREFIX$2}${source}`);
  return sourceJSON ? JSON.parse(sourceJSON).did : null;
};
const getDIDChallengeForSource = async (source, context) => {
  var _a;
  const sourceJSON = await context.cache.get(`${CHALLENGE_PREFIX}${source}`);
  return sourceJSON ? (_a = JSON.parse(sourceJSON)) == null ? void 0 : _a.challenge : null;
};

const getCredentialTemplates = async (context, scope) => {
  const templateKeys = await context.cache.keys(`${PREFIX$3}${scope ? scope + ":" : ""}*`);
  if (!templateKeys)
    return [];
  const templates = await Promise.all(templateKeys.map(async (key) => {
    const value = await context.cache.get(key);
    return JSON.parse(value);
  }));
  return templates;
};
const getCredentialTemplateById = async (id, context, scope) => {
  const templateJSON = await context.cache.get(`${PREFIX$3}${scope || "default"}:${id}`);
  return templateJSON ? JSON.parse(templateJSON) : null;
};

const PREFIX$1 = "issuer:";
const createIssuerConfig = async (issuerConfig, context, scope) => {
  if (!issuerConfig._id)
    issuerConfig._id = crypto.randomUUID();
  return context.cache.set(`${PREFIX$1}${scope || "default"}:${issuerConfig._id}`, JSON.stringify(issuerConfig));
};

const getIssuerConfigs = async (context, scope) => {
  const issuerConfigKeys = await context.cache.keys(`${PREFIX$1}${scope ? scope + ":" : ""}*`);
  if (!issuerConfigKeys)
    return [];
  const issuers = await Promise.all(issuerConfigKeys.map(async (key) => {
    const value = await context.cache.get(key);
    return JSON.parse(value);
  }));
  return issuers;
};
const getIssuerConfigById = async (id, context, scope) => {
  const issuerJSON = await context.cache.get(`${PREFIX$1}${scope || "default"}:${id}`);
  return issuerJSON ? JSON.parse(issuerJSON) : null;
};

const PREFIX = "pendingvc:";
const createPendingVc = async (pendingVc, context, scope) => {
  if (!pendingVc._id)
    pendingVc._id = crypto.randomUUID();
  return context.cache.set(`${PREFIX}${scope || "default"}:${pendingVc._id}`, JSON.stringify(pendingVc));
};

const getPendingVcs = async (context, scope) => {
  const pendingVcKeys = await context.cache.keys(`${PREFIX}${scope ? scope + ":" : ""}*`);
  if (!pendingVcKeys)
    return [];
  const issuers = await Promise.all(pendingVcKeys.map(async (key) => {
    const value = await context.cache.get(key);
    return JSON.parse(value);
  }));
  return issuers;
};

const constructCredentialForSubject = (issuer, template, didSubject) => {
  const { _id, name, description, criteria, image, type } = template;
  return {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://imsglobal.github.io/openbadges-specification/context.json"
    ],
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    name,
    issuer,
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      type: ["AchievementSubject"],
      id: didSubject,
      achievement: {
        type: ["Achievement"],
        achievementType: type,
        name,
        id: _id,
        description,
        criteria: {
          type: "Criteria",
          narrative: criteria
        },
        image
      }
    }
  };
};
const sendCredentialToSubject = async (issuerConfigId, subjectId, templateId, interaction, context, guildId) => {
  if (!guildId)
    guildId = interaction.guildId;
  const issuerConfig = await getIssuerConfigById(issuerConfigId, context, guildId);
  const credentialTemplate = await getCredentialTemplateById(templateId, context, guildId);
  const subjectDID = await getDIDForSource(subjectId, context);
  console.log("Issuing credential for subject.", credentialTemplate, subjectDID);
  let data = {
    credentialTemplate,
    subjectDID
  };
  let error;
  if (!subjectDID) {
    data.pendingVc = {
      guildId: interaction.guildId,
      issuerConfigId,
      subjectId,
      credentialTemplateId: templateId
    };
    await createPendingVc(data.pendingVc, context, subjectId);
  } else {
    const issuer = await core.initLearnCard({ seed: issuerConfig.seed });
    const unsignedVc = constructCredentialForSubject(issuer.did("key"), credentialTemplate, subjectDID);
    const vc = await issuer.issueCredential(unsignedVc);
    const streamId = await issuer.publishCredential(vc);
    data.claimCredentialLink = `https://learncard.app/claim-credential/${streamId}`;
  }
  let subjectUser;
  try {
    subjectUser = await context.client.users.fetch(subjectId);
    data.subjectUserName = subjectUser.username;
    if (data.claimCredentialLink) {
      subjectUser.send(`Hello \u{1F44B}! You have received a credential: **${credentialTemplate.name}** \u{1F389} 

 Click this link to claim: ${data.claimCredentialLink}`);
    } else {
      subjectUser.send(`Hello \u{1F44B}! You have received a credential: **${credentialTemplate.name}** \u{1F389} 
 To claim the credential, you need to setup your wallet or LearnCard. 

 Please run \`/start-connect-id\` to complete setup \u{1F6A7}

*Need help?* Check out the guide: https://docs.learncard.com/learncard-services/discord-bot/register-learncard-did  `);
    }
  } catch (e) {
    console.error("Error sending message to user.", e);
    error = e;
  }
  return {
    data,
    error
  };
};
const sendPendingVCsToSubject = async (subjectId, interaction, context) => {
  const pendingVCs = await getPendingVcs(context, subjectId);
  return Promise.all(pendingVCs.map(async (pendingVC) => sendCredentialToSubject(pendingVC.issuerConfigId, subjectId, pendingVC.credentialTemplateId, interaction, context, pendingVC.guildId)));
};
const getCredentialTypeOptions = () => {
  return [
    {
      label: "Generic Achievement",
      description: "Achievements",
      value: "Achievement"
    },
    {
      label: "Formal Award",
      description: "Achievements",
      value: "Award"
    },
    {
      label: "Badge",
      description: "Achievements",
      value: "Badge"
    },
    {
      label: "Community Service",
      description: "Achievements",
      value: "CommunityService"
    },
    {
      label: "License",
      description: "IDs",
      value: "License"
    },
    {
      label: "Membership",
      description: "IDs",
      value: "Membership"
    },
    {
      label: "Assessment",
      description: "Skills",
      value: "Assessment"
    },
    {
      label: "Certificate",
      description: "Skills",
      value: "Certificate"
    },
    {
      label: "Certification",
      description: "Skills",
      value: "Certification"
    },
    {
      label: "Competency",
      description: "Skills",
      value: "Competency"
    },
    {
      label: "Micro-Credential",
      description: "Skills",
      value: "MicroCredential"
    },
    {
      label: "Assignment",
      description: "Learning History",
      value: "Assignment"
    },
    {
      label: "Course",
      description: "Learning History",
      value: "Course"
    },
    {
      label: "Degree",
      description: "Learning History",
      value: "Degree"
    },
    {
      label: "Diploma",
      description: "Learning History",
      value: "Diploma"
    },
    {
      label: "Learning Program",
      description: "Learning History",
      value: "LearningProgram"
    },
    {
      label: "Apprenticeship Certificate",
      description: "Work History",
      value: "ApprenticeshipCertificate"
    },
    {
      label: "Fieldwork",
      description: "Work History",
      value: "Fieldwork"
    },
    {
      label: "Journeyman Certificate",
      description: "Work History",
      value: "JourneymanCertificate"
    },
    {
      label: "Master Certificate",
      description: "Work History",
      value: "MasterCertificate"
    }
  ];
};

const AddCredential = {
  name: "add-credential",
  description: "Adds a credential template.",
  type: discord_js.ApplicationCommandOptionType.ChatInput,
  run: async (context, interaction) => {
    const user = await interaction.guild.members.fetch(interaction.user.id);
    if (!user.permissions.has(discord_js.PermissionsBitField.Flags.ManageGuild)) {
      await interaction.reply({
        content: "You do not have permission to add a credential on this server.\n *You need permission:* `Manage Server`",
        ephemeral: true
      });
      return;
    }
    const options = getCredentialTypeOptions();
    const issuerSelectMenu = new discord_js.SelectMenuBuilder().setCustomId("credential-type-selection").setPlaceholder("Select Credential Type").addOptions(options);
    const firstActionRow = new discord_js.ActionRowBuilder().addComponents([issuerSelectMenu]);
    await interaction.reply({
      content: `Great! Lets create a new credential template for your community \u270F\uFE0F`,
      components: [firstActionRow]
    });
  }
};
const CredentialTypeSelection = {
  component_id: "credential-type-selection",
  submit: async (context, interaction) => {
    const credentialTypeSelected = interaction.values[0];
    const modal = new discord_js.ModalBuilder().setCustomId("add-credential-modal").setTitle("Add Credential");
    const credentialNameInput = new discord_js.TextInputBuilder().setCustomId("credentialName").setLabel("Credential Name").setStyle("Short");
    const credentialDescriptionInput = new discord_js.TextInputBuilder().setCustomId("credentialDescription").setLabel("Credential Description").setStyle("Paragraph");
    const credentialCriteriaInput = new discord_js.TextInputBuilder().setCustomId("credentialCriteria").setLabel("Credential Criteria").setStyle("Paragraph");
    const credentialImageInput = new discord_js.TextInputBuilder().setCustomId("credentialImage").setLabel("Credential Image").setStyle("Short");
    const credentialTypeInput = new discord_js.TextInputBuilder().setCustomId("credentialType").setLabel("Credential Type").setStyle("Short").setValue(credentialTypeSelected);
    const firstActionRow = new discord_js.ActionRowBuilder().addComponents([credentialNameInput]);
    const secondActionRow = new discord_js.ActionRowBuilder().addComponents([credentialDescriptionInput]);
    const thirdActionRow = new discord_js.ActionRowBuilder().addComponents([credentialCriteriaInput]);
    const fourthActionRow = new discord_js.ActionRowBuilder().addComponents([credentialImageInput]);
    const fifthActionRow = new discord_js.ActionRowBuilder().addComponents([credentialTypeInput]);
    modal.addComponents([
      firstActionRow,
      secondActionRow,
      thirdActionRow,
      fourthActionRow,
      fifthActionRow
    ]);
    await interaction.showModal(modal);
  }
};
const AddCredentialModal = {
  modal_id: "add-credential-modal",
  submit: async (context, interaction) => {
    const credentialName = interaction.fields.getTextInputValue("credentialName");
    const credentialDescription = interaction.fields.getTextInputValue("credentialDescription");
    const credentialCriteria = interaction.fields.getTextInputValue("credentialCriteria");
    const credentialImage = interaction.fields.getTextInputValue("credentialImage");
    const credentialType = interaction.fields.getTextInputValue("credentialType");
    console.log("Add Credential to DB", credentialName, credentialDescription, credentialCriteria, credentialImage, credentialType);
    await createCredentialTemplate({
      name: credentialName,
      description: credentialDescription,
      criteria: credentialCriteria,
      image: credentialImage,
      type: credentialType
    }, context, interaction.guildId);
    await interaction.deferReply();
    await interaction.followUp({
      ephemeral: true,
      content: `**Credential Added** \u2705 
 - ${credentialName} 
 - ${credentialDescription} 
 - ${credentialCriteria} 
 - ${credentialImage}
 -${credentialType}`
    });
  }
};

const ListCredentials = {
  name: "list-credentials",
  description: "Lists all credential templates.",
  type: discord_js.ApplicationCommandOptionType.ChatInput,
  deferReply: true,
  run: async (context, interaction) => {
    const user = await interaction.guild.members.fetch(interaction.user.id);
    if (!user.permissions.has(discord_js.PermissionsBitField.Flags.ManageGuild)) {
      await interaction.followUp({
        ephemeral: true,
        content: "You do not have permission to list credentials on this server.\n *You need permission:* `Manage Server`"
      });
      return;
    }
    const credentialTemplates = await getCredentialTemplates(context, interaction.guildId || "default");
    const listOfCredentials = credentialTemplates.map((t) => t.name).reduce((list, name) => "- " + name + "\n" + list, "");
    if (!listOfCredentials) {
      await interaction.followUp({
        ephemeral: true,
        content: "**Credential Templates**\n *You don't have any credential templates setup!*\n Use the `/add-credential` command to setup a credential template for your community. \u{1F680}"
      });
    } else {
      await interaction.followUp({
        ephemeral: true,
        content: `**Credential Templates**
 ${listOfCredentials}`
      });
    }
  }
};

const SendCredential = {
  name: "send-credential",
  description: "Send a credential to another user.",
  type: discord_js.ApplicationCommandOptionType.ChatInput,
  options: [
    {
      type: discord_js.ApplicationCommandOptionType.User,
      name: "subject",
      required: true,
      description: "Pick a user to issue a credential to."
    }
  ],
  run: async (context, interaction) => {
    const subject = interaction.options.getUser("subject");
    const user = await interaction.guild.members.fetch(interaction.user.id);
    if (!user.permissions.has(discord_js.PermissionsBitField.Flags.ManageGuild)) {
      await interaction.reply({
        content: "You do not have permission to send a credential on this server.\n *You need permission:* `Manage Server`",
        ephemeral: true
      });
      return;
    }
    const templates = await getCredentialTemplates(context, interaction.guildId);
    const options = templates.map((t) => {
      return {
        label: t.name,
        description: t.description,
        value: t._id || t.name
      };
    });
    if ((options == null ? void 0 : options.length) <= 0) {
      console.error("No credential templates exist yet. Please create one using /add-credential.");
      await interaction.reply({
        content: "No credential templates exist yet. Please create one with /add-credential command.",
        ephemeral: true
      });
      return;
    }
    const credentialTemplate = new discord_js.SelectMenuBuilder().setCustomId("credential-template").setPlaceholder("Select Credential").addOptions(options);
    const firstActionRow = new discord_js.ActionRowBuilder().addComponents([credentialTemplate]);
    await interaction.reply({
      content: `${subject.id}`,
      components: [firstActionRow]
    });
  }
};
const SendCredentialSelection = {
  component_id: "credential-template",
  submit: async (context, interaction) => {
    const credentialTemplateSelected = interaction.values[0];
    const subjectUserId = interaction.message.content;
    const issuers = await getIssuerConfigs(context, interaction.guildId);
    const options = issuers.map((t) => {
      return {
        label: t.issuer.name,
        description: t.issuer.id,
        value: t._id
      };
    });
    if ((options == null ? void 0 : options.length) <= 0) {
      console.error("No issuers exist yet. Please configure one using /configure-issuer.");
      await interaction.reply({
        content: "No issuers exist yet. Please create one with `/configure-issuer` command."
      });
      return;
    }
    const issuerSelectMenu = new discord_js.SelectMenuBuilder().setCustomId("send-credential-issuer-selection").setPlaceholder("Select Issuer").addOptions(options);
    const firstActionRow = new discord_js.ActionRowBuilder().addComponents([issuerSelectMenu]);
    await interaction.reply({
      content: `${subjectUserId}:${credentialTemplateSelected}`,
      components: [firstActionRow]
    });
  }
};
const PickIssuerSelection = {
  component_id: "send-credential-issuer-selection",
  submit: async (context, interaction) => {
    var _a, _b, _c;
    const issuerSelected = interaction.values[0];
    const subjectUserIdAndTemplateId = interaction.message.content;
    const [subjectUserId, templateId] = subjectUserIdAndTemplateId.split(":");
    await interaction.deferReply();
    const { data, error } = await sendCredentialToSubject(issuerSelected, subjectUserId, templateId, interaction, context);
    if (error) {
      if (data.pendingVc) {
        await interaction.followUp({
          ephemeral: true,
          content: `**${(_a = data.credentialTemplate) == null ? void 0 : _a.name}** successfully issued to (${data.subjectUserName}) \u2705, but failed to send message to user \u{1F527}. 
 
                                User must register their DID identity to claim, with \`/start-connect-id\` \u274C`
        });
      } else {
        await interaction.followUp({
          ephemeral: true,
          content: `**${(_b = data.credentialTemplate) == null ? void 0 : _b.name}** successfully issued to ${data.subjectUserName} (${data.subjectUserName}) \u2705, but failed to send message to user \u{1F527}. 
 
                            Share this link with them to claim: ${data.claimCredentialLink}} \u{1F344}`
        });
      }
      return;
    }
    await interaction.followUp({
      ephemeral: true,
      content: `**${(_c = data.credentialTemplate) == null ? void 0 : _c.name}** successfully sent to @${data.subjectUserName} \u{1F393}\u2705`
    });
  }
};

var DIDAssociationType = /* @__PURE__ */ ((DIDAssociationType2) => {
  DIDAssociationType2[DIDAssociationType2["DiscordAccount"] = 0] = "DiscordAccount";
  return DIDAssociationType2;
})(DIDAssociationType || {});

const deletePendingVcs = async (context, scope) => {
  const pendingVcKeys = await context.cache.keys(`${PREFIX}${scope ? scope + ":" : ""}*`);
  if (!pendingVcKeys)
    return 0;
  return context.cache.delete(pendingVcKeys);
};

const RegisterDID = {
  name: "register-did",
  description: "Manually associate a did with your discord account (admins only).",
  type: discord_js.ApplicationCommandOptionType.ChatInput,
  options: [
    {
      name: "did",
      description: "DID to associate with user.",
      required: true,
      type: discord_js.ApplicationCommandOptionType.String
    },
    {
      name: "holder",
      description: "Select a user",
      type: discord_js.ApplicationCommandOptionType.User
    }
  ],
  run: async (context, interaction) => {
    var _a;
    const targetedUser = interaction.options.getUser("holder");
    const did = interaction.options.getString("did").replace("\u{1F511}", ":key:");
    const { user: currentUser } = interaction;
    const initiator = await ((_a = interaction.guild) == null ? void 0 : _a.members.fetch(interaction.user.id));
    if (!(initiator == null ? void 0 : initiator.permissions.has(discord_js.PermissionsBitField.Flags.ManageGuild))) {
      await interaction.reply({
        content: "You do not have permission to manually register a DID on this server.\n *You need permission:* `Manage Server`",
        ephemeral: true
      });
      return;
    }
    console.log(`${currentUser.username} is registering DID for user`, targetedUser, did, interaction);
    const user = targetedUser != null ? targetedUser : currentUser;
    await createDIDAssociation({
      type: DIDAssociationType.DiscordAccount,
      source: user.id,
      did
    }, context);
    await interaction.reply({
      content: "**DID Registered Successfully.** \u{1F680} \n Now, I'll send you credentials pending for your user... one moment. \u{1F54A}",
      ephemeral: true
    });
    const pendingVCs = await sendPendingVCsToSubject(user.id, interaction, context);
    if ((pendingVCs == null ? void 0 : pendingVCs.length) > 0) {
      const successCount = pendingVCs.filter((p) => !p.error).length;
      await interaction.followUp({
        content: `**(${successCount}/${pendingVCs.length}) pending credentials successfully sent. \u2705** 
 You're all set!`,
        ephemeral: true
      });
    } else {
      await interaction.followUp({
        content: "**No pending credentials found.** \n You're all set!",
        ephemeral: true
      });
    }
    await deletePendingVcs(context, user.id);
  }
};

const StartConnectID = {
  name: "start-connect-id",
  description: "Step 1: Connect your DID to your Discord account.",
  type: discord_js.ApplicationCommandOptionType.ChatInput,
  run: async (context, interaction) => {
    const { user } = interaction;
    const existingDID = await getDIDForSource(user.id, context);
    const challenge = crypto.randomUUID();
    await createDIDChallenge({
      type: DIDAssociationType.DiscordAccount,
      source: user.id,
      challenge
    }, context);
    const authLink = `https://learncard.app/did-auth/${challenge}?domain=discord://auth.learncard.com`;
    if (existingDID) {
      await interaction.reply({
        content: `**You already have a DID identity connected to your account.**
 \`${existingDID}\`

 *If you'd like, you can update your DID <> Discord connection.* \u2194\uFE0F 
 
 Use this link to update your DID:
 ${authLink} 
 When you have finished this step, run the \`/finish-connect-id\` command with your verification code.`,
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: `**Great! Let's connect your DID with your Discord account.** \u2194\uFE0F 
 Use this link to setup your credential LearnCard:
 ${authLink} 
 When you have finished this step, run the \`/finish-connect-id\` command with your verification code.`,
        ephemeral: true
      });
    }
  }
};

const FinishConnectID = {
  name: "finish-connect-id",
  description: "Step 2: verify your DID to your Discord account connection.",
  type: discord_js.ApplicationCommandOptionType.ChatInput,
  run: async (context, interaction) => {
    const modal = new discord_js.ModalBuilder().setCustomId("finish-connect-id-modal").setTitle("Verify Your DID ID");
    const streamVerificationInput = new discord_js.TextInputBuilder().setCustomId("streamVerification").setLabel("Verification Code").setStyle("Short");
    const firstActionRow = new discord_js.ActionRowBuilder().addComponents([streamVerificationInput]);
    modal.addComponents([firstActionRow]);
    await interaction.showModal(modal);
  }
};
const FinishConnectIDModal = {
  modal_id: "finish-connect-id-modal",
  submit: async (context, interaction) => {
    var _a, _b;
    const { user } = interaction;
    const { wallet } = context;
    const streamVerificationInput = interaction.fields.getTextInputValue("streamVerification");
    console.log("Finish Connect ID to DB", streamVerificationInput);
    const challenge = await getDIDChallengeForSource(user.id, context);
    if (!challenge) {
      await interaction.reply({
        content: "Auth verification failed \u274C.\n `Challenge Expired.`\n Please provide a valid verification code or presentation.\n If your code expired, use `/start-connect-id` to generate another.",
        ephemeral: true
      });
      return;
    }
    const domain = "discord://auth.learncard.com";
    let vp;
    try {
      vp = await wallet.readFromCeramic(streamVerificationInput);
    } catch (e) {
      console.error(e);
      await interaction.reply({
        content: "Auth verification failed \u274C.\n `Could not read VP from Ceramic.`\nPlease provide a valid verification code or presentation.\n If your code expired, use `/start-connect-id` to generate another.",
        ephemeral: true
      });
      return;
    }
    if (!vp) {
      await interaction.reply({
        content: "Auth verification failed \u274C.\n `Could not read VP from Ceramic.`\nPlease provide a valid verification code or presentation.\n If your code expired, use `/start-connect-id` to generate another.",
        ephemeral: true
      });
      return;
    }
    const verification = await wallet.verifyPresentation(vp, {
      challenge,
      domain,
      proofPurpose: "authentication"
    });
    if (verification.warnings.length > 0 || verification.errors.length > 0) {
      await interaction.reply({
        content: "Auth verification failed \u274C.\n `Presentation Could Not Be Verified.`\n Please provide a valid verification code or presentation.\n If your code expired, use `/start-connect-id` to generate another.",
        ephemeral: true
      });
      return;
    }
    const did = (_b = (_a = vp.proof) == null ? void 0 : _a.verificationMethod) == null ? void 0 : _b.split("#")[0];
    await createDIDAssociation({
      type: DIDAssociationType.DiscordAccount,
      source: user.id,
      did
    }, context);
    await interaction.reply({
      content: `**DID Registered Successfully.** \u{1F680} 
 \`${did}\` 
 Now, I'll send you credentials pending for your user... one moment. \u{1F54A}`,
      ephemeral: true
    });
    const pendingVCs = await sendPendingVCsToSubject(user.id, interaction, context);
    if ((pendingVCs == null ? void 0 : pendingVCs.length) > 0) {
      const successCount = pendingVCs.filter((p) => !p.error).length;
      await interaction.followUp({
        content: `**(${successCount}/${pendingVCs.length}) pending credentials successfully sent. \u2705** 
 You're all set!`,
        ephemeral: true
      });
    } else {
      await interaction.followUp({
        content: "**No pending credentials found.** \n You're all set!",
        ephemeral: true
      });
    }
    await deletePendingVcs(context, user.id);
  }
};

const ConfigureIssuer = {
  name: "configure-issuer",
  description: "Sets up your community's issuing identity.",
  type: discord_js.ApplicationCommandOptionType.ChatInput,
  run: async (context, interaction) => {
    const user = await interaction.guild.members.fetch(interaction.user.id);
    if (!user.permissions.has(discord_js.PermissionsBitField.Flags.ManageGuild)) {
      await interaction.reply({
        content: "You do not have permission to configure an issuer on this server.\n *You need permission:* `Manage Server`",
        ephemeral: true
      });
      return;
    }
    const modal = new discord_js.ModalBuilder().setCustomId("configure-issuer-modal").setTitle("Configure Issuer");
    const credentialNameInput = new discord_js.TextInputBuilder().setCustomId("issuerName").setLabel("Issuer Name").setStyle("Short");
    const credentialDescriptionInput = new discord_js.TextInputBuilder().setCustomId("issuerUrl").setLabel("Issuer URL").setRequired(false).setStyle("Short");
    const credentialCriteriaInput = new discord_js.TextInputBuilder().setCustomId("issuerImage").setLabel("Issuer Image").setRequired(false).setStyle("Short");
    const firstActionRow = new discord_js.ActionRowBuilder().addComponents([credentialNameInput]);
    const secondActionRow = new discord_js.ActionRowBuilder().addComponents([credentialDescriptionInput]);
    const thirdActionRow = new discord_js.ActionRowBuilder().addComponents([credentialCriteriaInput]);
    modal.addComponents([firstActionRow, secondActionRow, thirdActionRow]);
    await interaction.showModal(modal);
  }
};
const ConfigureIssuerModal = {
  modal_id: "configure-issuer-modal",
  submit: async (context, interaction) => {
    const issuerName = interaction.fields.getTextInputValue("issuerName");
    const issuerUrl = interaction.fields.getTextInputValue("issuerUrl");
    const issuerImage = interaction.fields.getTextInputValue("issuerImage");
    console.log("Add Issuer to DB", issuerName, issuerUrl, issuerImage);
    const seed = generateRandomSeed();
    const issuerWallet = await core.initLearnCard({ seed });
    const issuerId = issuerWallet.did();
    await createIssuerConfig({
      seed,
      guildId: interaction.guildId,
      issuer: {
        type: "Profile",
        id: issuerId,
        name: issuerName,
        url: issuerUrl,
        image: issuerImage
      }
    }, context, interaction.guildId);
    await interaction.deferReply();
    await interaction.followUp({
      ephemeral: true,
      content: `**Issuer Configured** \u2705 
 - ${issuerName} 
 - ${issuerUrl} 
 - ${issuerImage} 
 - \`${issuerId}\``
    });
  }
};

const Commands = [
  IssueCredential,
  AddCredential,
  ListCredentials,
  SendCredential,
  RegisterDID,
  ConfigureIssuer,
  StartConnectID,
  FinishConnectID
];
const Modals = [AddCredentialModal, ConfigureIssuerModal, FinishConnectIDModal];
const MessageComponents = [
  SendCredentialSelection,
  PickIssuerSelection,
  CredentialTypeSelection
];

var ready = async ({ client }) => {
  client.on("ready", async () => {
    if (!client.user || !client.application) {
      return;
    }
    await client.application.commands.set(Commands);
    console.log(`${client.user.username} is online`);
  });
};

var interactionCreate = (context) => {
  console.log("Initiating interactionCreate listener...");
  context.client.on("interactionCreate", async (interaction) => {
    if (interaction.type === discord_js.InteractionType.ApplicationCommand) {
      await handleSlashCommand(context, interaction);
    } else if (interaction.type === discord_js.InteractionType.ModalSubmit) {
      await handleModalSubmit(context, interaction);
    } else if (interaction.type === discord_js.InteractionType.MessageComponent) {
      await handleMessageComponentSubmit(context, interaction);
    }
  });
};
const handleSlashCommand = async (context, interaction) => {
  console.log("Handling slash command", interaction);
  const slashCommand = Commands.find((c) => c.name === interaction.commandName);
  if (!slashCommand) {
    interaction.followUp({ content: "An error has occurred" });
    return;
  }
  if (slashCommand.deferReply) {
    await interaction.deferReply();
  }
  slashCommand.run(context, interaction);
};
const handleModalSubmit = async (context, interaction) => {
  console.log("Handling modal submit", interaction);
  const modal = Modals.find((c) => c.modal_id === interaction.customId);
  if (!modal) {
    console.error("No modal found", interaction);
    await interaction.deferReply();
  }
  modal.submit(context, interaction);
};
const handleMessageComponentSubmit = async (context, interaction) => {
  console.log("Handling message interaction submit", interaction);
  const messageHandler = MessageComponents.find((c) => c.component_id === interaction.customId);
  if (!messageHandler) {
    console.error("No message component handler found", handler);
    await interaction.deferReply();
    return;
  }
  messageHandler.submit(context, interaction);
};

var messageCreate = ({ client }) => {
  console.log("Initiating messageCreate listener...");
  client.on("messageCreate", async (message) => {
    if (message.content === "ping") {
      message.reply({
        content: "pong"
      });
    }
  });
};

console.log("Bot is starting...");
dotenv__default["default"].config();
const token = process.env.DISCORD_TOKEN;
const seed = process.env.SEED;
if (!seed) {
  throw new Error("SEED not provided in .env");
}
if (!token) {
  throw new Error("DISCORD_TOKEN not provided in .env");
}
const client = new discord_js.Client({
  intents: [discord_js.GatewayIntentBits.Guilds, discord_js.GatewayIntentBits.GuildMessages]
});
getWallet(seed).then((wallet) => {
  const context = {
    wallet,
    client,
    cache
  };
  ready(context);
  interactionCreate(context);
  messageCreate(context);
  client.login(token);
});
