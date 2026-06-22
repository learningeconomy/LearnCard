/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Features_Peerbadgesdesc4Inputs */

const en_developerportal_guides_embedapp_features_peerbadgesdesc4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Peerbadgesdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Let users send badges to each other within your app using your credential templates.`)
};

const es_developerportal_guides_embedapp_features_peerbadgesdesc4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Peerbadgesdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Let users send badges to each other within your app using your credential templates.`)
};

const fr_developerportal_guides_embedapp_features_peerbadgesdesc4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Peerbadgesdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Let users send badges to each other within your app using your credential templates.`)
};

const ar_developerportal_guides_embedapp_features_peerbadgesdesc4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Peerbadgesdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Let users send badges to each other within your app using your credential templates.`)
};

/**
* | output |
* | --- |
* | "Let users send badges to each other within your app using your credential templates." |
*
* @param {Developerportal_Guides_Embedapp_Features_Peerbadgesdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_features_peerbadgesdesc4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Features_Peerbadgesdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Features_Peerbadgesdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_features_peerbadgesdesc4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_features_peerbadgesdesc4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_features_peerbadgesdesc4(inputs)
	return ar_developerportal_guides_embedapp_features_peerbadgesdesc4(inputs)
});
export { developerportal_guides_embedapp_features_peerbadgesdesc4 as "developerPortal.guides.embedApp.features.peerBadgesDesc" }