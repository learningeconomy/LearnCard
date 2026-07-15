/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Notroopmembers5Inputs */

const en_boostcms_notroopmembers5 = /** @type {(inputs: Boostcms_Notroopmembers5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No troop members`)
};

const es_boostcms_notroopmembers5 = /** @type {(inputs: Boostcms_Notroopmembers5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin miembros del troop`)
};

const fr_boostcms_notroopmembers5 = /** @type {(inputs: Boostcms_Notroopmembers5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun membre de la troupe`)
};

const ar_boostcms_notroopmembers5 = /** @type {(inputs: Boostcms_Notroopmembers5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No troop members`)
};

/**
* | output |
* | --- |
* | "No troop members" |
*
* @param {Boostcms_Notroopmembers5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_notroopmembers5 = /** @type {((inputs?: Boostcms_Notroopmembers5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Notroopmembers5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_notroopmembers5(inputs)
	if (locale === "es") return es_boostcms_notroopmembers5(inputs)
	if (locale === "fr") return fr_boostcms_notroopmembers5(inputs)
	return ar_boostcms_notroopmembers5(inputs)
});
export { boostcms_notroopmembers5 as "boostCMS.noTroopMembers" }