/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appstoreheader_Selectproject4Inputs */

const en_developerportal_components_appstoreheader_selectproject4 = /** @type {(inputs: Developerportal_Components_Appstoreheader_Selectproject4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Project`)
};

const es_developerportal_components_appstoreheader_selectproject4 = /** @type {(inputs: Developerportal_Components_Appstoreheader_Selectproject4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar Proyecto`)
};

const fr_developerportal_components_appstoreheader_selectproject4 = /** @type {(inputs: Developerportal_Components_Appstoreheader_Selectproject4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner un Projet`)
};

const ar_developerportal_components_appstoreheader_selectproject4 = /** @type {(inputs: Developerportal_Components_Appstoreheader_Selectproject4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختيار مشروع`)
};

/**
* | output |
* | --- |
* | "Select Project" |
*
* @param {Developerportal_Components_Appstoreheader_Selectproject4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appstoreheader_selectproject4 = /** @type {((inputs?: Developerportal_Components_Appstoreheader_Selectproject4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appstoreheader_Selectproject4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appstoreheader_selectproject4(inputs)
	if (locale === "es") return es_developerportal_components_appstoreheader_selectproject4(inputs)
	if (locale === "fr") return fr_developerportal_components_appstoreheader_selectproject4(inputs)
	return ar_developerportal_components_appstoreheader_selectproject4(inputs)
});
export { developerportal_components_appstoreheader_selectproject4 as "developerPortal.components.appStoreHeader.selectProject" }