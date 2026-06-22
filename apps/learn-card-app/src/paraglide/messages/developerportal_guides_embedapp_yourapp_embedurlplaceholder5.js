/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Yourapp_Embedurlplaceholder5Inputs */

const en_developerportal_guides_embedapp_yourapp_embedurlplaceholder5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Embedurlplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://yourapp.com/embed`)
};

const es_developerportal_guides_embedapp_yourapp_embedurlplaceholder5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Embedurlplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://yourapp.com/embed`)
};

const fr_developerportal_guides_embedapp_yourapp_embedurlplaceholder5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Embedurlplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://yourapp.com/embed`)
};

const ar_developerportal_guides_embedapp_yourapp_embedurlplaceholder5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Embedurlplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://yourapp.com/embed`)
};

/**
* | output |
* | --- |
* | "https://yourapp.com/embed" |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Embedurlplaceholder5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_embedurlplaceholder5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Yourapp_Embedurlplaceholder5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Embedurlplaceholder5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_embedurlplaceholder5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_embedurlplaceholder5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_embedurlplaceholder5(inputs)
	return ar_developerportal_guides_embedapp_yourapp_embedurlplaceholder5(inputs)
});
export { developerportal_guides_embedapp_yourapp_embedurlplaceholder5 as "developerPortal.guides.embedApp.yourApp.embedUrlPlaceholder" }