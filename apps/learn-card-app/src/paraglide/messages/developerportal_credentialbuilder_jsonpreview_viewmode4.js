/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Jsonpreview_Viewmode4Inputs */

const en_developerportal_credentialbuilder_jsonpreview_viewmode4 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Viewmode4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View Mode`)
};

const es_developerportal_credentialbuilder_jsonpreview_viewmode4 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Viewmode4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modo Vista`)
};

const fr_developerportal_credentialbuilder_jsonpreview_viewmode4 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Viewmode4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mode Visualisation`)
};

const ar_developerportal_credentialbuilder_jsonpreview_viewmode4 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Viewmode4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وضع العرض`)
};

/**
* | output |
* | --- |
* | "View Mode" |
*
* @param {Developerportal_Credentialbuilder_Jsonpreview_Viewmode4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_jsonpreview_viewmode4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Jsonpreview_Viewmode4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Jsonpreview_Viewmode4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_jsonpreview_viewmode4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_jsonpreview_viewmode4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_jsonpreview_viewmode4(inputs)
	return ar_developerportal_credentialbuilder_jsonpreview_viewmode4(inputs)
});
export { developerportal_credentialbuilder_jsonpreview_viewmode4 as "developerPortal.credentialBuilder.jsonPreview.viewMode" }