/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Installsdkstep_Navigationdesc5Inputs */

const en_developerportal_guides_embedapp_installsdkstep_navigationdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Installsdkstep_Navigationdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launch wallet features`)
};

const es_developerportal_guides_embedapp_installsdkstep_navigationdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Installsdkstep_Navigationdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launch wallet features`)
};

const fr_developerportal_guides_embedapp_installsdkstep_navigationdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Installsdkstep_Navigationdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launch wallet features`)
};

const ar_developerportal_guides_embedapp_installsdkstep_navigationdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Installsdkstep_Navigationdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launch wallet features`)
};

/**
* | output |
* | --- |
* | "Launch wallet features" |
*
* @param {Developerportal_Guides_Embedapp_Installsdkstep_Navigationdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_installsdkstep_navigationdesc5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Installsdkstep_Navigationdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Installsdkstep_Navigationdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_installsdkstep_navigationdesc5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_installsdkstep_navigationdesc5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_installsdkstep_navigationdesc5(inputs)
	return ar_developerportal_guides_embedapp_installsdkstep_navigationdesc5(inputs)
});
export { developerportal_guides_embedapp_installsdkstep_navigationdesc5 as "developerPortal.guides.embedApp.installSdkStep.navigationDesc" }