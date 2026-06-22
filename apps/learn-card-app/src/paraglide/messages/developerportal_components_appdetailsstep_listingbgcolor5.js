/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Listingbgcolor5Inputs */

const en_developerportal_components_appdetailsstep_listingbgcolor5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Listingbgcolor5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Listing Background Color`)
};

const es_developerportal_components_appdetailsstep_listingbgcolor5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Listingbgcolor5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Color de Fondo del Listado`)
};

const fr_developerportal_components_appdetailsstep_listingbgcolor5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Listingbgcolor5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Couleur de Fond de l'Annonce`)
};

const ar_developerportal_components_appdetailsstep_listingbgcolor5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Listingbgcolor5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لون خلفية القائمة`)
};

/**
* | output |
* | --- |
* | "Listing Background Color" |
*
* @param {Developerportal_Components_Appdetailsstep_Listingbgcolor5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_listingbgcolor5 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Listingbgcolor5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Listingbgcolor5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_listingbgcolor5(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_listingbgcolor5(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_listingbgcolor5(inputs)
	return ar_developerportal_components_appdetailsstep_listingbgcolor5(inputs)
});
export { developerportal_components_appdetailsstep_listingbgcolor5 as "developerPortal.components.appDetailsStep.listingBgColor" }