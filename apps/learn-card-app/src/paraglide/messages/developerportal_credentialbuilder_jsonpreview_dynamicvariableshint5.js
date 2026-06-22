/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Jsonpreview_Dynamicvariableshint5Inputs */

const en_developerportal_credentialbuilder_jsonpreview_dynamicvariableshint5 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Dynamicvariableshint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`provide at issuance`)
};

const es_developerportal_credentialbuilder_jsonpreview_dynamicvariableshint5 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Dynamicvariableshint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`proporcionar al emitir`)
};

const fr_developerportal_credentialbuilder_jsonpreview_dynamicvariableshint5 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Dynamicvariableshint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`fournir à l'émission`)
};

const ar_developerportal_credentialbuilder_jsonpreview_dynamicvariableshint5 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Dynamicvariableshint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قدمها عند الإصدار`)
};

/**
* | output |
* | --- |
* | "provide at issuance" |
*
* @param {Developerportal_Credentialbuilder_Jsonpreview_Dynamicvariableshint5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_jsonpreview_dynamicvariableshint5 = /** @type {((inputs?: Developerportal_Credentialbuilder_Jsonpreview_Dynamicvariableshint5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Jsonpreview_Dynamicvariableshint5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_jsonpreview_dynamicvariableshint5(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_jsonpreview_dynamicvariableshint5(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_jsonpreview_dynamicvariableshint5(inputs)
	return ar_developerportal_credentialbuilder_jsonpreview_dynamicvariableshint5(inputs)
});
export { developerportal_credentialbuilder_jsonpreview_dynamicvariableshint5 as "developerPortal.credentialBuilder.jsonPreview.dynamicVariablesHint" }