/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Requestcredentialssetup_Requestbyidbullet27Inputs */

const en_developerportal_guides_embedapp_requestcredentialssetup_requestbyidbullet27 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Requestbyidbullet27Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User accepts or declines`)
};

const es_developerportal_guides_embedapp_requestcredentialssetup_requestbyidbullet27 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Requestbyidbullet27Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User accepts or declines`)
};

const fr_developerportal_guides_embedapp_requestcredentialssetup_requestbyidbullet27 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Requestbyidbullet27Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User accepts or declines`)
};

const ar_developerportal_guides_embedapp_requestcredentialssetup_requestbyidbullet27 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Requestbyidbullet27Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User accepts or declines`)
};

/**
* | output |
* | --- |
* | "User accepts or declines" |
*
* @param {Developerportal_Guides_Embedapp_Requestcredentialssetup_Requestbyidbullet27Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_requestcredentialssetup_requestbyidbullet27 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Requestcredentialssetup_Requestbyidbullet27Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Requestcredentialssetup_Requestbyidbullet27Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_requestcredentialssetup_requestbyidbullet27(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_requestcredentialssetup_requestbyidbullet27(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_requestcredentialssetup_requestbyidbullet27(inputs)
	return ar_developerportal_guides_embedapp_requestcredentialssetup_requestbyidbullet27(inputs)
});
export { developerportal_guides_embedapp_requestcredentialssetup_requestbyidbullet27 as "developerPortal.guides.embedApp.requestCredentialsSetup.requestByIdBullet2" }