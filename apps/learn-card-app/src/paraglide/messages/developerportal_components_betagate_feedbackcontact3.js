/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Betagate_Feedbackcontact3Inputs */

const en_developerportal_components_betagate_feedbackcontact3 = /** @type {(inputs: Developerportal_Components_Betagate_Feedbackcontact3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`support@learncard.com`)
};

const es_developerportal_components_betagate_feedbackcontact3 = /** @type {(inputs: Developerportal_Components_Betagate_Feedbackcontact3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`support@learncard.com`)
};

const fr_developerportal_components_betagate_feedbackcontact3 = /** @type {(inputs: Developerportal_Components_Betagate_Feedbackcontact3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`support@learncard.com`)
};

const ar_developerportal_components_betagate_feedbackcontact3 = /** @type {(inputs: Developerportal_Components_Betagate_Feedbackcontact3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`support@learncard.com`)
};

/**
* | output |
* | --- |
* | "support@learncard.com" |
*
* @param {Developerportal_Components_Betagate_Feedbackcontact3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_betagate_feedbackcontact3 = /** @type {((inputs?: Developerportal_Components_Betagate_Feedbackcontact3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Betagate_Feedbackcontact3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_betagate_feedbackcontact3(inputs)
	if (locale === "es") return es_developerportal_components_betagate_feedbackcontact3(inputs)
	if (locale === "fr") return fr_developerportal_components_betagate_feedbackcontact3(inputs)
	return ar_developerportal_components_betagate_feedbackcontact3(inputs)
});
export { developerportal_components_betagate_feedbackcontact3 as "developerPortal.components.betaGate.feedbackContact" }