/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Yourapp_Continuetogolive6Inputs */

const en_developerportal_guides_embedapp_yourapp_continuetogolive6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Continuetogolive6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue to Go Live`)
};

const es_developerportal_guides_embedapp_yourapp_continuetogolive6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Continuetogolive6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuar to Publicar`)
};

const fr_developerportal_guides_embedapp_yourapp_continuetogolive6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Continuetogolive6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer to Mise en Ligne`)
};

const ar_developerportal_guides_embedapp_yourapp_continuetogolive6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Continuetogolive6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متابعة to النشر`)
};

/**
* | output |
* | --- |
* | "Continue to Go Live" |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Continuetogolive6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_continuetogolive6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Yourapp_Continuetogolive6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Continuetogolive6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_continuetogolive6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_continuetogolive6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_continuetogolive6(inputs)
	return ar_developerportal_guides_embedapp_yourapp_continuetogolive6(inputs)
});
export { developerportal_guides_embedapp_yourapp_continuetogolive6 as "developerPortal.guides.embedApp.yourApp.continueToGoLive" }