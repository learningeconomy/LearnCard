/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Features_Launchfeaturedesc4Inputs */

const en_developerportal_guides_embedapp_features_launchfeaturedesc4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Launchfeaturedesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Trigger native LearnCard tools directly from your app. Open the QR scanner, start an AI session, or display the profile card.`)
};

const es_developerportal_guides_embedapp_features_launchfeaturedesc4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Launchfeaturedesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Trigger native LearnCard tools directly from your app. Open the QR scanner, start an AI session, or display the profile card.`)
};

const fr_developerportal_guides_embedapp_features_launchfeaturedesc4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Launchfeaturedesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Trigger native LearnCard tools directly from your app. Open the QR scanner, start an AI session, or display the profile card.`)
};

const ar_developerportal_guides_embedapp_features_launchfeaturedesc4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Launchfeaturedesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Trigger native LearnCard tools directly from your app. Open the QR scanner, start an AI session, or display the profile card.`)
};

/**
* | output |
* | --- |
* | "Trigger native LearnCard tools directly from your app. Open the QR scanner, start an AI session, or display the profile card." |
*
* @param {Developerportal_Guides_Embedapp_Features_Launchfeaturedesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_features_launchfeaturedesc4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Features_Launchfeaturedesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Features_Launchfeaturedesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_features_launchfeaturedesc4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_features_launchfeaturedesc4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_features_launchfeaturedesc4(inputs)
	return ar_developerportal_guides_embedapp_features_launchfeaturedesc4(inputs)
});
export { developerportal_guides_embedapp_features_launchfeaturedesc4 as "developerPortal.guides.embedApp.features.launchFeatureDesc" }