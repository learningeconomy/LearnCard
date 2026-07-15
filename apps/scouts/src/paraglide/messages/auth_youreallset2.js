/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Youreallset2Inputs */

const en_auth_youreallset2 = /** @type {(inputs: Auth_Youreallset2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You're all set.`)
};

const es_auth_youreallset2 = /** @type {(inputs: Auth_Youreallset2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todo listo.`)
};

const fr_auth_youreallset2 = /** @type {(inputs: Auth_Youreallset2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout est prêt.`)
};

const ar_auth_youreallset2 = /** @type {(inputs: Auth_Youreallset2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كل شيء جاهز.`)
};

/**
* | output |
* | --- |
* | "You're all set." |
*
* @param {Auth_Youreallset2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_youreallset2 = /** @type {((inputs?: Auth_Youreallset2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Youreallset2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_youreallset2(inputs)
	if (locale === "es") return es_auth_youreallset2(inputs)
	if (locale === "fr") return fr_auth_youreallset2(inputs)
	return ar_auth_youreallset2(inputs)
});
export { auth_youreallset2 as "auth.youreAllSet" }