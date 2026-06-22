/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Betagate_Guidenotavailable4Inputs */

const en_developerportal_components_betagate_guidenotavailable4 = /** @type {(inputs: Developerportal_Components_Betagate_Guidenotavailable4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This guide is not available with your current beta access.`)
};

const es_developerportal_components_betagate_guidenotavailable4 = /** @type {(inputs: Developerportal_Components_Betagate_Guidenotavailable4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esta guía no está disponible con tu acceso beta actual.`)
};

const fr_developerportal_components_betagate_guidenotavailable4 = /** @type {(inputs: Developerportal_Components_Betagate_Guidenotavailable4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ce guide n'est pas disponible avec votre accès beta actuel.`)
};

const ar_developerportal_components_betagate_guidenotavailable4 = /** @type {(inputs: Developerportal_Components_Betagate_Guidenotavailable4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هذا الدليل غير متاح مع وصولك التجريبي الحالي.`)
};

/**
* | output |
* | --- |
* | "This guide is not available with your current beta access." |
*
* @param {Developerportal_Components_Betagate_Guidenotavailable4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_betagate_guidenotavailable4 = /** @type {((inputs?: Developerportal_Components_Betagate_Guidenotavailable4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Betagate_Guidenotavailable4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_betagate_guidenotavailable4(inputs)
	if (locale === "es") return es_developerportal_components_betagate_guidenotavailable4(inputs)
	if (locale === "fr") return fr_developerportal_components_betagate_guidenotavailable4(inputs)
	return ar_developerportal_components_betagate_guidenotavailable4(inputs)
});
export { developerportal_components_betagate_guidenotavailable4 as "developerPortal.components.betaGate.guideNotAvailable" }