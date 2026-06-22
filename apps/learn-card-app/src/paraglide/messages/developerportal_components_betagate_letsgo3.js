/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Betagate_Letsgo3Inputs */

const en_developerportal_components_betagate_letsgo3 = /** @type {(inputs: Developerportal_Components_Betagate_Letsgo3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Let's Go!`)
};

const es_developerportal_components_betagate_letsgo3 = /** @type {(inputs: Developerportal_Components_Betagate_Letsgo3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Vamos!`)
};

const fr_developerportal_components_betagate_letsgo3 = /** @type {(inputs: Developerportal_Components_Betagate_Letsgo3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`C'est Parti !`)
};

const ar_developerportal_components_betagate_letsgo3 = /** @type {(inputs: Developerportal_Components_Betagate_Letsgo3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هيا بنا!`)
};

/**
* | output |
* | --- |
* | "Let's Go!" |
*
* @param {Developerportal_Components_Betagate_Letsgo3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_betagate_letsgo3 = /** @type {((inputs?: Developerportal_Components_Betagate_Letsgo3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Betagate_Letsgo3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_betagate_letsgo3(inputs)
	if (locale === "es") return es_developerportal_components_betagate_letsgo3(inputs)
	if (locale === "fr") return fr_developerportal_components_betagate_letsgo3(inputs)
	return ar_developerportal_components_betagate_letsgo3(inputs)
});
export { developerportal_components_betagate_letsgo3 as "developerPortal.components.betaGate.letsGo" }