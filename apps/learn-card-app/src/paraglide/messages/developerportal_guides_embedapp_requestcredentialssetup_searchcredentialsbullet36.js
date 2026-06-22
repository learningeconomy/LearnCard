/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Requestcredentialssetup_Searchcredentialsbullet36Inputs */

const en_developerportal_guides_embedapp_requestcredentialssetup_searchcredentialsbullet36 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Searchcredentialsbullet36Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Returns multiple matches`)
};

const es_developerportal_guides_embedapp_requestcredentialssetup_searchcredentialsbullet36 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Searchcredentialsbullet36Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Devuelve multiple matches`)
};

const fr_developerportal_guides_embedapp_requestcredentialssetup_searchcredentialsbullet36 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Searchcredentialsbullet36Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retourne multiple matches`)
};

const ar_developerportal_guides_embedapp_requestcredentialssetup_searchcredentialsbullet36 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Searchcredentialsbullet36Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإرجاع multiple matches`)
};

/**
* | output |
* | --- |
* | "Returns multiple matches" |
*
* @param {Developerportal_Guides_Embedapp_Requestcredentialssetup_Searchcredentialsbullet36Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_requestcredentialssetup_searchcredentialsbullet36 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Requestcredentialssetup_Searchcredentialsbullet36Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Requestcredentialssetup_Searchcredentialsbullet36Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_requestcredentialssetup_searchcredentialsbullet36(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_requestcredentialssetup_searchcredentialsbullet36(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_requestcredentialssetup_searchcredentialsbullet36(inputs)
	return ar_developerportal_guides_embedapp_requestcredentialssetup_searchcredentialsbullet36(inputs)
});
export { developerportal_guides_embedapp_requestcredentialssetup_searchcredentialsbullet36 as "developerPortal.guides.embedApp.requestCredentialsSetup.searchCredentialsBullet3" }