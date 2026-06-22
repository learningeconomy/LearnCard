/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Jsonpreview_Title3Inputs */

const en_developerportal_credentialbuilder_jsonpreview_title3 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`JSON Preview`)
};

const es_developerportal_credentialbuilder_jsonpreview_title3 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista Previa JSON`)
};

const fr_developerportal_credentialbuilder_jsonpreview_title3 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu JSON`)
};

const ar_developerportal_credentialbuilder_jsonpreview_title3 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معاينة JSON`)
};

/**
* | output |
* | --- |
* | "JSON Preview" |
*
* @param {Developerportal_Credentialbuilder_Jsonpreview_Title3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_jsonpreview_title3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Jsonpreview_Title3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Jsonpreview_Title3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_jsonpreview_title3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_jsonpreview_title3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_jsonpreview_title3(inputs)
	return ar_developerportal_credentialbuilder_jsonpreview_title3(inputs)
});
export { developerportal_credentialbuilder_jsonpreview_title3 as "developerPortal.credentialBuilder.jsonPreview.title" }