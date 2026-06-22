/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Yourapp_Tip43Inputs */

const en_developerportal_guides_embedapp_yourapp_tip43 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Tip43Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test in the LearnCard sandbox before going live`)
};

const es_developerportal_guides_embedapp_yourapp_tip43 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Tip43Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test in the LearnCard sandbox before going live`)
};

const fr_developerportal_guides_embedapp_yourapp_tip43 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Tip43Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test in the LearnCard sandbox before going live`)
};

const ar_developerportal_guides_embedapp_yourapp_tip43 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Tip43Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test in the LearnCard sandbox before going live`)
};

/**
* | output |
* | --- |
* | "Test in the LearnCard sandbox before going live" |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Tip43Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_tip43 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Yourapp_Tip43Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Tip43Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_tip43(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_tip43(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_tip43(inputs)
	return ar_developerportal_guides_embedapp_yourapp_tip43(inputs)
});
export { developerportal_guides_embedapp_yourapp_tip43 as "developerPortal.guides.embedApp.yourApp.tip4" }