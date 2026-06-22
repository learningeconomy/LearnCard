/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Yourapp_Githubexamples4Inputs */

const en_developerportal_guides_embedapp_yourapp_githubexamples4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Githubexamples4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`GitHub Examples`)
};

const es_developerportal_guides_embedapp_yourapp_githubexamples4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Githubexamples4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ejemplos de GitHub`)
};

const fr_developerportal_guides_embedapp_yourapp_githubexamples4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Githubexamples4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`GitHub Exemples`)
};

const ar_developerportal_guides_embedapp_yourapp_githubexamples4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Githubexamples4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`GitHub مثالs`)
};

/**
* | output |
* | --- |
* | "GitHub Examples" |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Githubexamples4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_githubexamples4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Yourapp_Githubexamples4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Githubexamples4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_githubexamples4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_githubexamples4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_githubexamples4(inputs)
	return ar_developerportal_guides_embedapp_yourapp_githubexamples4(inputs)
});
export { developerportal_guides_embedapp_yourapp_githubexamples4 as "developerPortal.guides.embedApp.yourApp.githubExamples" }