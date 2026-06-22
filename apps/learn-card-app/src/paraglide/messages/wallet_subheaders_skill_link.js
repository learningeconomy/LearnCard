/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Subheaders_Skill_LinkInputs */

const en_wallet_subheaders_skill_link = /** @type {(inputs: Wallet_Subheaders_Skill_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`skills library`)
};

const es_wallet_subheaders_skill_link = /** @type {(inputs: Wallet_Subheaders_Skill_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`biblioteca de habilidades`)
};

const fr_wallet_subheaders_skill_link = /** @type {(inputs: Wallet_Subheaders_Skill_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`bibliothèque de compétences`)
};

const ar_wallet_subheaders_skill_link = /** @type {(inputs: Wallet_Subheaders_Skill_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مكتبة مهاراتك`)
};

/**
* | output |
* | --- |
* | "skills library" |
*
* @param {Wallet_Subheaders_Skill_LinkInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_subheaders_skill_link = /** @type {((inputs?: Wallet_Subheaders_Skill_LinkInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Subheaders_Skill_LinkInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_subheaders_skill_link(inputs)
	if (locale === "es") return es_wallet_subheaders_skill_link(inputs)
	if (locale === "fr") return fr_wallet_subheaders_skill_link(inputs)
	return ar_wallet_subheaders_skill_link(inputs)
});
export { wallet_subheaders_skill_link as "wallet.subheaders.skill.link" }