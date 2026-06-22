/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Gettingstarted_Notagline4Inputs */

const en_developerportal_guides_embedapp_gettingstarted_notagline4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Notagline4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No tagline set`)
};

const es_developerportal_guides_embedapp_gettingstarted_notagline4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Notagline4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin eslogan`)
};

const fr_developerportal_guides_embedapp_gettingstarted_notagline4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Notagline4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No tagline set`)
};

const ar_developerportal_guides_embedapp_gettingstarted_notagline4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Notagline4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No tagline set`)
};

/**
* | output |
* | --- |
* | "No tagline set" |
*
* @param {Developerportal_Guides_Embedapp_Gettingstarted_Notagline4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_gettingstarted_notagline4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Gettingstarted_Notagline4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Gettingstarted_Notagline4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_gettingstarted_notagline4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_gettingstarted_notagline4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_gettingstarted_notagline4(inputs)
	return ar_developerportal_guides_embedapp_gettingstarted_notagline4(inputs)
});
export { developerportal_guides_embedapp_gettingstarted_notagline4 as "developerPortal.guides.embedApp.gettingStarted.noTagline" }