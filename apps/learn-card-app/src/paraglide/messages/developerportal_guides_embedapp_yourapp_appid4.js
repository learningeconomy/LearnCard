/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ id: NonNullable<unknown> }} Developerportal_Guides_Embedapp_Yourapp_Appid4Inputs */

const en_developerportal_guides_embedapp_yourapp_appid4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Appid4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`App ID: ${i?.id}`)
};

const es_developerportal_guides_embedapp_yourapp_appid4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Appid4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`App ID: ${i?.id}`)
};

const fr_developerportal_guides_embedapp_yourapp_appid4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Appid4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`App ID: ${i?.id}`)
};

const ar_developerportal_guides_embedapp_yourapp_appid4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Appid4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`App ID: ${i?.id}`)
};

/**
* | output |
* | --- |
* | "App ID: {id}" |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Appid4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_appid4 = /** @type {((inputs: Developerportal_Guides_Embedapp_Yourapp_Appid4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Appid4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_appid4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_appid4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_appid4(inputs)
	return ar_developerportal_guides_embedapp_yourapp_appid4(inputs)
});
export { developerportal_guides_embedapp_yourapp_appid4 as "developerPortal.guides.embedApp.yourApp.appId" }