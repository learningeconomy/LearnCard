/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Jsonpreview_Systemvariables4Inputs */

const en_developerportal_credentialbuilder_jsonpreview_systemvariables4 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Systemvariables4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`System Variables`)
};

const es_developerportal_credentialbuilder_jsonpreview_systemvariables4 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Systemvariables4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Variables del Sistema`)
};

const fr_developerportal_credentialbuilder_jsonpreview_systemvariables4 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Systemvariables4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Variables Système`)
};

const ar_developerportal_credentialbuilder_jsonpreview_systemvariables4 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Systemvariables4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متغيرات النظام`)
};

/**
* | output |
* | --- |
* | "System Variables" |
*
* @param {Developerportal_Credentialbuilder_Jsonpreview_Systemvariables4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_jsonpreview_systemvariables4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Jsonpreview_Systemvariables4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Jsonpreview_Systemvariables4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_jsonpreview_systemvariables4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_jsonpreview_systemvariables4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_jsonpreview_systemvariables4(inputs)
	return ar_developerportal_credentialbuilder_jsonpreview_systemvariables4(inputs)
});
export { developerportal_credentialbuilder_jsonpreview_systemvariables4 as "developerPortal.credentialBuilder.jsonPreview.systemVariables" }