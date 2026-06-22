/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Jsonpreview_Valid3Inputs */

const en_developerportal_credentialbuilder_jsonpreview_valid3 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Valid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Valid!`)
};

const es_developerportal_credentialbuilder_jsonpreview_valid3 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Valid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Válido!`)
};

const fr_developerportal_credentialbuilder_jsonpreview_valid3 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Valid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Valide !`)
};

const ar_developerportal_credentialbuilder_jsonpreview_valid3 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Valid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صالح!`)
};

/**
* | output |
* | --- |
* | "Valid!" |
*
* @param {Developerportal_Credentialbuilder_Jsonpreview_Valid3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_jsonpreview_valid3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Jsonpreview_Valid3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Jsonpreview_Valid3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_jsonpreview_valid3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_jsonpreview_valid3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_jsonpreview_valid3(inputs)
	return ar_developerportal_credentialbuilder_jsonpreview_valid3(inputs)
});
export { developerportal_credentialbuilder_jsonpreview_valid3 as "developerPortal.credentialBuilder.jsonPreview.valid" }