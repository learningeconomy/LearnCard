/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Emptysection_Workhistory_Action3Inputs */

const en_passport_resumebuilder_emptysection_workhistory_action3 = /** @type {(inputs: Passport_Resumebuilder_Emptysection_Workhistory_Action3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Experience`)
};

const es_passport_resumebuilder_emptysection_workhistory_action3 = /** @type {(inputs: Passport_Resumebuilder_Emptysection_Workhistory_Action3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir experiencia`)
};

const fr_passport_resumebuilder_emptysection_workhistory_action3 = /** @type {(inputs: Passport_Resumebuilder_Emptysection_Workhistory_Action3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter une expérience`)
};

const ar_passport_resumebuilder_emptysection_workhistory_action3 = /** @type {(inputs: Passport_Resumebuilder_Emptysection_Workhistory_Action3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة خبرة`)
};

/**
* | output |
* | --- |
* | "Add Experience" |
*
* @param {Passport_Resumebuilder_Emptysection_Workhistory_Action3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_emptysection_workhistory_action3 = /** @type {((inputs?: Passport_Resumebuilder_Emptysection_Workhistory_Action3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Emptysection_Workhistory_Action3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_emptysection_workhistory_action3(inputs)
	if (locale === "es") return es_passport_resumebuilder_emptysection_workhistory_action3(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_emptysection_workhistory_action3(inputs)
	return ar_passport_resumebuilder_emptysection_workhistory_action3(inputs)
});
export { passport_resumebuilder_emptysection_workhistory_action3 as "passport.resumeBuilder.emptySection.workHistory.action" }