/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Jsonpreview_Reset3Inputs */

const en_developerportal_credentialbuilder_jsonpreview_reset3 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Reset3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reset`)
};

const es_developerportal_credentialbuilder_jsonpreview_reset3 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Reset3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Restablecer`)
};

const fr_developerportal_credentialbuilder_jsonpreview_reset3 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Reset3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réinitialiser`)
};

const ar_developerportal_credentialbuilder_jsonpreview_reset3 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Reset3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعادة تعيين`)
};

/**
* | output |
* | --- |
* | "Reset" |
*
* @param {Developerportal_Credentialbuilder_Jsonpreview_Reset3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_jsonpreview_reset3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Jsonpreview_Reset3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Jsonpreview_Reset3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_jsonpreview_reset3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_jsonpreview_reset3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_jsonpreview_reset3(inputs)
	return ar_developerportal_credentialbuilder_jsonpreview_reset3(inputs)
});
export { developerportal_credentialbuilder_jsonpreview_reset3 as "developerPortal.credentialBuilder.jsonPreview.reset" }