/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ids_Notroops1Inputs */

const en_ids_notroops1 = /** @type {(inputs: Ids_Notroops1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No troops yet`)
};

const es_ids_notroops1 = /** @type {(inputs: Ids_Notroops1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay troops`)
};

const fr_ids_notroops1 = /** @type {(inputs: Ids_Notroops1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune troupe pour l'instant`)
};

const ar_ids_notroops1 = /** @type {(inputs: Ids_Notroops1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد فرق بعد`)
};

/**
* | output |
* | --- |
* | "No troops yet" |
*
* @param {Ids_Notroops1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ids_notroops1 = /** @type {((inputs?: Ids_Notroops1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ids_Notroops1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ids_notroops1(inputs)
	if (locale === "es") return es_ids_notroops1(inputs)
	if (locale === "fr") return fr_ids_notroops1(inputs)
	return ar_ids_notroops1(inputs)
});
export { ids_notroops1 as "ids.noTroops" }