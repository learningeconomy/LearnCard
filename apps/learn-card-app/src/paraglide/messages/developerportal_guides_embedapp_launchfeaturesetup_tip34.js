/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Launchfeaturesetup_Tip34Inputs */

const en_developerportal_guides_embedapp_launchfeaturesetup_tip34 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchfeaturesetup_Tip34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admin tools are only accessible to users with admin permissions`)
};

const es_developerportal_guides_embedapp_launchfeaturesetup_tip34 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchfeaturesetup_Tip34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admin tools are only accessible to users with admin permissions`)
};

const fr_developerportal_guides_embedapp_launchfeaturesetup_tip34 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchfeaturesetup_Tip34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admin tools are only accessible to users with admin permissions`)
};

const ar_developerportal_guides_embedapp_launchfeaturesetup_tip34 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchfeaturesetup_Tip34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admin tools are only accessible to users with admin permissions`)
};

/**
* | output |
* | --- |
* | "Admin tools are only accessible to users with admin permissions" |
*
* @param {Developerportal_Guides_Embedapp_Launchfeaturesetup_Tip34Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_launchfeaturesetup_tip34 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Launchfeaturesetup_Tip34Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Launchfeaturesetup_Tip34Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_launchfeaturesetup_tip34(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_launchfeaturesetup_tip34(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_launchfeaturesetup_tip34(inputs)
	return ar_developerportal_guides_embedapp_launchfeaturesetup_tip34(inputs)
});
export { developerportal_guides_embedapp_launchfeaturesetup_tip34 as "developerPortal.guides.embedApp.launchFeatureSetup.tip3" }