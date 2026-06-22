/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Idhelp3Inputs */

const en_developerportal_credentialbuilder_achievement_idhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Idhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unique identifier for this achievement type`)
};

const es_developerportal_credentialbuilder_achievement_idhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Idhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Identificador único para este tipo de logro`)
};

const fr_developerportal_credentialbuilder_achievement_idhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Idhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Identifiant unique pour ce type de réalisation`)
};

const ar_developerportal_credentialbuilder_achievement_idhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Idhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرف فريد لهذا النوع من الإنجاز`)
};

/**
* | output |
* | --- |
* | "Unique identifier for this achievement type" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Idhelp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_idhelp3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Idhelp3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Idhelp3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_idhelp3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_idhelp3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_idhelp3(inputs)
	return ar_developerportal_credentialbuilder_achievement_idhelp3(inputs)
});
export { developerportal_credentialbuilder_achievement_idhelp3 as "developerPortal.credentialBuilder.achievement.idHelp" }