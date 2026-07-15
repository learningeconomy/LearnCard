/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Joiningnet2Inputs */

const en_networkprompts_joiningnet2 = /** @type {(inputs: Networkprompts_Joiningnet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Joining Network...`)
};

const es_networkprompts_joiningnet2 = /** @type {(inputs: Networkprompts_Joiningnet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Uniéndose a la Red...`)
};

const fr_networkprompts_joiningnet2 = /** @type {(inputs: Networkprompts_Joiningnet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connexion au réseau...`)
};

const ar_networkprompts_joiningnet2 = /** @type {(inputs: Networkprompts_Joiningnet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Joining Network...`)
};

/**
* | output |
* | --- |
* | "Joining Network..." |
*
* @param {Networkprompts_Joiningnet2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_joiningnet2 = /** @type {((inputs?: Networkprompts_Joiningnet2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Joiningnet2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_joiningnet2(inputs)
	if (locale === "es") return es_networkprompts_joiningnet2(inputs)
	if (locale === "fr") return fr_networkprompts_joiningnet2(inputs)
	return ar_networkprompts_joiningnet2(inputs)
});
export { networkprompts_joiningnet2 as "networkPrompts.joiningNet" }