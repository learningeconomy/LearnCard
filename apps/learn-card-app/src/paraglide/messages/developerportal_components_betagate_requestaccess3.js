/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Betagate_Requestaccess3Inputs */

const en_developerportal_components_betagate_requestaccess3 = /** @type {(inputs: Developerportal_Components_Betagate_Requestaccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request Access`)
};

const es_developerportal_components_betagate_requestaccess3 = /** @type {(inputs: Developerportal_Components_Betagate_Requestaccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitar Acceso`)
};

const fr_developerportal_components_betagate_requestaccess3 = /** @type {(inputs: Developerportal_Components_Betagate_Requestaccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demander l'Accès`)
};

const ar_developerportal_components_betagate_requestaccess3 = /** @type {(inputs: Developerportal_Components_Betagate_Requestaccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب وصول`)
};

/**
* | output |
* | --- |
* | "Request Access" |
*
* @param {Developerportal_Components_Betagate_Requestaccess3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_betagate_requestaccess3 = /** @type {((inputs?: Developerportal_Components_Betagate_Requestaccess3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Betagate_Requestaccess3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_betagate_requestaccess3(inputs)
	if (locale === "es") return es_developerportal_components_betagate_requestaccess3(inputs)
	if (locale === "fr") return fr_developerportal_components_betagate_requestaccess3(inputs)
	return ar_developerportal_components_betagate_requestaccess3(inputs)
});
export { developerportal_components_betagate_requestaccess3 as "developerPortal.components.betaGate.requestAccess" }