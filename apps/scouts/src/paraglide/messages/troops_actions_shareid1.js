/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Actions_Shareid1Inputs */

const en_troops_actions_shareid1 = /** @type {(inputs: Troops_Actions_Shareid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share ID`)
};

const es_troops_actions_shareid1 = /** @type {(inputs: Troops_Actions_Shareid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartir ID`)
};

const fr_troops_actions_shareid1 = /** @type {(inputs: Troops_Actions_Shareid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partager l'ID`)
};

const ar_troops_actions_shareid1 = /** @type {(inputs: Troops_Actions_Shareid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share ID`)
};

/**
* | output |
* | --- |
* | "Share ID" |
*
* @param {Troops_Actions_Shareid1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_actions_shareid1 = /** @type {((inputs?: Troops_Actions_Shareid1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Actions_Shareid1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_actions_shareid1(inputs)
	if (locale === "es") return es_troops_actions_shareid1(inputs)
	if (locale === "fr") return fr_troops_actions_shareid1(inputs)
	return ar_troops_actions_shareid1(inputs)
});
export { troops_actions_shareid1 as "troops.actions.shareId" }