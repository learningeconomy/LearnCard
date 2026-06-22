/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Launchfeaturesetup_Tip44Inputs */

const en_developerportal_guides_embedapp_launchfeaturesetup_tip44 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchfeaturesetup_Tip44Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Results indicate success/failure of the navigation`)
};

const es_developerportal_guides_embedapp_launchfeaturesetup_tip44 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchfeaturesetup_Tip44Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Results indicate success/failure of the navigation`)
};

const fr_developerportal_guides_embedapp_launchfeaturesetup_tip44 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchfeaturesetup_Tip44Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Results indicate success/failure of the navigation`)
};

const ar_developerportal_guides_embedapp_launchfeaturesetup_tip44 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchfeaturesetup_Tip44Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Results indicate success/failure of the navigation`)
};

/**
* | output |
* | --- |
* | "Results indicate success/failure of the navigation" |
*
* @param {Developerportal_Guides_Embedapp_Launchfeaturesetup_Tip44Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_launchfeaturesetup_tip44 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Launchfeaturesetup_Tip44Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Launchfeaturesetup_Tip44Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_launchfeaturesetup_tip44(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_launchfeaturesetup_tip44(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_launchfeaturesetup_tip44(inputs)
	return ar_developerportal_guides_embedapp_launchfeaturesetup_tip44(inputs)
});
export { developerportal_guides_embedapp_launchfeaturesetup_tip44 as "developerPortal.guides.embedApp.launchFeatureSetup.tip4" }