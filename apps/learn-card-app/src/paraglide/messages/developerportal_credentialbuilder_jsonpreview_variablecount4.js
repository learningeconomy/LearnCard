/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Credentialbuilder_Jsonpreview_Variablecount4Inputs */

const en_developerportal_credentialbuilder_jsonpreview_variablecount4 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Variablecount4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count}`)
};

const es_developerportal_credentialbuilder_jsonpreview_variablecount4 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Variablecount4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count}`)
};

const fr_developerportal_credentialbuilder_jsonpreview_variablecount4 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Variablecount4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count}`)
};

const ar_developerportal_credentialbuilder_jsonpreview_variablecount4 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Variablecount4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count}`)
};

/**
* | output |
* | --- |
* | "{count}" |
*
* @param {Developerportal_Credentialbuilder_Jsonpreview_Variablecount4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_jsonpreview_variablecount4 = /** @type {((inputs: Developerportal_Credentialbuilder_Jsonpreview_Variablecount4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Jsonpreview_Variablecount4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_jsonpreview_variablecount4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_jsonpreview_variablecount4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_jsonpreview_variablecount4(inputs)
	return ar_developerportal_credentialbuilder_jsonpreview_variablecount4(inputs)
});
export { developerportal_credentialbuilder_jsonpreview_variablecount4 as "developerPortal.credentialBuilder.jsonPreview.variableCount" }