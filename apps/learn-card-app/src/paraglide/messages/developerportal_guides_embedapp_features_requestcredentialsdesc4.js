/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Features_Requestcredentialsdesc4Inputs */

const en_developerportal_guides_embedapp_features_requestcredentialsdesc4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Requestcredentialsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ask users to share credentials with your app for verification or gated access.`)
};

const es_developerportal_guides_embedapp_features_requestcredentialsdesc4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Requestcredentialsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ask users to share credentials with your app for verification or gated access.`)
};

const fr_developerportal_guides_embedapp_features_requestcredentialsdesc4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Requestcredentialsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ask users to share credentials with your app for verification or gated access.`)
};

const ar_developerportal_guides_embedapp_features_requestcredentialsdesc4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Requestcredentialsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ask users to share credentials with your app for verification or gated access.`)
};

/**
* | output |
* | --- |
* | "Ask users to share credentials with your app for verification or gated access." |
*
* @param {Developerportal_Guides_Embedapp_Features_Requestcredentialsdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_features_requestcredentialsdesc4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Features_Requestcredentialsdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Features_Requestcredentialsdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_features_requestcredentialsdesc4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_features_requestcredentialsdesc4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_features_requestcredentialsdesc4(inputs)
	return ar_developerportal_guides_embedapp_features_requestcredentialsdesc4(inputs)
});
export { developerportal_guides_embedapp_features_requestcredentialsdesc4 as "developerPortal.guides.embedApp.features.requestCredentialsDesc" }