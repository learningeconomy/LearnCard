/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Ctidplaceholder3Inputs */

const en_developerportal_credentialbuilder_achievement_ctidplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Ctidplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ce-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
};

const es_developerportal_credentialbuilder_achievement_ctidplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Ctidplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ce-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
};

const fr_developerportal_credentialbuilder_achievement_ctidplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Ctidplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ce-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
};

const ar_developerportal_credentialbuilder_achievement_ctidplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Ctidplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ce-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
};

/**
* | output |
* | --- |
* | "ce-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Ctidplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_ctidplaceholder3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Ctidplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Ctidplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_ctidplaceholder3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_ctidplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_ctidplaceholder3(inputs)
	return ar_developerportal_credentialbuilder_achievement_ctidplaceholder3(inputs)
});
export { developerportal_credentialbuilder_achievement_ctidplaceholder3 as "developerPortal.credentialBuilder.achievement.ctidPlaceholder" }