/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Yourapp_Tip33Inputs */

const en_developerportal_guides_embedapp_yourapp_tip33 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Tip33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Store sensitive values (seeds, API keys) in environment variables`)
};

const es_developerportal_guides_embedapp_yourapp_tip33 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Tip33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Store sensitive values (seeds, API keys) in environment variables`)
};

const fr_developerportal_guides_embedapp_yourapp_tip33 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Tip33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Store sensitive values (seeds, API keys) in environment variables`)
};

const ar_developerportal_guides_embedapp_yourapp_tip33 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Tip33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Store sensitive values (seeds, API keys) in environment variables`)
};

/**
* | output |
* | --- |
* | "Store sensitive values (seeds, API keys) in environment variables" |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Tip33Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_tip33 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Yourapp_Tip33Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Tip33Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_tip33(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_tip33(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_tip33(inputs)
	return ar_developerportal_guides_embedapp_yourapp_tip33(inputs)
});
export { developerportal_guides_embedapp_yourapp_tip33 as "developerPortal.guides.embedApp.yourApp.tip3" }