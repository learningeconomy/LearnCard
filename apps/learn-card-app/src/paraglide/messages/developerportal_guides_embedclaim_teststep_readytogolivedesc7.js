/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Teststep_Readytogolivedesc7Inputs */

const en_developerportal_guides_embedclaim_teststep_readytogolivedesc7 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Readytogolivedesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Users can now claim credentials directly from your website.`)
};

const es_developerportal_guides_embedclaim_teststep_readytogolivedesc7 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Readytogolivedesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Los usuarios ahora pueden reclamar credenciales directamente desde tu sitio web.`)
};

const fr_developerportal_guides_embedclaim_teststep_readytogolivedesc7 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Readytogolivedesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les utilisateurs peuvent désormais réclamer des certificats directement depuis votre site web.`)
};

const ar_developerportal_guides_embedclaim_teststep_readytogolivedesc7 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Readytogolivedesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يمكن للمستخدمين الآن المطالبة بالمؤهلات مباشرة من موقعك على الويب.`)
};

/**
* | output |
* | --- |
* | "Users can now claim credentials directly from your website." |
*
* @param {Developerportal_Guides_Embedclaim_Teststep_Readytogolivedesc7Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_teststep_readytogolivedesc7 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Teststep_Readytogolivedesc7Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Teststep_Readytogolivedesc7Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_teststep_readytogolivedesc7(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_teststep_readytogolivedesc7(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_teststep_readytogolivedesc7(inputs)
	return ar_developerportal_guides_embedclaim_teststep_readytogolivedesc7(inputs)
});
export { developerportal_guides_embedclaim_teststep_readytogolivedesc7 as "developerPortal.guides.embedClaim.testStep.readyToGoLiveDesc" }