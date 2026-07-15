/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Sharepinlink3Inputs */

const en_credsbundle_sharepinlink3 = /** @type {(inputs: Credsbundle_Sharepinlink3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share your PIN and this link:`)
};

const es_credsbundle_sharepinlink3 = /** @type {(inputs: Credsbundle_Sharepinlink3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comparte tu PIN y este enlace:`)
};

const fr_credsbundle_sharepinlink3 = /** @type {(inputs: Credsbundle_Sharepinlink3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partagez votre code PIN et ce lien :`)
};

const ar_credsbundle_sharepinlink3 = /** @type {(inputs: Credsbundle_Sharepinlink3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share your PIN and this link:`)
};

/**
* | output |
* | --- |
* | "Share your PIN and this link:" |
*
* @param {Credsbundle_Sharepinlink3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_sharepinlink3 = /** @type {((inputs?: Credsbundle_Sharepinlink3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Sharepinlink3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_sharepinlink3(inputs)
	if (locale === "es") return es_credsbundle_sharepinlink3(inputs)
	if (locale === "fr") return fr_credsbundle_sharepinlink3(inputs)
	return ar_credsbundle_sharepinlink3(inputs)
});
export { credsbundle_sharepinlink3 as "credsBundle.sharePinLink" }