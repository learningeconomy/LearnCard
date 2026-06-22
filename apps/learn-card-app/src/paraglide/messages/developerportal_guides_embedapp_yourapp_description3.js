/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown>, context: NonNullable<unknown> }} Developerportal_Guides_Embedapp_Yourapp_Description3Inputs */

const en_developerportal_guides_embedapp_yourapp_description3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Description3Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`Here's your complete integration code with ${i?.count} features configured.`);
	return /** @type {LocalizedString} */ (`Here's your complete integration code with ${i?.count} feature configured.`)
	
};

const es_developerportal_guides_embedapp_yourapp_description3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Description3Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`Here's your complete integration code with ${i?.count} features configured.`);
	return /** @type {LocalizedString} */ (`Here's your complete integration code with ${i?.count} feature configured.`)
	
};

const fr_developerportal_guides_embedapp_yourapp_description3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Description3Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`Here's your complete integration code with ${i?.count} features configured.`);
	return /** @type {LocalizedString} */ (`Here's your complete integration code with ${i?.count} feature configured.`)
	
};

const ar_developerportal_guides_embedapp_yourapp_description3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Description3Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`Here's your complete integration code with ${i?.count} features configured.`);
	return /** @type {LocalizedString} */ (`Here's your complete integration code with ${i?.count} feature configured.`)
	
};

/**
* | context | output |
* | --- | --- |
* | "plural" | "Here's your complete integration code with {count} features configured." |
* | * | "Here's your complete integration code with {count} feature configured." |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_description3 = /** @type {((inputs: Developerportal_Guides_Embedapp_Yourapp_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_description3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_description3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_description3(inputs)
	return ar_developerportal_guides_embedapp_yourapp_description3(inputs)
});
export { developerportal_guides_embedapp_yourapp_description3 as "developerPortal.guides.embedApp.yourApp.description" }