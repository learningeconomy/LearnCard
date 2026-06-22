/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Yourapp_Updateappconfigdesc6Inputs */

const en_developerportal_guides_embedapp_yourapp_updateappconfigdesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Updateappconfigdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your selected features require different permissions than your app currently has configured.`)
};

const es_developerportal_guides_embedapp_yourapp_updateappconfigdesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Updateappconfigdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your selected features require different permissions than your app currently has configured.`)
};

const fr_developerportal_guides_embedapp_yourapp_updateappconfigdesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Updateappconfigdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your selected features require different permissions than your app currently has configured.`)
};

const ar_developerportal_guides_embedapp_yourapp_updateappconfigdesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Updateappconfigdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your selected features require different permissions than your app currently has configured.`)
};

/**
* | output |
* | --- |
* | "Your selected features require different permissions than your app currently has configured." |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Updateappconfigdesc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_updateappconfigdesc6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Yourapp_Updateappconfigdesc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Updateappconfigdesc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_updateappconfigdesc6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_updateappconfigdesc6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_updateappconfigdesc6(inputs)
	return ar_developerportal_guides_embedapp_yourapp_updateappconfigdesc6(inputs)
});
export { developerportal_guides_embedapp_yourapp_updateappconfigdesc6 as "developerPortal.guides.embedApp.yourApp.updateAppConfigDesc" }