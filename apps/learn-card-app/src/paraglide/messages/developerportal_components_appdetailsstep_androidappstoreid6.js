/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Androidappstoreid6Inputs */

const en_developerportal_components_appdetailsstep_androidappstoreid6 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Androidappstoreid6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Android Package Name (e.g., com.example.app)`)
};

const es_developerportal_components_appdetailsstep_androidappstoreid6 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Androidappstoreid6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre del Paquete Android (ej., com.ejemplo.app)`)
};

const fr_developerportal_components_appdetailsstep_androidappstoreid6 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Androidappstoreid6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom du Paquet Android (ex., com.exemple.app)`)
};

const ar_developerportal_components_appdetailsstep_androidappstoreid6 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Androidappstoreid6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم حزمة Android (مثال: com.example.app)`)
};

/**
* | output |
* | --- |
* | "Android Package Name (e.g., com.example.app)" |
*
* @param {Developerportal_Components_Appdetailsstep_Androidappstoreid6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_androidappstoreid6 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Androidappstoreid6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Androidappstoreid6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_androidappstoreid6(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_androidappstoreid6(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_androidappstoreid6(inputs)
	return ar_developerportal_components_appdetailsstep_androidappstoreid6(inputs)
});
export { developerportal_components_appdetailsstep_androidappstoreid6 as "developerPortal.components.appDetailsStep.androidAppStoreId" }