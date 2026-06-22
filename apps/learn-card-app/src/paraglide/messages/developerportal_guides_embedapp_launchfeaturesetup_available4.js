/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Guides_Embedapp_Launchfeaturesetup_Available4Inputs */

const en_developerportal_guides_embedapp_launchfeaturesetup_available4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchfeaturesetup_Available4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} available`)
};

const es_developerportal_guides_embedapp_launchfeaturesetup_available4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchfeaturesetup_Available4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} available`)
};

const fr_developerportal_guides_embedapp_launchfeaturesetup_available4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchfeaturesetup_Available4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} available`)
};

const ar_developerportal_guides_embedapp_launchfeaturesetup_available4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchfeaturesetup_Available4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} available`)
};

/**
* | output |
* | --- |
* | "{count} available" |
*
* @param {Developerportal_Guides_Embedapp_Launchfeaturesetup_Available4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_launchfeaturesetup_available4 = /** @type {((inputs: Developerportal_Guides_Embedapp_Launchfeaturesetup_Available4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Launchfeaturesetup_Available4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_launchfeaturesetup_available4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_launchfeaturesetup_available4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_launchfeaturesetup_available4(inputs)
	return ar_developerportal_guides_embedapp_launchfeaturesetup_available4(inputs)
});
export { developerportal_guides_embedapp_launchfeaturesetup_available4 as "developerPortal.guides.embedApp.launchFeatureSetup.available" }