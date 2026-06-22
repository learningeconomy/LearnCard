/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Installsdkstep_Installation4Inputs */

const en_developerportal_guides_embedapp_installsdkstep_installation4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Installsdkstep_Installation4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Installation`)
};

const es_developerportal_guides_embedapp_installsdkstep_installation4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Installsdkstep_Installation4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Instalación`)
};

const fr_developerportal_guides_embedapp_installsdkstep_installation4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Installsdkstep_Installation4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Installation`)
};

const ar_developerportal_guides_embedapp_installsdkstep_installation4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Installsdkstep_Installation4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التثبيت`)
};

/**
* | output |
* | --- |
* | "Installation" |
*
* @param {Developerportal_Guides_Embedapp_Installsdkstep_Installation4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_installsdkstep_installation4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Installsdkstep_Installation4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Installsdkstep_Installation4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_installsdkstep_installation4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_installsdkstep_installation4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_installsdkstep_installation4(inputs)
	return ar_developerportal_guides_embedapp_installsdkstep_installation4(inputs)
});
export { developerportal_guides_embedapp_installsdkstep_installation4 as "developerPortal.guides.embedApp.installSdkStep.installation" }