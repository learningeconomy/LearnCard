/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Betagate_Apitokenmanagement4Inputs */

const en_developerportal_components_betagate_apitokenmanagement4 = /** @type {(inputs: Developerportal_Components_Betagate_Apitokenmanagement4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`API token management`)
};

const es_developerportal_components_betagate_apitokenmanagement4 = /** @type {(inputs: Developerportal_Components_Betagate_Apitokenmanagement4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestión de tokens API`)
};

const fr_developerportal_components_betagate_apitokenmanagement4 = /** @type {(inputs: Developerportal_Components_Betagate_Apitokenmanagement4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestion des jetons API`)
};

const ar_developerportal_components_betagate_apitokenmanagement4 = /** @type {(inputs: Developerportal_Components_Betagate_Apitokenmanagement4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إدارة رموز API`)
};

/**
* | output |
* | --- |
* | "API token management" |
*
* @param {Developerportal_Components_Betagate_Apitokenmanagement4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_betagate_apitokenmanagement4 = /** @type {((inputs?: Developerportal_Components_Betagate_Apitokenmanagement4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Betagate_Apitokenmanagement4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_betagate_apitokenmanagement4(inputs)
	if (locale === "es") return es_developerportal_components_betagate_apitokenmanagement4(inputs)
	if (locale === "fr") return fr_developerportal_components_betagate_apitokenmanagement4(inputs)
	return ar_developerportal_components_betagate_apitokenmanagement4(inputs)
});
export { developerportal_components_betagate_apitokenmanagement4 as "developerPortal.components.betaGate.apiTokenManagement" }