/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Setupprof2Inputs */

const en_networkprompts_setupprof2 = /** @type {(inputs: Networkprompts_Setupprof2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set up your profile to get started!`)
};

const es_networkprompts_setupprof2 = /** @type {(inputs: Networkprompts_Setupprof2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Configura tu perfil para empezar!`)
};

const fr_networkprompts_setupprof2 = /** @type {(inputs: Networkprompts_Setupprof2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurez votre profil pour commencer !`)
};

const ar_networkprompts_setupprof2 = /** @type {(inputs: Networkprompts_Setupprof2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بإعداد ملفك الشخصي للبدء!`)
};

/**
* | output |
* | --- |
* | "Set up your profile to get started!" |
*
* @param {Networkprompts_Setupprof2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_setupprof2 = /** @type {((inputs?: Networkprompts_Setupprof2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Setupprof2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_setupprof2(inputs)
	if (locale === "es") return es_networkprompts_setupprof2(inputs)
	if (locale === "fr") return fr_networkprompts_setupprof2(inputs)
	return ar_networkprompts_setupprof2(inputs)
});
export { networkprompts_setupprof2 as "networkPrompts.setupProf" }