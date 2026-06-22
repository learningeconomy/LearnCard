/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recoveryprompt_Startfresh2Inputs */

const en_recoveryprompt_startfresh2 = /** @type {(inputs: Recoveryprompt_Startfresh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Start Fresh`)
};

const es_recoveryprompt_startfresh2 = /** @type {(inputs: Recoveryprompt_Startfresh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Empezar de nuevo`)
};

const fr_recoveryprompt_startfresh2 = /** @type {(inputs: Recoveryprompt_Startfresh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recommencer`)
};

const ar_recoveryprompt_startfresh2 = /** @type {(inputs: Recoveryprompt_Startfresh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البدء من جديد`)
};

/**
* | output |
* | --- |
* | "Start Fresh" |
*
* @param {Recoveryprompt_Startfresh2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recoveryprompt_startfresh2 = /** @type {((inputs?: Recoveryprompt_Startfresh2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recoveryprompt_Startfresh2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recoveryprompt_startfresh2(inputs)
	if (locale === "es") return es_recoveryprompt_startfresh2(inputs)
	if (locale === "fr") return fr_recoveryprompt_startfresh2(inputs)
	return ar_recoveryprompt_startfresh2(inputs)
});
export { recoveryprompt_startfresh2 as "recoveryPrompt.startFresh" }