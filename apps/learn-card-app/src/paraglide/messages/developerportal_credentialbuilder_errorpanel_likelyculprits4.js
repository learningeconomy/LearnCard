/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ plural: NonNullable<unknown> }} Developerportal_Credentialbuilder_Errorpanel_Likelyculprits4Inputs */

const en_developerportal_credentialbuilder_errorpanel_likelyculprits4 = /** @type {(inputs: Developerportal_Credentialbuilder_Errorpanel_Likelyculprits4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Likely culprit${i?.plural} (changed since last valid):`)
};

const es_developerportal_credentialbuilder_errorpanel_likelyculprits4 = /** @type {(inputs: Developerportal_Credentialbuilder_Errorpanel_Likelyculprits4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Posible${i?.plural} culpable${i?.plural} (cambiado desde el último válido):`)
};

const fr_developerportal_credentialbuilder_errorpanel_likelyculprits4 = /** @type {(inputs: Developerportal_Credentialbuilder_Errorpanel_Likelyculprits4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Coupable${i?.plural} probable${i?.plural} (modifié depuis le dernier valide) :`)
};

const ar_developerportal_credentialbuilder_errorpanel_likelyculprits4 = /** @type {(inputs: Developerportal_Credentialbuilder_Errorpanel_Likelyculprits4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`السبب المحتمل${i?.plural} (تغير منذ آخر إصدار صالح):`)
};

/**
* | output |
* | --- |
* | "Likely culprit{plural} (changed since last valid):" |
*
* @param {Developerportal_Credentialbuilder_Errorpanel_Likelyculprits4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_errorpanel_likelyculprits4 = /** @type {((inputs: Developerportal_Credentialbuilder_Errorpanel_Likelyculprits4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Errorpanel_Likelyculprits4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_errorpanel_likelyculprits4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_errorpanel_likelyculprits4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_errorpanel_likelyculprits4(inputs)
	return ar_developerportal_credentialbuilder_errorpanel_likelyculprits4(inputs)
});
export { developerportal_credentialbuilder_errorpanel_likelyculprits4 as "developerPortal.credentialBuilder.errorPanel.likelyCulprits" }