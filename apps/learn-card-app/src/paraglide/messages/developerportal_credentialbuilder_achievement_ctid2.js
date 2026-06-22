/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Ctid2Inputs */

const en_developerportal_credentialbuilder_achievement_ctid2 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Ctid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Registry ID (CTID)`)
};

const es_developerportal_credentialbuilder_achievement_ctid2 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Ctid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de Registro de Credenciales (CTID)`)
};

const fr_developerportal_credentialbuilder_achievement_ctid2 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Ctid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID du Registre de Crédentials (CTID)`)
};

const ar_developerportal_credentialbuilder_achievement_ctid2 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Ctid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرف سجل الاعتماد (CTID)`)
};

/**
* | output |
* | --- |
* | "Credential Registry ID (CTID)" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Ctid2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_ctid2 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Ctid2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Ctid2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_ctid2(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_ctid2(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_ctid2(inputs)
	return ar_developerportal_credentialbuilder_achievement_ctid2(inputs)
});
export { developerportal_credentialbuilder_achievement_ctid2 as "developerPortal.credentialBuilder.achievement.ctid" }