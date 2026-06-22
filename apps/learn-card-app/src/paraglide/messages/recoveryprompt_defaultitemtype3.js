/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recoveryprompt_Defaultitemtype3Inputs */

const en_recoveryprompt_defaultitemtype3 = /** @type {(inputs: Recoveryprompt_Defaultitemtype3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`item`)
};

const es_recoveryprompt_defaultitemtype3 = /** @type {(inputs: Recoveryprompt_Defaultitemtype3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`elemento`)
};

const fr_recoveryprompt_defaultitemtype3 = /** @type {(inputs: Recoveryprompt_Defaultitemtype3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`élément`)
};

const ar_recoveryprompt_defaultitemtype3 = /** @type {(inputs: Recoveryprompt_Defaultitemtype3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عنصر`)
};

/**
* | output |
* | --- |
* | "item" |
*
* @param {Recoveryprompt_Defaultitemtype3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recoveryprompt_defaultitemtype3 = /** @type {((inputs?: Recoveryprompt_Defaultitemtype3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recoveryprompt_Defaultitemtype3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recoveryprompt_defaultitemtype3(inputs)
	if (locale === "es") return es_recoveryprompt_defaultitemtype3(inputs)
	if (locale === "fr") return fr_recoveryprompt_defaultitemtype3(inputs)
	return ar_recoveryprompt_defaultitemtype3(inputs)
});
export { recoveryprompt_defaultitemtype3 as "recoveryPrompt.defaultItemType" }