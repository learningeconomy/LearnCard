/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Betagate_Guidelockeddesc4Inputs */

const en_developerportal_components_betagate_guidelockeddesc4 = /** @type {(inputs: Developerportal_Components_Betagate_Guidelockeddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This guide is not available with your current beta access. Contact us to request expanded access.`)
};

const es_developerportal_components_betagate_guidelockeddesc4 = /** @type {(inputs: Developerportal_Components_Betagate_Guidelockeddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This guide is not available with your current beta access. Contact us to request expanded access.`)
};

const fr_developerportal_components_betagate_guidelockeddesc4 = /** @type {(inputs: Developerportal_Components_Betagate_Guidelockeddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This guide is not available with your current beta access. Contact us to request expanded access.`)
};

const ar_developerportal_components_betagate_guidelockeddesc4 = /** @type {(inputs: Developerportal_Components_Betagate_Guidelockeddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This guide is not available with your current beta access. Contact us to request expanded access.`)
};

/**
* | output |
* | --- |
* | "This guide is not available with your current beta access. Contact us to request expanded access." |
*
* @param {Developerportal_Components_Betagate_Guidelockeddesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_betagate_guidelockeddesc4 = /** @type {((inputs?: Developerportal_Components_Betagate_Guidelockeddesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Betagate_Guidelockeddesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_betagate_guidelockeddesc4(inputs)
	if (locale === "es") return es_developerportal_components_betagate_guidelockeddesc4(inputs)
	if (locale === "fr") return fr_developerportal_components_betagate_guidelockeddesc4(inputs)
	return ar_developerportal_components_betagate_guidelockeddesc4(inputs)
});
export { developerportal_components_betagate_guidelockeddesc4 as "developerPortal.components.betaGate.guideLockedDesc" }