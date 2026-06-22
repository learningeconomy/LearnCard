/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ summary: NonNullable<unknown> }} Developerportal_Credentialbuilder_Errorpanel_Summary3Inputs */

const en_developerportal_credentialbuilder_errorpanel_summary3 = /** @type {(inputs: Developerportal_Credentialbuilder_Errorpanel_Summary3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.summary}`)
};

const es_developerportal_credentialbuilder_errorpanel_summary3 = /** @type {(inputs: Developerportal_Credentialbuilder_Errorpanel_Summary3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.summary}`)
};

const fr_developerportal_credentialbuilder_errorpanel_summary3 = /** @type {(inputs: Developerportal_Credentialbuilder_Errorpanel_Summary3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.summary}`)
};

const ar_developerportal_credentialbuilder_errorpanel_summary3 = /** @type {(inputs: Developerportal_Credentialbuilder_Errorpanel_Summary3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.summary}`)
};

/**
* | output |
* | --- |
* | "{summary}" |
*
* @param {Developerportal_Credentialbuilder_Errorpanel_Summary3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_errorpanel_summary3 = /** @type {((inputs: Developerportal_Credentialbuilder_Errorpanel_Summary3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Errorpanel_Summary3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_errorpanel_summary3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_errorpanel_summary3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_errorpanel_summary3(inputs)
	return ar_developerportal_credentialbuilder_errorpanel_summary3(inputs)
});
export { developerportal_credentialbuilder_errorpanel_summary3 as "developerPortal.credentialBuilder.errorPanel.summary" }