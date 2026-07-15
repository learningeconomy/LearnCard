/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ids_Notroopsmng2Inputs */

const en_ids_notroopsmng2 = /** @type {(inputs: Ids_Notroopsmng2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No troops to manage yet`)
};

const es_ids_notroopsmng2 = /** @type {(inputs: Ids_Notroopsmng2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay troops que gestionar`)
};

const fr_ids_notroopsmng2 = /** @type {(inputs: Ids_Notroopsmng2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune troupe à gérer pour l'instant`)
};

const ar_ids_notroopsmng2 = /** @type {(inputs: Ids_Notroopsmng2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد فرق لإدارتها بعد`)
};

/**
* | output |
* | --- |
* | "No troops to manage yet" |
*
* @param {Ids_Notroopsmng2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ids_notroopsmng2 = /** @type {((inputs?: Ids_Notroopsmng2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ids_Notroopsmng2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ids_notroopsmng2(inputs)
	if (locale === "es") return es_ids_notroopsmng2(inputs)
	if (locale === "fr") return fr_ids_notroopsmng2(inputs)
	return ar_ids_notroopsmng2(inputs)
});
export { ids_notroopsmng2 as "ids.noTroopsMng" }