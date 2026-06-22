/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Criteriaidhelp4Inputs */

const en_developerportal_credentialbuilder_achievement_criteriaidhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criteriaidhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL to detailed criteria documentation`)
};

const es_developerportal_credentialbuilder_achievement_criteriaidhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criteriaidhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL a la documentación detallada de criterios`)
};

const fr_developerportal_credentialbuilder_achievement_criteriaidhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criteriaidhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de la documentation détaillée des critères`)
};

const ar_developerportal_credentialbuilder_achievement_criteriaidhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criteriaidhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رابط URL لوثائق المعايير التفصيلية`)
};

/**
* | output |
* | --- |
* | "URL to detailed criteria documentation" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Criteriaidhelp4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_criteriaidhelp4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Criteriaidhelp4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Criteriaidhelp4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_criteriaidhelp4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_criteriaidhelp4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_criteriaidhelp4(inputs)
	return ar_developerportal_credentialbuilder_achievement_criteriaidhelp4(inputs)
});
export { developerportal_credentialbuilder_achievement_criteriaidhelp4 as "developerPortal.credentialBuilder.achievement.criteriaIdHelp" }