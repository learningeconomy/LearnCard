/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Gettingstarted_Createfirstapp5Inputs */

const en_developerportal_guides_embedapp_gettingstarted_createfirstapp5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Createfirstapp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create your first app to get started`)
};

const es_developerportal_guides_embedapp_gettingstarted_createfirstapp5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Createfirstapp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea tu primera aplicación para comenzar`)
};

const fr_developerportal_guides_embedapp_gettingstarted_createfirstapp5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Createfirstapp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create your first app to get started`)
};

const ar_developerportal_guides_embedapp_gettingstarted_createfirstapp5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Createfirstapp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء your first app to get started`)
};

/**
* | output |
* | --- |
* | "Create your first app to get started" |
*
* @param {Developerportal_Guides_Embedapp_Gettingstarted_Createfirstapp5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_gettingstarted_createfirstapp5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Gettingstarted_Createfirstapp5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Gettingstarted_Createfirstapp5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_gettingstarted_createfirstapp5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_gettingstarted_createfirstapp5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_gettingstarted_createfirstapp5(inputs)
	return ar_developerportal_guides_embedapp_gettingstarted_createfirstapp5(inputs)
});
export { developerportal_guides_embedapp_gettingstarted_createfirstapp5 as "developerPortal.guides.embedApp.gettingStarted.createFirstApp" }