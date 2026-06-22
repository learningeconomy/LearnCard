/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Fieldofstudyplaceholder5Inputs */

const en_developerportal_credentialbuilder_achievement_fieldofstudyplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Fieldofstudyplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., Computer Science`)
};

const es_developerportal_credentialbuilder_achievement_fieldofstudyplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Fieldofstudyplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ej., Ciencias de la Computación`)
};

const fr_developerportal_credentialbuilder_achievement_fieldofstudyplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Fieldofstudyplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex., Informatique`)
};

const ar_developerportal_credentialbuilder_achievement_fieldofstudyplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Fieldofstudyplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: علوم الحاسوب`)
};

/**
* | output |
* | --- |
* | "e.g., Computer Science" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Fieldofstudyplaceholder5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_fieldofstudyplaceholder5 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Fieldofstudyplaceholder5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Fieldofstudyplaceholder5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_fieldofstudyplaceholder5(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_fieldofstudyplaceholder5(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_fieldofstudyplaceholder5(inputs)
	return ar_developerportal_credentialbuilder_achievement_fieldofstudyplaceholder5(inputs)
});
export { developerportal_credentialbuilder_achievement_fieldofstudyplaceholder5 as "developerPortal.credentialBuilder.achievement.fieldOfStudyPlaceholder" }