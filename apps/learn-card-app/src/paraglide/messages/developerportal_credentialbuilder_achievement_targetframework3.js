/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Targetframework3Inputs */

const en_developerportal_credentialbuilder_achievement_targetframework3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targetframework3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Target Framework`)
};

const es_developerportal_credentialbuilder_achievement_targetframework3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targetframework3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Marco de Referencia`)
};

const fr_developerportal_credentialbuilder_achievement_targetframework3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targetframework3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cadre de Référence`)
};

const ar_developerportal_credentialbuilder_achievement_targetframework3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targetframework3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإطار المرجعي`)
};

/**
* | output |
* | --- |
* | "Target Framework" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Targetframework3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_targetframework3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Targetframework3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Targetframework3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_targetframework3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_targetframework3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_targetframework3(inputs)
	return ar_developerportal_credentialbuilder_achievement_targetframework3(inputs)
});
export { developerportal_credentialbuilder_achievement_targetframework3 as "developerPortal.credentialBuilder.achievement.targetFramework" }