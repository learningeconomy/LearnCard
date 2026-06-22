/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recoveryprompt_Continueediting2Inputs */

const en_recoveryprompt_continueediting2 = /** @type {(inputs: Recoveryprompt_Continueediting2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue Editing`)
};

const es_recoveryprompt_continueediting2 = /** @type {(inputs: Recoveryprompt_Continueediting2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuar editando`)
};

const fr_recoveryprompt_continueediting2 = /** @type {(inputs: Recoveryprompt_Continueediting2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer la modification`)
};

const ar_recoveryprompt_continueediting2 = /** @type {(inputs: Recoveryprompt_Continueediting2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متابعة التحرير`)
};

/**
* | output |
* | --- |
* | "Continue Editing" |
*
* @param {Recoveryprompt_Continueediting2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recoveryprompt_continueediting2 = /** @type {((inputs?: Recoveryprompt_Continueediting2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recoveryprompt_Continueediting2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recoveryprompt_continueediting2(inputs)
	if (locale === "es") return es_recoveryprompt_continueediting2(inputs)
	if (locale === "fr") return fr_recoveryprompt_continueediting2(inputs)
	return ar_recoveryprompt_continueediting2(inputs)
});
export { recoveryprompt_continueediting2 as "recoveryPrompt.continueEditing" }