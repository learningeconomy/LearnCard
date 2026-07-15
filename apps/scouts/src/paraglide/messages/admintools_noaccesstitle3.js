/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Noaccesstitle3Inputs */

const en_admintools_noaccesstitle3 = /** @type {(inputs: Admintools_Noaccesstitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Heyyyy, wait a minute. You shouldn't be here 🙅`)
};

const es_admintools_noaccesstitle3 = /** @type {(inputs: Admintools_Noaccesstitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Heyyy, espera un momento. No deberías estar aquí 🙅`)
};

const fr_admintools_noaccesstitle3 = /** @type {(inputs: Admintools_Noaccesstitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hééé, attendez une minute. Vous ne devriez pas être ici 🙅`)
};

const ar_admintools_noaccesstitle3 = /** @type {(inputs: Admintools_Noaccesstitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هيّا، انتظر لحظة. لا يجب أن تكون هنا 🙅`)
};

/**
* | output |
* | --- |
* | "Heyyyy, wait a minute. You shouldn't be here 🙅" |
*
* @param {Admintools_Noaccesstitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_noaccesstitle3 = /** @type {((inputs?: Admintools_Noaccesstitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Noaccesstitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_noaccesstitle3(inputs)
	if (locale === "es") return es_admintools_noaccesstitle3(inputs)
	if (locale === "fr") return fr_admintools_noaccesstitle3(inputs)
	return ar_admintools_noaccesstitle3(inputs)
});
export { admintools_noaccesstitle3 as "adminTools.noAccessTitle" }