/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Contactinfodesc5Inputs */

const en_developerportal_components_appdetailsstep_contactinfodesc5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Contactinfodesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A reliable contact method in case any issues arise with your application during the review process.`)
};

const es_developerportal_components_appdetailsstep_contactinfodesc5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Contactinfodesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un método de contacto confiable en caso de que surjan problemas con tu aplicación durante el proceso de revisión.`)
};

const fr_developerportal_components_appdetailsstep_contactinfodesc5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Contactinfodesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une méthode de contact fiable en cas de problème avec votre application pendant le processus de révision.`)
};

const ar_developerportal_components_appdetailsstep_contactinfodesc5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Contactinfodesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طريقة اتصال موثوقة في حالة ظهور أي مشكلات مع تطبيقك أثناء عملية المراجعة.`)
};

/**
* | output |
* | --- |
* | "A reliable contact method in case any issues arise with your application during the review process." |
*
* @param {Developerportal_Components_Appdetailsstep_Contactinfodesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_contactinfodesc5 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Contactinfodesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Contactinfodesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_contactinfodesc5(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_contactinfodesc5(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_contactinfodesc5(inputs)
	return ar_developerportal_components_appdetailsstep_contactinfodesc5(inputs)
});
export { developerportal_components_appdetailsstep_contactinfodesc5 as "developerPortal.components.appDetailsStep.contactInfoDesc" }