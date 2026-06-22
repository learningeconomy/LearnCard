/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Betagate_Otherguideslocked4Inputs */

const en_developerportal_components_betagate_otherguideslocked4 = /** @type {(inputs: Developerportal_Components_Betagate_Otherguideslocked4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Other guides (locked)`)
};

const es_developerportal_components_betagate_otherguideslocked4 = /** @type {(inputs: Developerportal_Components_Betagate_Otherguideslocked4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Otras guías (bloqueadas)`)
};

const fr_developerportal_components_betagate_otherguideslocked4 = /** @type {(inputs: Developerportal_Components_Betagate_Otherguideslocked4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autres guides (verrouillés)`)
};

const ar_developerportal_components_betagate_otherguideslocked4 = /** @type {(inputs: Developerportal_Components_Betagate_Otherguideslocked4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدلة أخرى (مقفلة)`)
};

/**
* | output |
* | --- |
* | "Other guides (locked)" |
*
* @param {Developerportal_Components_Betagate_Otherguideslocked4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_betagate_otherguideslocked4 = /** @type {((inputs?: Developerportal_Components_Betagate_Otherguideslocked4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Betagate_Otherguideslocked4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_betagate_otherguideslocked4(inputs)
	if (locale === "es") return es_developerportal_components_betagate_otherguideslocked4(inputs)
	if (locale === "fr") return fr_developerportal_components_betagate_otherguideslocked4(inputs)
	return ar_developerportal_components_betagate_otherguideslocked4(inputs)
});
export { developerportal_components_betagate_otherguideslocked4 as "developerPortal.components.betaGate.otherGuidesLocked" }