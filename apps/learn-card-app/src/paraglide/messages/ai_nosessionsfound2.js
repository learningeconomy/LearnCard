/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Nosessionsfound2Inputs */

const en_ai_nosessionsfound2 = /** @type {(inputs: Ai_Nosessionsfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No sessions found`)
};

const es_ai_nosessionsfound2 = /** @type {(inputs: Ai_Nosessionsfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontraron sesiones`)
};

const fr_ai_nosessionsfound2 = /** @type {(inputs: Ai_Nosessionsfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune session trouvée`)
};

const ar_ai_nosessionsfound2 = /** @type {(inputs: Ai_Nosessionsfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم العثور على جلسات`)
};

/**
* | output |
* | --- |
* | "No sessions found" |
*
* @param {Ai_Nosessionsfound2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_nosessionsfound2 = /** @type {((inputs?: Ai_Nosessionsfound2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Nosessionsfound2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_nosessionsfound2(inputs)
	if (locale === "es") return es_ai_nosessionsfound2(inputs)
	if (locale === "fr") return fr_ai_nosessionsfound2(inputs)
	return ar_ai_nosessionsfound2(inputs)
});
export { ai_nosessionsfound2 as "ai.noSessionsFound" }