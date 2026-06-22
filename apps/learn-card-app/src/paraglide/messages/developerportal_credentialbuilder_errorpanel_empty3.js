/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Errorpanel_Empty3Inputs */

const en_developerportal_credentialbuilder_errorpanel_empty3 = /** @type {(inputs: Developerportal_Credentialbuilder_Errorpanel_Empty3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(empty)`)
};

const es_developerportal_credentialbuilder_errorpanel_empty3 = /** @type {(inputs: Developerportal_Credentialbuilder_Errorpanel_Empty3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(vacío)`)
};

const fr_developerportal_credentialbuilder_errorpanel_empty3 = /** @type {(inputs: Developerportal_Credentialbuilder_Errorpanel_Empty3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(vide)`)
};

const ar_developerportal_credentialbuilder_errorpanel_empty3 = /** @type {(inputs: Developerportal_Credentialbuilder_Errorpanel_Empty3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(فارغ)`)
};

/**
* | output |
* | --- |
* | "(empty)" |
*
* @param {Developerportal_Credentialbuilder_Errorpanel_Empty3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_errorpanel_empty3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Errorpanel_Empty3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Errorpanel_Empty3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_errorpanel_empty3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_errorpanel_empty3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_errorpanel_empty3(inputs)
	return ar_developerportal_credentialbuilder_errorpanel_empty3(inputs)
});
export { developerportal_credentialbuilder_errorpanel_empty3 as "developerPortal.credentialBuilder.errorPanel.empty" }