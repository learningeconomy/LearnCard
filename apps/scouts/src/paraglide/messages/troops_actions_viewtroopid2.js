/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Actions_Viewtroopid2Inputs */

const en_troops_actions_viewtroopid2 = /** @type {(inputs: Troops_Actions_Viewtroopid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View Troop ID`)
};

const es_troops_actions_viewtroopid2 = /** @type {(inputs: Troops_Actions_Viewtroopid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver ID de Troop`)
};

const fr_troops_actions_viewtroopid2 = /** @type {(inputs: Troops_Actions_Viewtroopid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir l'ID de la troupe`)
};

const ar_troops_actions_viewtroopid2 = /** @type {(inputs: Troops_Actions_Viewtroopid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض معرف الفرقة`)
};

/**
* | output |
* | --- |
* | "View Troop ID" |
*
* @param {Troops_Actions_Viewtroopid2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_actions_viewtroopid2 = /** @type {((inputs?: Troops_Actions_Viewtroopid2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Actions_Viewtroopid2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_actions_viewtroopid2(inputs)
	if (locale === "es") return es_troops_actions_viewtroopid2(inputs)
	if (locale === "fr") return fr_troops_actions_viewtroopid2(inputs)
	return ar_troops_actions_viewtroopid2(inputs)
});
export { troops_actions_viewtroopid2 as "troops.actions.viewTroopId" }