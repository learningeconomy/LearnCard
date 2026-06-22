/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Createprofile_Taglineplaceholder2Inputs */

const en_createprofile_taglineplaceholder2 = /** @type {(inputs: Createprofile_Taglineplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tagline`)
};

const es_createprofile_taglineplaceholder2 = /** @type {(inputs: Createprofile_Taglineplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eslogan`)
};

const fr_createprofile_taglineplaceholder2 = /** @type {(inputs: Createprofile_Taglineplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Slogan`)
};

const ar_createprofile_taglineplaceholder2 = /** @type {(inputs: Createprofile_Taglineplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شعار`)
};

/**
* | output |
* | --- |
* | "Tagline" |
*
* @param {Createprofile_Taglineplaceholder2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const createprofile_taglineplaceholder2 = /** @type {((inputs?: Createprofile_Taglineplaceholder2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Createprofile_Taglineplaceholder2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_createprofile_taglineplaceholder2(inputs)
	if (locale === "es") return es_createprofile_taglineplaceholder2(inputs)
	if (locale === "fr") return fr_createprofile_taglineplaceholder2(inputs)
	return ar_createprofile_taglineplaceholder2(inputs)
});
export { createprofile_taglineplaceholder2 as "createProfile.taglinePlaceholder" }