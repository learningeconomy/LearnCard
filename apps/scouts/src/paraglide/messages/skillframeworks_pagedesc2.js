/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Pagedesc2Inputs */

const en_skillframeworks_pagedesc2 = /** @type {(inputs: Skillframeworks_Pagedesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage frameworks and attach them to networks`)
};

const es_skillframeworks_pagedesc2 = /** @type {(inputs: Skillframeworks_Pagedesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestiona marcos y adjúntalos a redes`)
};

const fr_skillframeworks_pagedesc2 = /** @type {(inputs: Skillframeworks_Pagedesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérer les cadres et les attacher aux réseaux`)
};

const ar_skillframeworks_pagedesc2 = /** @type {(inputs: Skillframeworks_Pagedesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage frameworks and attach them to networks`)
};

/**
* | output |
* | --- |
* | "Manage frameworks and attach them to networks" |
*
* @param {Skillframeworks_Pagedesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_pagedesc2 = /** @type {((inputs?: Skillframeworks_Pagedesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Pagedesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_pagedesc2(inputs)
	if (locale === "es") return es_skillframeworks_pagedesc2(inputs)
	if (locale === "fr") return fr_skillframeworks_pagedesc2(inputs)
	return ar_skillframeworks_pagedesc2(inputs)
});
export { skillframeworks_pagedesc2 as "skillFrameworks.pageDesc" }