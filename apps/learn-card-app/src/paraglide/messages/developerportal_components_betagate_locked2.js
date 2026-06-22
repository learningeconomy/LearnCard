/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Betagate_Locked2Inputs */

const en_developerportal_components_betagate_locked2 = /** @type {(inputs: Developerportal_Components_Betagate_Locked2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`locked`)
};

const es_developerportal_components_betagate_locked2 = /** @type {(inputs: Developerportal_Components_Betagate_Locked2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`bloqueada`)
};

const fr_developerportal_components_betagate_locked2 = /** @type {(inputs: Developerportal_Components_Betagate_Locked2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`verrouillée`)
};

const ar_developerportal_components_betagate_locked2 = /** @type {(inputs: Developerportal_Components_Betagate_Locked2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مقفل`)
};

/**
* | output |
* | --- |
* | "locked" |
*
* @param {Developerportal_Components_Betagate_Locked2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_betagate_locked2 = /** @type {((inputs?: Developerportal_Components_Betagate_Locked2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Betagate_Locked2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_betagate_locked2(inputs)
	if (locale === "es") return es_developerportal_components_betagate_locked2(inputs)
	if (locale === "fr") return fr_developerportal_components_betagate_locked2(inputs)
	return ar_developerportal_components_betagate_locked2(inputs)
});
export { developerportal_components_betagate_locked2 as "developerPortal.components.betaGate.locked" }