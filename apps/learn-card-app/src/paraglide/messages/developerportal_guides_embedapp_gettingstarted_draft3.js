/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Gettingstarted_Draft3Inputs */

const en_developerportal_guides_embedapp_gettingstarted_draft3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Draft3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Draft`)
};

const es_developerportal_guides_embedapp_gettingstarted_draft3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Draft3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Borrador`)
};

const fr_developerportal_guides_embedapp_gettingstarted_draft3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Draft3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Brouillon`)
};

const ar_developerportal_guides_embedapp_gettingstarted_draft3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Draft3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسودة`)
};

/**
* | output |
* | --- |
* | "Draft" |
*
* @param {Developerportal_Guides_Embedapp_Gettingstarted_Draft3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_gettingstarted_draft3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Gettingstarted_Draft3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Gettingstarted_Draft3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_gettingstarted_draft3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_gettingstarted_draft3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_gettingstarted_draft3(inputs)
	return ar_developerportal_guides_embedapp_gettingstarted_draft3(inputs)
});
export { developerportal_guides_embedapp_gettingstarted_draft3 as "developerPortal.guides.embedApp.gettingStarted.draft" }