/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Yourapp_Sdkdocumentation4Inputs */

const en_developerportal_guides_embedapp_yourapp_sdkdocumentation4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Sdkdocumentation4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`SDK Documentation`)
};

const es_developerportal_guides_embedapp_yourapp_sdkdocumentation4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Sdkdocumentation4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Documentación del SDK`)
};

const fr_developerportal_guides_embedapp_yourapp_sdkdocumentation4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Sdkdocumentation4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Documentation du SDK`)
};

const ar_developerportal_guides_embedapp_yourapp_sdkdocumentation4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Sdkdocumentation4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وثائق SDK`)
};

/**
* | output |
* | --- |
* | "SDK Documentation" |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Sdkdocumentation4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_sdkdocumentation4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Yourapp_Sdkdocumentation4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Sdkdocumentation4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_sdkdocumentation4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_sdkdocumentation4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_sdkdocumentation4(inputs)
	return ar_developerportal_guides_embedapp_yourapp_sdkdocumentation4(inputs)
});
export { developerportal_guides_embedapp_yourapp_sdkdocumentation4 as "developerPortal.guides.embedApp.yourApp.sdkDocumentation" }