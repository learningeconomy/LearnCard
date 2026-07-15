/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Actions_Viewjson1Inputs */

const en_troops_actions_viewjson1 = /** @type {(inputs: Troops_Actions_Viewjson1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View ID JSON`)
};

const es_troops_actions_viewjson1 = /** @type {(inputs: Troops_Actions_Viewjson1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver JSON de ID`)
};

const fr_troops_actions_viewjson1 = /** @type {(inputs: Troops_Actions_Viewjson1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir le JSON de l'ID`)
};

const ar_troops_actions_viewjson1 = /** @type {(inputs: Troops_Actions_Viewjson1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض JSON المعرف`)
};

/**
* | output |
* | --- |
* | "View ID JSON" |
*
* @param {Troops_Actions_Viewjson1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_actions_viewjson1 = /** @type {((inputs?: Troops_Actions_Viewjson1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Actions_Viewjson1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_actions_viewjson1(inputs)
	if (locale === "es") return es_troops_actions_viewjson1(inputs)
	if (locale === "fr") return fr_troops_actions_viewjson1(inputs)
	return ar_troops_actions_viewjson1(inputs)
});
export { troops_actions_viewjson1 as "troops.actions.viewJson" }