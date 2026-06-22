/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Errorpanel_Revert3Inputs */

const en_developerportal_credentialbuilder_errorpanel_revert3 = /** @type {(inputs: Developerportal_Credentialbuilder_Errorpanel_Revert3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revert`)
};

const es_developerportal_credentialbuilder_errorpanel_revert3 = /** @type {(inputs: Developerportal_Credentialbuilder_Errorpanel_Revert3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revertir`)
};

const fr_developerportal_credentialbuilder_errorpanel_revert3 = /** @type {(inputs: Developerportal_Credentialbuilder_Errorpanel_Revert3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revenir`)
};

const ar_developerportal_credentialbuilder_errorpanel_revert3 = /** @type {(inputs: Developerportal_Credentialbuilder_Errorpanel_Revert3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تراجع`)
};

/**
* | output |
* | --- |
* | "Revert" |
*
* @param {Developerportal_Credentialbuilder_Errorpanel_Revert3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_errorpanel_revert3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Errorpanel_Revert3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Errorpanel_Revert3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_errorpanel_revert3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_errorpanel_revert3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_errorpanel_revert3(inputs)
	return ar_developerportal_credentialbuilder_errorpanel_revert3(inputs)
});
export { developerportal_credentialbuilder_errorpanel_revert3 as "developerPortal.credentialBuilder.errorPanel.revert" }