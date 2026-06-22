/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Guardianlinked_Gotit2Inputs */

const en_onboarding_guardianlinked_gotit2 = /** @type {(inputs: Onboarding_Guardianlinked_Gotit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Got it`)
};

const es_onboarding_guardianlinked_gotit2 = /** @type {(inputs: Onboarding_Guardianlinked_Gotit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Entendido`)
};

const fr_onboarding_guardianlinked_gotit2 = /** @type {(inputs: Onboarding_Guardianlinked_Gotit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compris`)
};

const ar_onboarding_guardianlinked_gotit2 = /** @type {(inputs: Onboarding_Guardianlinked_Gotit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فهمت`)
};

/**
* | output |
* | --- |
* | "Got it" |
*
* @param {Onboarding_Guardianlinked_Gotit2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_guardianlinked_gotit2 = /** @type {((inputs?: Onboarding_Guardianlinked_Gotit2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Guardianlinked_Gotit2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_guardianlinked_gotit2(inputs)
	if (locale === "es") return es_onboarding_guardianlinked_gotit2(inputs)
	if (locale === "fr") return fr_onboarding_guardianlinked_gotit2(inputs)
	return ar_onboarding_guardianlinked_gotit2(inputs)
});
export { onboarding_guardianlinked_gotit2 as "onboarding.guardianLinked.gotIt" }