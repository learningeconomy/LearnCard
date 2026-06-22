/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Guides_Embedapp_Launchfeaturesetup_Selected4Inputs */

const en_developerportal_guides_embedapp_launchfeaturesetup_selected4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchfeaturesetup_Selected4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} selected`)
};

const es_developerportal_guides_embedapp_launchfeaturesetup_selected4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchfeaturesetup_Selected4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} selected`)
};

const fr_developerportal_guides_embedapp_launchfeaturesetup_selected4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchfeaturesetup_Selected4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} selected`)
};

const ar_developerportal_guides_embedapp_launchfeaturesetup_selected4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchfeaturesetup_Selected4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} selected`)
};

/**
* | output |
* | --- |
* | "{count} selected" |
*
* @param {Developerportal_Guides_Embedapp_Launchfeaturesetup_Selected4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_launchfeaturesetup_selected4 = /** @type {((inputs: Developerportal_Guides_Embedapp_Launchfeaturesetup_Selected4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Launchfeaturesetup_Selected4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_launchfeaturesetup_selected4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_launchfeaturesetup_selected4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_launchfeaturesetup_selected4(inputs)
	return ar_developerportal_guides_embedapp_launchfeaturesetup_selected4(inputs)
});
export { developerportal_guides_embedapp_launchfeaturesetup_selected4 as "developerPortal.guides.embedApp.launchFeatureSetup.selected" }