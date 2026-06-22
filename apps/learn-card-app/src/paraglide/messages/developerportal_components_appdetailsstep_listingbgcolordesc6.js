/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Listingbgcolordesc6Inputs */

const en_developerportal_components_appdetailsstep_listingbgcolordesc6 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Listingbgcolordesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose a background color for your app's detail page`)
};

const es_developerportal_components_appdetailsstep_listingbgcolordesc6 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Listingbgcolordesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elige un color de fondo para la página de detalles de tu aplicación`)
};

const fr_developerportal_components_appdetailsstep_listingbgcolordesc6 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Listingbgcolordesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez une couleur de fond pour la page de détail de votre application`)
};

const ar_developerportal_components_appdetailsstep_listingbgcolordesc6 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Listingbgcolordesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر لون خلفية لصفحة تفاصيل تطبيقك`)
};

/**
* | output |
* | --- |
* | "Choose a background color for your app's detail page" |
*
* @param {Developerportal_Components_Appdetailsstep_Listingbgcolordesc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_listingbgcolordesc6 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Listingbgcolordesc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Listingbgcolordesc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_listingbgcolordesc6(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_listingbgcolordesc6(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_listingbgcolordesc6(inputs)
	return ar_developerportal_components_appdetailsstep_listingbgcolordesc6(inputs)
});
export { developerportal_components_appdetailsstep_listingbgcolordesc6 as "developerPortal.components.appDetailsStep.listingBgColorDesc" }