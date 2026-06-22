/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Createprofile_Nameplaceholder2Inputs */

const en_createprofile_nameplaceholder2 = /** @type {(inputs: Createprofile_Nameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Name`)
};

const es_createprofile_nameplaceholder2 = /** @type {(inputs: Createprofile_Nameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre`)
};

const fr_createprofile_nameplaceholder2 = /** @type {(inputs: Createprofile_Nameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom`)
};

const ar_createprofile_nameplaceholder2 = /** @type {(inputs: Createprofile_Nameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاسم`)
};

/**
* | output |
* | --- |
* | "Name" |
*
* @param {Createprofile_Nameplaceholder2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const createprofile_nameplaceholder2 = /** @type {((inputs?: Createprofile_Nameplaceholder2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Createprofile_Nameplaceholder2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_createprofile_nameplaceholder2(inputs)
	if (locale === "es") return es_createprofile_nameplaceholder2(inputs)
	if (locale === "fr") return fr_createprofile_nameplaceholder2(inputs)
	return ar_createprofile_nameplaceholder2(inputs)
});
export { createprofile_nameplaceholder2 as "createProfile.namePlaceholder" }