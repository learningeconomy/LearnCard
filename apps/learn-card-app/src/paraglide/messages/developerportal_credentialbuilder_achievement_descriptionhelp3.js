/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Descriptionhelp3Inputs */

const en_developerportal_credentialbuilder_achievement_descriptionhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Descriptionhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What did the recipient achieve?`)
};

const es_developerportal_credentialbuilder_achievement_descriptionhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Descriptionhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Qué logró el destinatario?`)
};

const fr_developerportal_credentialbuilder_achievement_descriptionhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Descriptionhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Qu'a accompli le destinataire ?`)
};

const ar_developerportal_credentialbuilder_achievement_descriptionhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Descriptionhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ماذا حقق المستلم؟`)
};

/**
* | output |
* | --- |
* | "What did the recipient achieve?" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Descriptionhelp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_descriptionhelp3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Descriptionhelp3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Descriptionhelp3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_descriptionhelp3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_descriptionhelp3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_descriptionhelp3(inputs)
	return ar_developerportal_credentialbuilder_achievement_descriptionhelp3(inputs)
});
export { developerportal_credentialbuilder_achievement_descriptionhelp3 as "developerPortal.credentialBuilder.achievement.descriptionHelp" }