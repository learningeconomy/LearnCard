/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Labels_Numberofachievements4Inputs */

const en_developerportal_credentialbuilder_labels_numberofachievements4 = /** @type {(inputs: Developerportal_Credentialbuilder_Labels_Numberofachievements4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Number of Achievements`)
};

const es_developerportal_credentialbuilder_labels_numberofachievements4 = /** @type {(inputs: Developerportal_Credentialbuilder_Labels_Numberofachievements4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Number of Achievements`)
};

const fr_developerportal_credentialbuilder_labels_numberofachievements4 = /** @type {(inputs: Developerportal_Credentialbuilder_Labels_Numberofachievements4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Number of Achievements`)
};

const ar_developerportal_credentialbuilder_labels_numberofachievements4 = /** @type {(inputs: Developerportal_Credentialbuilder_Labels_Numberofachievements4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Number of Achievements`)
};

/**
* | output |
* | --- |
* | "Number of Achievements" |
*
* @param {Developerportal_Credentialbuilder_Labels_Numberofachievements4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_labels_numberofachievements4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Labels_Numberofachievements4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Labels_Numberofachievements4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_labels_numberofachievements4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_labels_numberofachievements4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_labels_numberofachievements4(inputs)
	return ar_developerportal_credentialbuilder_labels_numberofachievements4(inputs)
});
export { developerportal_credentialbuilder_labels_numberofachievements4 as "developerPortal.credentialBuilder.labels.numberOfAchievements" }