/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Targetframeworkplaceholder4Inputs */

const en_developerportal_credentialbuilder_achievement_targetframeworkplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targetframeworkplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., ISTE`)
};

const es_developerportal_credentialbuilder_achievement_targetframeworkplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targetframeworkplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ej., ISTE`)
};

const fr_developerportal_credentialbuilder_achievement_targetframeworkplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targetframeworkplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex., ISTE`)
};

const ar_developerportal_credentialbuilder_achievement_targetframeworkplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targetframeworkplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: ISTE`)
};

/**
* | output |
* | --- |
* | "e.g., ISTE" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Targetframeworkplaceholder4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_targetframeworkplaceholder4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Targetframeworkplaceholder4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Targetframeworkplaceholder4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_targetframeworkplaceholder4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_targetframeworkplaceholder4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_targetframeworkplaceholder4(inputs)
	return ar_developerportal_credentialbuilder_achievement_targetframeworkplaceholder4(inputs)
});
export { developerportal_credentialbuilder_achievement_targetframeworkplaceholder4 as "developerPortal.credentialBuilder.achievement.targetFrameworkPlaceholder" }