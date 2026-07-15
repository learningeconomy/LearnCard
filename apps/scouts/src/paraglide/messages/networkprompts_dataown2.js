/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Dataown2Inputs */

const en_networkprompts_dataown2 = /** @type {(inputs: Networkprompts_Dataown2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You own your own data.`)
};

const es_networkprompts_dataown2 = /** @type {(inputs: Networkprompts_Dataown2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tus datos te pertenecen.`)
};

const fr_networkprompts_dataown2 = /** @type {(inputs: Networkprompts_Dataown2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous possédez vos propres données.`)
};

const ar_networkprompts_dataown2 = /** @type {(inputs: Networkprompts_Dataown2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنت تملك بياناتك.`)
};

/**
* | output |
* | --- |
* | "You own your own data." |
*
* @param {Networkprompts_Dataown2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_dataown2 = /** @type {((inputs?: Networkprompts_Dataown2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Dataown2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_dataown2(inputs)
	if (locale === "es") return es_networkprompts_dataown2(inputs)
	if (locale === "fr") return fr_networkprompts_dataown2(inputs)
	return ar_networkprompts_dataown2(inputs)
});
export { networkprompts_dataown2 as "networkPrompts.dataOwn" }