/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Jsonpreview_Invalidjson4Inputs */

const en_developerportal_credentialbuilder_jsonpreview_invalidjson4 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Invalidjson4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid JSON`)
};

const es_developerportal_credentialbuilder_jsonpreview_invalidjson4 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Invalidjson4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`JSON Inválido`)
};

const fr_developerportal_credentialbuilder_jsonpreview_invalidjson4 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Invalidjson4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`JSON Invalide`)
};

const ar_developerportal_credentialbuilder_jsonpreview_invalidjson4 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Invalidjson4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`JSON غير صالح`)
};

/**
* | output |
* | --- |
* | "Invalid JSON" |
*
* @param {Developerportal_Credentialbuilder_Jsonpreview_Invalidjson4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_jsonpreview_invalidjson4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Jsonpreview_Invalidjson4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Jsonpreview_Invalidjson4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_jsonpreview_invalidjson4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_jsonpreview_invalidjson4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_jsonpreview_invalidjson4(inputs)
	return ar_developerportal_credentialbuilder_jsonpreview_invalidjson4(inputs)
});
export { developerportal_credentialbuilder_jsonpreview_invalidjson4 as "developerPortal.credentialBuilder.jsonPreview.invalidJson" }