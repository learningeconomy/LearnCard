/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Requestcredentialssetup_Requestbyidbullet37Inputs */

const en_developerportal_guides_embedapp_requestcredentialssetup_requestbyidbullet37 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Requestbyidbullet37Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Returns single credential`)
};

const es_developerportal_guides_embedapp_requestcredentialssetup_requestbyidbullet37 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Requestbyidbullet37Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Devuelve single credential`)
};

const fr_developerportal_guides_embedapp_requestcredentialssetup_requestbyidbullet37 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Requestbyidbullet37Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retourne single credential`)
};

const ar_developerportal_guides_embedapp_requestcredentialssetup_requestbyidbullet37 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Requestbyidbullet37Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإرجاع single credential`)
};

/**
* | output |
* | --- |
* | "Returns single credential" |
*
* @param {Developerportal_Guides_Embedapp_Requestcredentialssetup_Requestbyidbullet37Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_requestcredentialssetup_requestbyidbullet37 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Requestcredentialssetup_Requestbyidbullet37Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Requestcredentialssetup_Requestbyidbullet37Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_requestcredentialssetup_requestbyidbullet37(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_requestcredentialssetup_requestbyidbullet37(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_requestcredentialssetup_requestbyidbullet37(inputs)
	return ar_developerportal_guides_embedapp_requestcredentialssetup_requestbyidbullet37(inputs)
});
export { developerportal_guides_embedapp_requestcredentialssetup_requestbyidbullet37 as "developerPortal.guides.embedApp.requestCredentialsSetup.requestByIdBullet3" }