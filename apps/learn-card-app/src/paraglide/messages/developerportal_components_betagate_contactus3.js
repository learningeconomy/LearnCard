/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Betagate_Contactus3Inputs */

const en_developerportal_components_betagate_contactus3 = /** @type {(inputs: Developerportal_Components_Betagate_Contactus3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contact us`)
};

const es_developerportal_components_betagate_contactus3 = /** @type {(inputs: Developerportal_Components_Betagate_Contactus3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contáctanos`)
};

const fr_developerportal_components_betagate_contactus3 = /** @type {(inputs: Developerportal_Components_Betagate_Contactus3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contactez-nous`)
};

const ar_developerportal_components_betagate_contactus3 = /** @type {(inputs: Developerportal_Components_Betagate_Contactus3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اتصل بنا`)
};

/**
* | output |
* | --- |
* | "Contact us" |
*
* @param {Developerportal_Components_Betagate_Contactus3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_betagate_contactus3 = /** @type {((inputs?: Developerportal_Components_Betagate_Contactus3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Betagate_Contactus3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_betagate_contactus3(inputs)
	if (locale === "es") return es_developerportal_components_betagate_contactus3(inputs)
	if (locale === "fr") return fr_developerportal_components_betagate_contactus3(inputs)
	return ar_developerportal_components_betagate_contactus3(inputs)
});
export { developerportal_components_betagate_contactus3 as "developerPortal.components.betaGate.contactUs" }